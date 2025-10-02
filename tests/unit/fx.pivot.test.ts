import { describe, it, expect } from 'vitest';

import { pivotRate } from '@/lib/fxDaily';

describe('pivotRate', () => {
  it('computes cross via base', () => {
    const quotes = { USDPLN: 3.6, USDTRY: 40 };
    // from TRY to PLN: (USDPLN / USDTRY) = 3.6 / 40 = 0.09
    const r = pivotRate(quotes, 'USD', 'TRY', 'PLN');
    expect(r).toBeCloseTo(0.09, 5);
  });
  it('returns null when missing leg', () => {
    const quotes = { USDPLN: 3.6 };
    const r = pivotRate(quotes, 'USD', 'TRY', 'PLN');
    expect(r).toBeNull();
  });
});
