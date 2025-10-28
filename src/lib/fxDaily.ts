import { getFxRate } from './fx';

// Utility to manage daily cached quotes (base-focused) inside the database.
// We assume server-side usage where a Supabase client is available (passed in).
// Table: fx_daily_cache (base_currency, rate_date, provider, quotes)
// Quotes shape expected: { USDPLN: number, USDTRY: number, ... }

export interface DailyCacheRow {
  id: string;
  base_currency: string;
  rate_date: string; // YYYY-MM-DD
  provider: string;
  quotes: Record<string, number>;
  fetched_at: string;
  source_api?: string | null;
}

function todayUTC(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getOrFetchDailyQuotes(supabase: any, base: string): Promise<DailyCacheRow | null> {
  const date = todayUTC();
  const { data } = await supabase
    .from('fx_daily_cache')
    .select('*')
    .eq('base_currency', base.toUpperCase())
    .eq('rate_date', date)
    .single();
  if (data) return data as DailyCacheRow;
  // If not present, we attempt to fetch at least key pairs lazily when needed via getFxRate.
  return null;
}

// Full snapshot seeding: fetch /live quotes for base USD once per day and store entire quotes set.
// Only runs if there is no row for today.
export async function seedFullDailyIfAbsent(supabase: any, base = 'USD'): Promise<boolean> {
  const existing = await getOrFetchDailyQuotes(supabase, base);
  if (existing) return false; // already seeded today
  // We rely on underlying provider; call its live endpoint directly using fetch for completeness.
  try {
    const env: any = (import.meta as any).env || {};
    const BASE_ENDPOINT = env.PUBLIC_FX_API_BASE || 'https://api.exchangerate.host';
    const API_KEY = env.EXCHANGERATE_API_KEY;
    let url = `${BASE_ENDPOINT.replace(/\/$/, '')}/live?source=${encodeURIComponent(base.toUpperCase())}`;
    if (API_KEY && /exchangerate\.host$/i.test(new URL(BASE_ENDPOINT).host)) {
      url += `&access_key=${encodeURIComponent(API_KEY)}`;
    }
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return false;
    const json: any = await res.json();
    if (!json || json.success === false || !json.quotes || typeof json.quotes !== 'object') return false;
    // Filter numeric finite positive quotes only
    const filtered: Record<string, number> = {};
    for (const [k, v] of Object.entries(json.quotes)) {
      if (typeof v === 'number' && isFinite(v) && v > 0) filtered[k] = v;
    }
    if (Object.keys(filtered).length === 0) return false;
    await upsertDailyQuotes(supabase, base.toUpperCase(), 'exchangerate.host', filtered, 'live-snapshot');
    return true;
  } catch {
    return false;
  }
}

// Pivot conversion using a stored USD (or other base) quotes map.
// If we have base=B and want A->C and only have BA, BC (meaning B is common base), rate(A->C) = (B C)/(B A)
export function pivotRate(quotes: Record<string, number>, base: string, from: string, to: string): number | null {
  const b = base.toUpperCase();
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return 1;
  const keyFT = `${b}${f}`; // base->from
  const keyTT = `${b}${t}`; // base->to
  const rateBF = quotes[keyFT];
  const rateBT = quotes[keyTT];
  if (typeof rateBF !== 'number' || typeof rateBT !== 'number' || rateBF === 0) return null;
  // base->to divided by base->from gives from->to
  return Number((rateBT / rateBF).toFixed(6));
}

// Insert daily quotes blob (idempotent) - caller ensures provider normalization.
export async function upsertDailyQuotes(
  supabase: any,
  base: string,
  provider: string,
  quotes: Record<string, number>,
  source_api?: string
) {
  const date = todayUTC();
  const upperBase = base.toUpperCase();
  // Fetch existing to merge
  const { data: existing } = await supabase
    .from('fx_daily_cache')
    .select('id, quotes')
    .eq('base_currency', upperBase)
    .eq('rate_date', date)
    .eq('provider', provider)
    .single();
  let merged = quotes;
  if (existing && existing.quotes) {
    merged = { ...(existing.quotes as any), ...quotes };
  }
  await supabase.from('fx_daily_cache').upsert(
    {
      base_currency: upperBase,
      rate_date: date,
      provider,
      quotes: merged,
      source_api: source_api || null,
    },
    { onConflict: 'base_currency,rate_date,provider' }
  );
}

async function ensureUsdLegs(supabase: any, symbols: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const sym of symbols) {
    if (sym.toUpperCase() === 'USD') continue;
    try {
      const { rate, source, warning } = await getFxRate('USD', sym.toUpperCase());
      if (rate && isFinite(rate) && rate > 0 && source !== 'fallback' && !warning) {
        out[`USD${sym.toUpperCase()}`] = rate;
      }
    } catch {
      /* ignore individual leg */
    }
  }
  return out;
}

// Attempt to convert using daily cached quotes; if not possible, returns null.
export async function convertUsingDailyCache(
  supabase: any,
  from: string,
  to: string,
  preferredBases: string[] = ['USD']
): Promise<{ rate: number; base: string } | null> {
  // Step 1: try existing cache
  for (const base of preferredBases) {
    const row = await getOrFetchDailyQuotes(supabase, base);
    if (!row) continue;
    const rate = pivotRate(row.quotes as any, base, from, to);
    if (rate) return { rate, base };
  }
  // Step 2: attempt full snapshot seed (USD only) if absent today
  if (!preferredBases.includes('USD')) preferredBases.unshift('USD');
  const snapshotSeeded = await seedFullDailyIfAbsent(supabase, 'USD');
  if (snapshotSeeded) {
    const row = await getOrFetchDailyQuotes(supabase, 'USD');
    if (row) {
      const rate = pivotRate(row.quotes as any, 'USD', from, to);
      if (rate) return { rate, base: 'USD' };
    }
  }
  // Step 3: if still missing, minimally seed needed legs then pivot
  const legs = await ensureUsdLegs(supabase, [from, to]);
  if (Object.keys(legs).length > 0) {
    await upsertDailyQuotes(supabase, 'USD', 'exchangerate.host', legs, 'auto-seed-legs');
    const row = await getOrFetchDailyQuotes(supabase, 'USD');
    if (row) {
      const rate = pivotRate(row.quotes as any, 'USD', from, to);
      if (rate) return { rate, base: 'USD' };
    }
  }
  return null;
}
