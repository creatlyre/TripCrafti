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
  // API doc: GET /latest?base={from}&symbols={to}
  const url = `${BASE.replace(/\/$/, '')}/latest?base=${encodeURIComponent(from)}&symbols=${encodeURIComponent(to)}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`FX HTTP ${res.status}`);
  const json: any = await res.json();
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
