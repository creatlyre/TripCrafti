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
      json: async () => ({ success: true, quotes: { USDPLN: 3.75 } })
    });
    const res = await getFxRate('USD', 'PLN');
    expect(res.rate).toBe(3.75);
    expect(['live','cache']).toContain(res.source); // first call returns live
  });

  it('falls back to /convert when /live missing quote and no generic rates', async () => {
    global.fetch = vi.fn()
      // live missing quotes and lacks generic rates shape forcing convert path
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, quotes: {} }) })
      // convert endpoint returns result
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, result: 4.01 }) });
    const res = await getFxRate('GBP', 'PLN'); // use GBP to avoid prior USD cache
    expect(res.rate).toBe(4.01);
    expect(['live','cache']).toContain(res.source);
  });

  it('returns fallback when live and convert both fail', async () => {
    global.fetch = vi.fn()
      // live returns success false triggering error
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: false, error: { code: 101, info: 'missing key' } }) })
      // convert attempt fails
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    const res = await getFxRate('CAD', 'PLN'); // use CAD to avoid cache interference
    expect(res.rate).toBe(1);
    expect(res.source).toBe('fallback');
    expect(res.warning).toMatch(/missing key|fx_fetch_failed/i);
  });
});
