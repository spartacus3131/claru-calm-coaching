/**
 * @file types.ts
 * @description Hot Spots type definitions and Zod schemas
 * @module modules/hotspots
 *
 * F027: Hot Spots - Weekly ratings for 7 life areas
 * Per bounded-contexts.mdc: Engagement Tracker owns this data.
 * Per domain-language.mdc: Use "Hot Spots", "life areas", "weekly check-in".
 */

import { z } from 'zod';

/**
 * Default hot spot area identifiers.
 * Users can customize names but these IDs remain stable.
 */
export const HOTSPOT_AREA_IDS = [
  'mind',
  'body',
  'emotions',
  'career',
  'finances',
  'relationships',
  'fun',
] as const;

export type HotSpotAreaId = (typeof HOTSPOT_AREA_IDS)[number];

/**
 * A customizable hot spot area definition.
 */
export interface HotSpotArea {
  id: string;
  name: string;
  description: string;
  color: string;
}

/**
 * A hot spot with its current rating.
 */
export interface HotSpot extends HotSpotArea {
  rating: number;
  notes?: string;
}

/**
 * Database row for hotspot_areas table.
 */
export interface DbHotSpotArea {
  id: string;
  user_id: string;
  area_id: string;
  name: string;
  description: string;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

/**
 * Database row for hotspot_ratings table.
 */
export interface DbHotSpotRating {
  id: string;
  user_id: string;
  week_start: string;
  area: string;
  rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ----- Zod Schemas -----

/**
 * Schema for hot spot area.
 */
export const HotSpotAreaSchema = z.object({
  id: z.string().min(1, 'Area ID is required'),
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  description: z.string().max(200, 'Description too long').default(''),
  color: z.string().regex(/^text-\w+-\d+$/, 'Invalid color format').default('text-violet-500'),
});

/**
 * Schema for hot spot rating (1-10 scale).
 */
export const HotSpotRatingSchema = z.object({
  area: z.string().min(1, 'Area is required'),
  rating: z.number().int().min(1).max(10),
  notes: z.string().max(500, 'Notes too long').optional(),
});

/**
 * Schema for upserting custom areas.
 */
export const UpsertAreasSchema = z.object({
  areas: z.array(HotSpotAreaSchema).min(1, 'At least one area required').max(10, 'Maximum 10 areas'),
});

/**
 * Schema for upserting weekly ratings.
 */
export const UpsertRatingsSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Week start must be YYYY-MM-DD'),
  ratings: z.array(HotSpotRatingSchema).min(1, 'At least one rating required'),
  weeklyReflection: z.string().max(2000, 'Reflection too long').optional(),
});

// ----- Type exports from schemas -----

export type UpsertAreasInput = z.infer<typeof UpsertAreasSchema>;
export type UpsertRatingsInput = z.infer<typeof UpsertRatingsSchema>;
export type HotSpotRatingInput = z.infer<typeof HotSpotRatingSchema>;
