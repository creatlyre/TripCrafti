import { describe, it, expect, vi, afterEach } from 'vitest';

import { getFxRate } from '@/lib/fx';

// We mock fetch to simulate /live then /convert fallback behaviors.

const originalFetch = global.fetch;

describe('fx live endpoint parsing', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('parses /live quotes key', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, quotes: { USDPLN: 3.75 } }),
    });
    const res = await getFxRate('USD', 'PLN');
    expect(res.rate).toBe(3.75);
    expect(['live', 'cache']).toContain(res.source); // first call returns live
  });

  it('falls back to /convert when /live missing quote', async () => {
    global.fetch = vi
      .fn()
      // live missing
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, quotes: {} }) })
      // convert
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, result: 4.01 }) });

    const res = await getFxRate('USD', 'PLN');
    expect(res.rate).toBe(4.01);
  });

  it('returns fallback when both fail', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: { code: 101, info: 'missing key' } }),
      })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    const res = await getFxRate('USD', 'PLN');
    expect(res.rate).toBe(1); // fallback
    expect(res.source).toBe('fallback');
    expect(res.warning).toBeTruthy();
  });
});
