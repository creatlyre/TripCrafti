import { describe, it, expect } from 'vitest';

import { computeDailySpendTarget } from '../../src/lib/utils';

describe('computeDailySpendTarget', () => {
  it('returns null when remaining null', () => {
    expect(computeDailySpendTarget(null, '2025-01-01', '2025-01-05', new Date('2025-01-02T12:00:00Z'))).toBeNull();
  });
  it('returns 0 when trip finished', () => {
    expect(computeDailySpendTarget(100, '2025-01-01', '2025-01-05', new Date('2025-01-10T00:00:00Z'))).toBe(0);
  });
  it('distributes remaining across days left inclusive', () => {
    // Trip Jan 1 - Jan 5; now Jan 2 => days left = 4 (2,3,4,5)
    const val = computeDailySpendTarget(400, '2025-01-01', '2025-01-05', new Date('2025-01-02T10:00:00Z'));
    expect(val).toBeCloseTo(100);
  });
  it('uses start date if trip not started yet', () => {
    const val = computeDailySpendTarget(500, '2025-01-10', '2025-01-14', new Date('2025-01-01T00:00:00Z'));
    // 5 days inclusive -> 100
    expect(val).toBeCloseTo(100);
  });
});
