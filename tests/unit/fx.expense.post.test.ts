import { describe, it, expect } from 'vitest';

// NOTE: This is a placeholder illustrating the intent to test FX normalization logic.
// In current setup, calling the actual POST endpoint would require a running Supabase instance.
// Here we simply assert that the convertAmount helper behaves as expected for identity and fallback semantics.
import { convertAmount } from '@/lib/fx';

describe('FX conversion helper', () => {
  it('returns identity for same currency', async () => {
    const { value, meta } = await convertAmount(100, 'PLN', 'PLN');
    expect(value).toBe(100);
    expect(meta.source).toBe('identity');
    expect(meta.rate).toBe(1);
  });

  it('handles live/fallback structure (cannot guarantee live without network)', async () => {
    const { meta } = await convertAmount(1, 'USD', 'EUR');
    // We only assert presence of fields, not exact rate, to keep test deterministic offline
    expect(typeof meta.rate).toBe('number');
    expect(['live', 'cache', 'fallback', 'identity']).toContain(meta.source);
  });
});
