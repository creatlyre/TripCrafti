import { describe, it, expect } from 'vitest';

import { PackingListMetaSchema } from '@/lib/schemas/packingSchemas';

describe('PackingListMetaSchema regenerationCount', () => {
  it('accepts regenerationCount when provided', () => {
    const meta = {
      destination: 'Paris',
      days: 5,
      people: { adults: 2, children: 1 },
      season: 'Summer',
      transport: 'Plane',
      accommodation: 'Hotel',
      activities: ['museum'],
      archetype: 'City Break',
      regenerationCount: 1,
    };
    const parsed = PackingListMetaSchema.parse(meta);
    expect(parsed.regenerationCount).toBe(1);
  });

  it('normalizes null regenerationCount to undefined', () => {
    const meta = {
      destination: 'Rome',
      days: 3,
      people: { adults: 1, children: 0 },
      season: 'Summer',
      transport: null,
      accommodation: null,
      activities: null,
      archetype: null,
      regenerationCount: null,
    };
    const parsed = PackingListMetaSchema.parse(meta);
    expect(parsed.regenerationCount).toBeUndefined();
  });
});
