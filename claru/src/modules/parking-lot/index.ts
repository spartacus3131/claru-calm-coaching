/**
 * @file index.ts
 * @description Parking Lot Manager module exports
 * @module parking-lot
 *
 * The Parking Lot Manager handles items parked for later review.
 * Per bounded-contexts.mdc: This is a supporting context that stores
 * deferred items and manages weekly review cycles.
 *
 * Features:
 * - F026: Parking Lot (CRUD operations, state machine)
 */

export {
  // Schemas
  ParkedItemSchema,
  CreateParkedItemSchema,
  UpdateParkedItemSchema,
  ParkedItemStatusSchema,
  ParkedItemSourceSchema,
  // Converters
  toParkedItem,
  toDbInsert,
  toDbUpdate,
  // Utilities
  getDaysParked,
  isStale,
  canTransitionTo,
  formatDaysParkedLabel,
  sortByParkedDate,
  filterByStatus,
  getStaleItems,
  isAtCapacity,
  // Constants
  PARKING_LOT_LIMIT,
  STALE_THRESHOLD_DAYS,
  // Types
  type ParkedItem,
  type CreateParkedItemInput,
  type UpdateParkedItemInput,
  type ParkedItemStatus,
  type ParkedItemSource,
  type DbParkedItem,
  type DbParkedItemInsert,
  type DbParkedItemUpdate,
} from './parkedItems';
