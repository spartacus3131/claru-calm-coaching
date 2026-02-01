/**
 * @file index.ts
 * @description Hot Spots module exports
 * @module modules/hotspots
 *
 * F027: Hot Spots - Weekly ratings for 7 life areas
 */

// Types
export type {
  HotSpotArea,
  HotSpot,
  HotSpotAreaId,
  DbHotSpotArea,
  DbHotSpotRating,
  UpsertAreasInput,
  UpsertRatingsInput,
  HotSpotRatingInput,
} from './types';

// Schemas
export {
  HOTSPOT_AREA_IDS,
  HotSpotAreaSchema,
  HotSpotRatingSchema,
  UpsertAreasSchema,
  UpsertRatingsSchema,
} from './types';

// Data and utilities
export {
  DEFAULT_HOTSPOT_AREAS,
  getDefaultHotSpots,
  toHotSpotArea,
  toDbArea,
  toRating,
  toDbRating,
  mergeAreasWithRatings,
  calculateBalance,
  findLowestSpot,
  findHighestSpot,
  generateHotSpotsSummary,
} from './data';
