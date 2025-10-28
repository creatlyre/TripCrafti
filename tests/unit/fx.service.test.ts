import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getFxRate, convertAmount } from '@/lib/fx';

// Mock global fetch
const g: any = globalThis;

describe('fx service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns identity rate when currencies match', async () => {
    const r = await getFxRate('EUR', 'EUR');
    expect(r.rate).toBe(1);
    expect(r.source).toBe('identity');
  });

  it('fetches and caches rate', async () => {
    g.fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ rates: { PLN: 4.2 } }) });
    const r1 = await getFxRate('EUR', 'PLN');
    expect(r1.rate).toBe(4.2);
    expect(r1.source).toBe('live');
    const r2 = await getFxRate('EUR', 'PLN');
    expect(r2.source).toBe('cache');
  });

  it('falls back gracefully on error', async () => {
    g.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 });
    const r = await getFxRate('USD', 'JPY');
    expect(r.rate).toBe(1);
    expect(r.source).toBe('fallback');
    expect(r.warning).toBeTruthy();
  });

  it('converts amount using fetched rate', async () => {
    g.fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ rates: { USD: 1.1 } }) });
    const { value, meta } = await convertAmount(100, 'EUR', 'USD');
    expect(meta.rate).toBe(1.1);
    expect(value).toBe(110);
  });
});
