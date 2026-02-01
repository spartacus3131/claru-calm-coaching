/**
 * @file data.ts
 * @description Default hot spot areas and utility functions
 * @module modules/hotspots
 *
 * F027: Hot Spots - Weekly ratings for 7 life areas
 * Per domain-language.mdc: Use "Hot Spots", "life areas", "weekly check-in".
 */

import type { HotSpotArea, HotSpot, DbHotSpotArea, DbHotSpotRating } from './types';

/**
 * Default hot spot areas based on the "7 Areas of Life" framework.
 * Users can customize these but this is the starting point.
 */
export const DEFAULT_HOTSPOT_AREAS: HotSpotArea[] = [
  {
    id: 'mind',
    name: 'Mind',
    description: 'Learning, growth, mental clarity',
    color: 'text-violet-500',
  },
  {
    id: 'body',
    name: 'Body',
    description: 'Physical health, energy, exercise',
    color: 'text-rose-500',
  },
  {
    id: 'emotions',
    name: 'Emotions',
    description: 'Mood, stress, emotional balance',
    color: 'text-amber-500',
  },
  {
    id: 'career',
    name: 'Career',
    description: 'Work, projects, professional growth',
    color: 'text-blue-500',
  },
  {
    id: 'finances',
    name: 'Finances',
    description: 'Money, savings, financial health',
    color: 'text-emerald-500',
  },
  {
    id: 'relationships',
    name: 'Relationships',
    description: 'Family, friends, connections',
    color: 'text-pink-500',
  },
  {
    id: 'fun',
    name: 'Fun',
    description: 'Hobbies, leisure, enjoyment',
    color: 'text-orange-500',
  },
];

/**
 * Get default hot spots with initial rating of 5.
 */
export function getDefaultHotSpots(): HotSpot[] {
  return DEFAULT_HOTSPOT_AREAS.map((area) => ({
    ...area,
    rating: 5,
  }));
}

/**
 * Convert database area row to HotSpotArea.
 */
export function toHotSpotArea(db: DbHotSpotArea): HotSpotArea {
  return {
    id: db.area_id,
    name: db.name,
    description: db.description,
    color: db.color,
  };
}

/**
 * Convert HotSpotArea to database insert/update format.
 */
export function toDbArea(area: HotSpotArea, userId: string, position: number): Omit<DbHotSpotArea, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    area_id: area.id,
    name: area.name,
    description: area.description,
    color: area.color,
    position,
  };
}

/**
 * Convert database rating row to a partial rating object.
 */
export function toRating(db: DbHotSpotRating): { area: string; rating: number; notes?: string; updatedAt: string } {
  return {
    area: db.area,
    rating: db.rating,
    notes: db.notes ?? undefined,
    updatedAt: db.updated_at,
  };
}

/**
 * Convert HotSpot to database rating format.
 */
export function toDbRating(
  spot: HotSpot,
  userId: string,
  weekStart: string
): Omit<DbHotSpotRating, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    week_start: weekStart,
    area: spot.id,
    rating: spot.rating,
    notes: spot.notes ?? null,
  };
}

/**
 * Merge custom areas with ratings to create HotSpot array.
 */
export function mergeAreasWithRatings(
  areas: HotSpotArea[],
  ratings: Array<{ area: string; rating: number; notes?: string }>
): HotSpot[] {
  return areas.map((area) => {
    const rating = ratings.find((r) => r.area === area.id);
    return {
      ...area,
      rating: rating?.rating ?? 5,
      notes: rating?.notes,
    };
  });
}

/**
 * Calculate overall balance score (average of all ratings).
 */
export function calculateBalance(hotSpots: HotSpot[]): number {
  if (hotSpots.length === 0) return 0;
  const sum = hotSpots.reduce((acc, spot) => acc + spot.rating, 0);
  return sum / hotSpots.length;
}

/**
 * Find the lowest-rated hot spot.
 */
export function findLowestSpot(hotSpots: HotSpot[]): HotSpot | null {
  if (hotSpots.length === 0) return null;
  return hotSpots.reduce((lowest, spot) => (spot.rating < lowest.rating ? spot : lowest), hotSpots[0]);
}

/**
 * Find the highest-rated hot spot.
 */
export function findHighestSpot(hotSpots: HotSpot[]): HotSpot | null {
  if (hotSpots.length === 0) return null;
  return hotSpots.reduce((highest, spot) => (spot.rating > highest.rating ? spot : highest), hotSpots[0]);
}

/**
 * Generate a summary string for the AI coach.
 */
export function generateHotSpotsSummary(hotSpots: HotSpot[], weeklyReflection?: string): string {
  const average = calculateBalance(hotSpots);
  const lowest = findLowestSpot(hotSpots);
  const highest = findHighestSpot(hotSpots);

  const ratingsText = hotSpots.map((s) => `${s.name}: ${s.rating}/10`).join(', ');

  const reflectionSection = weeklyReflection?.trim()
    ? `\n\nMy reflection:\n${weeklyReflection.trim()}`
    : '';

  return `[Hot Spots Weekly Check-in]
My ratings this week: ${ratingsText}

Overall balance: ${average.toFixed(1)}/10
Strongest area: ${highest?.name ?? 'N/A'} (${highest?.rating ?? 0}/10)
Area needing attention: ${lowest?.name ?? 'N/A'} (${lowest?.rating ?? 0}/10)${reflectionSection}

Please give me a brief, supportive reflection on my life balance this week.`;
}
