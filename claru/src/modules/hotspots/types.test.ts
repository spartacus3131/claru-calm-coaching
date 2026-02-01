/**
 * @file types.test.ts
 * @description Tests for Hot Spots types and Zod schemas
 * @module modules/hotspots
 *
 * Per 001-tdd.mdc: Tests define WHAT should happen.
 */

import {
  HotSpotAreaSchema,
  HotSpotRatingSchema,
  UpsertAreasSchema,
  UpsertRatingsSchema,
  HOTSPOT_AREA_IDS,
} from './types';

describe('HOTSPOT_AREA_IDS', () => {
  it('should have 7 default area IDs', () => {
    expect(HOTSPOT_AREA_IDS).toHaveLength(7);
  });

  it('should include expected areas', () => {
    expect(HOTSPOT_AREA_IDS).toContain('mind');
    expect(HOTSPOT_AREA_IDS).toContain('body');
    expect(HOTSPOT_AREA_IDS).toContain('emotions');
    expect(HOTSPOT_AREA_IDS).toContain('career');
    expect(HOTSPOT_AREA_IDS).toContain('finances');
    expect(HOTSPOT_AREA_IDS).toContain('relationships');
    expect(HOTSPOT_AREA_IDS).toContain('fun');
  });
});

describe('HotSpotAreaSchema', () => {
  it('should accept valid area', () => {
    const result = HotSpotAreaSchema.safeParse({
      id: 'mind',
      name: 'Mind',
      description: 'Learning and growth',
      color: 'text-violet-500',
    });
    expect(result.success).toBe(true);
  });

  it('should require id', () => {
    const result = HotSpotAreaSchema.safeParse({
      id: '',
      name: 'Mind',
    });
    expect(result.success).toBe(false);
  });

  it('should require name', () => {
    const result = HotSpotAreaSchema.safeParse({
      id: 'mind',
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('should enforce name max length', () => {
    const result = HotSpotAreaSchema.safeParse({
      id: 'mind',
      name: 'a'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('should enforce valid color format', () => {
    const result = HotSpotAreaSchema.safeParse({
      id: 'mind',
      name: 'Mind',
      color: 'invalid-color',
    });
    expect(result.success).toBe(false);
  });

  it('should use defaults for optional fields', () => {
    const result = HotSpotAreaSchema.safeParse({
      id: 'mind',
      name: 'Mind',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('');
      expect(result.data.color).toBe('text-violet-500');
    }
  });
});

describe('HotSpotRatingSchema', () => {
  it('should accept valid rating', () => {
    const result = HotSpotRatingSchema.safeParse({
      area: 'mind',
      rating: 7,
    });
    expect(result.success).toBe(true);
  });

  it('should require rating between 1 and 10', () => {
    expect(HotSpotRatingSchema.safeParse({ area: 'mind', rating: 0 }).success).toBe(false);
    expect(HotSpotRatingSchema.safeParse({ area: 'mind', rating: 11 }).success).toBe(false);
    expect(HotSpotRatingSchema.safeParse({ area: 'mind', rating: 1 }).success).toBe(true);
    expect(HotSpotRatingSchema.safeParse({ area: 'mind', rating: 10 }).success).toBe(true);
  });

  it('should require integer ratings', () => {
    const result = HotSpotRatingSchema.safeParse({
      area: 'mind',
      rating: 7.5,
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional notes', () => {
    const result = HotSpotRatingSchema.safeParse({
      area: 'mind',
      rating: 7,
      notes: 'Feeling clear-headed this week',
    });
    expect(result.success).toBe(true);
  });
});

describe('UpsertAreasSchema', () => {
  it('should accept valid areas array', () => {
    const result = UpsertAreasSchema.safeParse({
      areas: [
        { id: 'mind', name: 'Mind' },
        { id: 'body', name: 'Body' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should require at least one area', () => {
    const result = UpsertAreasSchema.safeParse({ areas: [] });
    expect(result.success).toBe(false);
  });

  it('should limit to 10 areas maximum', () => {
    const areas = Array.from({ length: 11 }, (_, i) => ({
      id: `area-${i}`,
      name: `Area ${i}`,
    }));
    const result = UpsertAreasSchema.safeParse({ areas });
    expect(result.success).toBe(false);
  });
});

describe('UpsertRatingsSchema', () => {
  it('should accept valid ratings', () => {
    const result = UpsertRatingsSchema.safeParse({
      weekStart: '2026-01-27',
      ratings: [
        { area: 'mind', rating: 7 },
        { area: 'body', rating: 5 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should require valid week start format', () => {
    const result = UpsertRatingsSchema.safeParse({
      weekStart: '2026-1-27',
      ratings: [{ area: 'mind', rating: 7 }],
    });
    expect(result.success).toBe(false);
  });

  it('should accept optional weekly reflection', () => {
    const result = UpsertRatingsSchema.safeParse({
      weekStart: '2026-01-27',
      ratings: [{ area: 'mind', rating: 7 }],
      weeklyReflection: 'Good week overall',
    });
    expect(result.success).toBe(true);
  });

  it('should limit reflection length', () => {
    const result = UpsertRatingsSchema.safeParse({
      weekStart: '2026-01-27',
      ratings: [{ area: 'mind', rating: 7 }],
      weeklyReflection: 'a'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});
