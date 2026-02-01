/**
 * @file data.test.ts
 * @description Tests for Hot Spots data and utility functions
 * @module modules/hotspots
 *
 * Per 001-tdd.mdc: Tests define WHAT should happen.
 */

import {
  DEFAULT_HOTSPOT_AREAS,
  getDefaultHotSpots,
  mergeAreasWithRatings,
  calculateBalance,
  findLowestSpot,
  findHighestSpot,
  generateHotSpotsSummary,
  toHotSpotArea,
  toDbArea,
} from './data';
import type { HotSpot, DbHotSpotArea } from './types';

describe('DEFAULT_HOTSPOT_AREAS', () => {
  it('should have 7 default areas', () => {
    expect(DEFAULT_HOTSPOT_AREAS).toHaveLength(7);
  });

  it('should have unique IDs', () => {
    const ids = DEFAULT_HOTSPOT_AREAS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have all required properties', () => {
    DEFAULT_HOTSPOT_AREAS.forEach((area) => {
      expect(area.id).toBeTruthy();
      expect(area.name).toBeTruthy();
      expect(area.description).toBeTruthy();
      expect(area.color).toMatch(/^text-\w+-\d+$/);
    });
  });
});

describe('getDefaultHotSpots', () => {
  it('should return hot spots with default rating of 5', () => {
    const hotSpots = getDefaultHotSpots();
    expect(hotSpots).toHaveLength(7);
    hotSpots.forEach((spot) => {
      expect(spot.rating).toBe(5);
    });
  });
});

describe('mergeAreasWithRatings', () => {
  it('should merge areas with matching ratings', () => {
    const areas = [
      { id: 'mind', name: 'Mind', description: '', color: 'text-violet-500' },
      { id: 'body', name: 'Body', description: '', color: 'text-rose-500' },
    ];
    const ratings = [
      { area: 'mind', rating: 8 },
      { area: 'body', rating: 6 },
    ];

    const result = mergeAreasWithRatings(areas, ratings);

    expect(result[0].rating).toBe(8);
    expect(result[1].rating).toBe(6);
  });

  it('should default to 5 for areas without ratings', () => {
    const areas = [{ id: 'mind', name: 'Mind', description: '', color: 'text-violet-500' }];
    const ratings: Array<{ area: string; rating: number }> = [];

    const result = mergeAreasWithRatings(areas, ratings);

    expect(result[0].rating).toBe(5);
  });

  it('should include notes from ratings', () => {
    const areas = [{ id: 'mind', name: 'Mind', description: '', color: 'text-violet-500' }];
    const ratings = [{ area: 'mind', rating: 8, notes: 'Great week!' }];

    const result = mergeAreasWithRatings(areas, ratings);

    expect(result[0].notes).toBe('Great week!');
  });
});

describe('calculateBalance', () => {
  it('should calculate average of all ratings', () => {
    const hotSpots: HotSpot[] = [
      { id: 'mind', name: 'Mind', description: '', color: '', rating: 8 },
      { id: 'body', name: 'Body', description: '', color: '', rating: 6 },
      { id: 'fun', name: 'Fun', description: '', color: '', rating: 4 },
    ];

    expect(calculateBalance(hotSpots)).toBe(6);
  });

  it('should return 0 for empty array', () => {
    expect(calculateBalance([])).toBe(0);
  });
});

describe('findLowestSpot', () => {
  it('should find the spot with lowest rating', () => {
    const hotSpots: HotSpot[] = [
      { id: 'mind', name: 'Mind', description: '', color: '', rating: 8 },
      { id: 'body', name: 'Body', description: '', color: '', rating: 3 },
      { id: 'fun', name: 'Fun', description: '', color: '', rating: 6 },
    ];

    const lowest = findLowestSpot(hotSpots);
    expect(lowest?.id).toBe('body');
    expect(lowest?.rating).toBe(3);
  });

  it('should return null for empty array', () => {
    expect(findLowestSpot([])).toBeNull();
  });
});

describe('findHighestSpot', () => {
  it('should find the spot with highest rating', () => {
    const hotSpots: HotSpot[] = [
      { id: 'mind', name: 'Mind', description: '', color: '', rating: 8 },
      { id: 'body', name: 'Body', description: '', color: '', rating: 3 },
      { id: 'fun', name: 'Fun', description: '', color: '', rating: 6 },
    ];

    const highest = findHighestSpot(hotSpots);
    expect(highest?.id).toBe('mind');
    expect(highest?.rating).toBe(8);
  });

  it('should return null for empty array', () => {
    expect(findHighestSpot([])).toBeNull();
  });
});

describe('generateHotSpotsSummary', () => {
  it('should generate a formatted summary', () => {
    const hotSpots: HotSpot[] = [
      { id: 'mind', name: 'Mind', description: '', color: '', rating: 8 },
      { id: 'body', name: 'Body', description: '', color: '', rating: 5 },
    ];

    const summary = generateHotSpotsSummary(hotSpots);

    expect(summary).toContain('[Hot Spots Weekly Check-in]');
    expect(summary).toContain('Mind: 8/10');
    expect(summary).toContain('Body: 5/10');
    expect(summary).toContain('Overall balance: 6.5/10');
    expect(summary).toContain('Strongest area: Mind (8/10)');
    expect(summary).toContain('Area needing attention: Body (5/10)');
  });

  it('should include weekly reflection if provided', () => {
    const hotSpots: HotSpot[] = [{ id: 'mind', name: 'Mind', description: '', color: '', rating: 7 }];

    const summary = generateHotSpotsSummary(hotSpots, 'Great week overall!');

    expect(summary).toContain('My reflection:');
    expect(summary).toContain('Great week overall!');
  });

  it('should not include reflection section if empty', () => {
    const hotSpots: HotSpot[] = [{ id: 'mind', name: 'Mind', description: '', color: '', rating: 7 }];

    const summary = generateHotSpotsSummary(hotSpots, '');

    expect(summary).not.toContain('My reflection:');
  });
});

describe('toHotSpotArea', () => {
  it('should convert DB row to HotSpotArea', () => {
    const dbRow: DbHotSpotArea = {
      id: 'uuid',
      user_id: 'user-uuid',
      area_id: 'mind',
      name: 'Mind',
      description: 'Learning',
      color: 'text-violet-500',
      position: 0,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    const result = toHotSpotArea(dbRow);

    expect(result.id).toBe('mind');
    expect(result.name).toBe('Mind');
    expect(result.description).toBe('Learning');
    expect(result.color).toBe('text-violet-500');
  });
});

describe('toDbArea', () => {
  it('should convert HotSpotArea to DB format', () => {
    const area = {
      id: 'mind',
      name: 'Mind',
      description: 'Learning',
      color: 'text-violet-500',
    };

    const result = toDbArea(area, 'user-123', 0);

    expect(result.user_id).toBe('user-123');
    expect(result.area_id).toBe('mind');
    expect(result.name).toBe('Mind');
    expect(result.position).toBe(0);
  });
});
