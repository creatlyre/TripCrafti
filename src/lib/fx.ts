/**
 * Foreign Exchange utility (Phase 3)
 * Fetches conversion rates using a configurable public base endpoint.
 * Provider chosen: https://api.exchangerate.host (no key required)
 *
 * PUBLIC_FX_API_BASE should be set to the base URL (e.g. https://api.exchangerate.host)
 * We cache rates in-memory per process with a TTL (default 6h) and per base currency.
 *
 * Fallback strategy: if fetch fails, return rate=1 with a warning flag so callers can decide
 * whether to proceed. We avoid throwing hard errors to keep expense logging resilient offline.
 */

const BASE = (import.meta as any).env?.PUBLIC_FX_API_BASE || 'https://api.exchangerate.host';
// Optional API key (recently required by exchangerate.host). Server-side only (no PUBLIC_ prefix).
const EX_API_KEY = (import.meta as any).env?.EXCHANGERATE_API_KEY;

interface RateEntry { rate: number; fetched: number; }
const CACHE: Record<string, Record<string, RateEntry>> = {};
const TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export interface FxRateResult { rate: number; source: string; warning?: string; }

function now() { return Date.now(); }

function getCached(from: string, to: string): RateEntry | null {
  const f = CACHE[from]; if (!f) return null; const e = f[to]; if (!e) return null;
  if (now() - e.fetched > TTL_MS) return null; return e;
}

function setCached(from: string, to: string, rate: number) {
  (CACHE[from] ||= {})[to] = { rate, fetched: now() };
}

async function fetchRate(from: string, to: string): Promise<number> {
  const baseUrl = BASE.replace(/\/$/, '');
  let useLive = false;
  let url: string;
  try {
    const host = new URL(BASE).host;
    const isExHost = /exchangerate\.host$/i.test(host);
    // Prefer /live for exchangerate.host because /latest style may not be supported with key
    useLive = isExHost;
    if (useLive) {
      // /live returns quotes keyed as SOURCE+TARGET (e.g., USDPLN). Default source is USD unless &source=FROM
      // We'll request source=FROM so we can directly read FROM+TO key.
      url = `${baseUrl}/live?source=${encodeURIComponent(from)}&currencies=${encodeURIComponent(to)}`;
    } else {
      // Generic /latest pattern
      url = `${baseUrl}/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`;
    }
    // Append key(s) if needed
    if (EX_API_KEY && isExHost && !/[?&](access_key|apikey)=/i.test(url)) {
      url += `&access_key=${encodeURIComponent(EX_API_KEY)}`;
    }
  } catch {
    // Fallback to generic pattern if URL parsing failed
    url = `${baseUrl}/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`;
  }

  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
  const json: any = await res.json();
  if (json && json.success === false) {
    const code = json.error?.code;
    const type = json.error?.type;
    const info = json.error?.info;
    const errMsg = info || type || `fx_provider_error_${code || 'unknown'}`;
    throw new Error(errMsg);
  }
  // Parse depending on shape
  if (useLive) {
    const pairKey = `${from.toUpperCase()}${to.toUpperCase()}`;
    const rate = json?.quotes?.[pairKey];
    if (typeof rate === 'number' && isFinite(rate) && rate > 0) return rate;
    // If live failed to give expected key, attempt secondary /convert call
    try {
      const convertUrl = `${baseUrl}/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=1${EX_API_KEY ? `&access_key=${encodeURIComponent(EX_API_KEY)}` : ''}`;
      const r2 = await fetch(convertUrl, { headers: { 'Accept': 'application/json' } });
      if (r2.ok) {
        const j2: any = await r2.json();
        if (j2 && j2.success !== false && typeof j2.result === 'number') {
          return j2.result; // already amount=1 conversion result
        }
      }
    } catch { /* ignore */ }
    throw new Error('Unexpected live payload');
  }
  // Generic rates shape
  if (!json || typeof json !== 'object' || !json.rates || typeof json.rates[to] !== 'number') {
    throw new Error('Unexpected FX payload');
  }
  return json.rates[to];
}

export async function getFxRate(from: string, to: string): Promise<FxRateResult> {
  const f = from.toUpperCase(); const t = to.toUpperCase();
  if (f === t) return { rate: 1, source: 'identity' };
  const cached = getCached(f, t);
  if (cached) return { rate: cached.rate, source: 'cache' };
  try {
    const rate = await fetchRate(f, t);
    if (!isFinite(rate) || rate <= 0) throw new Error('Invalid rate');
    setCached(f, t, rate);
    return { rate, source: 'live' };
  } catch (e: any) {
    return { rate: 1, source: 'fallback', warning: e.message || 'fx_fetch_failed' };
  }
}

/**
 * Convert an amount from one currency to another using current (cached) rate.
 */
export async function convertAmount(amount: number, from: string, to: string): Promise<{ value: number; meta: FxRateResult; }> {
  const meta = await getFxRate(from, to);
  const value = meta.rate === 1 ? amount : Number((amount * meta.rate).toFixed(2));
  return { value, meta };
}

/**
 * Attempt a batch prefetch for a set of currency pairs (best-effort; failures ignored).
 */
export async function prefetchRates(pairs: Array<[string,string]>) {
  await Promise.allSettled(pairs.map(async ([a,b]) => { await getFxRate(a,b); }));
}
