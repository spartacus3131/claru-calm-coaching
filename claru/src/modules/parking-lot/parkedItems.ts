/**
 * @file parkedItems.ts
 * @description F026 - Parking Lot types and utilities
 * @module parking-lot
 *
 * Manages items parked for later review. Users can park tasks/ideas
 * that are valid but not for today, keeping their daily plan focused.
 *
 * Per bounded-contexts.mdc: Parking Lot Manager owns parked items.
 * Per domain-language.mdc: Use "parked" not "deferred" or "backlog".
 * Per state-machines.mdc: parked → under_review → reactivated | parked | deleted
 */

import { z } from 'zod';

/**
 * Maximum number of items in parking lot.
 * Forces discipline - prevents dumping ground behavior.
 */
export const PARKING_LOT_LIMIT = 50;

/**
 * Days without review before item is flagged as stale.
 */
export const STALE_THRESHOLD_DAYS = 30;

/**
 * Valid parked item statuses.
 * Per state-machines.mdc: parked → under_review → reactivated | parked | deleted
 */
export const ParkedItemStatusSchema = z.enum([
  'parked',
  'under_review',
  'reactivated',
  'deleted',
]);

export type ParkedItemStatus = z.infer<typeof ParkedItemStatusSchema>;

/**
 * Valid sources for parked items.
 */
export const ParkedItemSourceSchema = z.enum([
  'check_in',
  'manual',
  'ai_suggested',
]);

export type ParkedItemSource = z.infer<typeof ParkedItemSourceSchema>;

/**
 * State machine transitions.
 * Per state-machines.mdc: Enforce valid transitions.
 */
const STATE_TRANSITIONS: Record<ParkedItemStatus, ParkedItemStatus[]> = {
  parked: ['under_review'],
  under_review: ['reactivated', 'parked', 'deleted'],
  reactivated: [], // Terminal state
  deleted: [], // Terminal state
};

/**
 * Schema for a parked item entity (domain model).
 *
 * @property id - Unique identifier
 * @property userId - Owner of this item
 * @property text - The parked item text (1-500 chars)
 * @property reason - Why it was parked (optional)
 * @property status - Current state in lifecycle
 * @property parkedAt - When first parked
 * @property lastReviewedAt - When last reviewed (optional)
 * @property source - Where item came from (optional)
 * @property projectId - Associated project (optional)
 */
export const ParkedItemSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  text: z.string().min(1).max(500),
  reason: z.string().max(200).optional(),
  status: ParkedItemStatusSchema,
  parkedAt: z.string().datetime(),
  lastReviewedAt: z.string().datetime().optional(),
  source: ParkedItemSourceSchema.optional(),
  projectId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ParkedItem = z.infer<typeof ParkedItemSchema>;

/**
 * Schema for creating a new parked item.
 * User ID, status, and timestamps are set server-side.
 */
export const CreateParkedItemSchema = z.object({
  text: z.string().min(1).max(500),
  reason: z.string().max(200).optional(),
  source: ParkedItemSourceSchema.optional(),
  projectId: z.string().uuid().optional(),
});

export type CreateParkedItemInput = z.infer<typeof CreateParkedItemSchema>;

/**
 * Schema for updating a parked item.
 */
export const UpdateParkedItemSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  reason: z.string().max(200).optional(),
  status: ParkedItemStatusSchema.optional(),
  lastReviewedAt: z.string().datetime().optional(),
});

export type UpdateParkedItemInput = z.infer<typeof UpdateParkedItemSchema>;

/**
 * Database row shape (snake_case).
 */
export interface DbParkedItem {
  id: string;
  user_id: string;
  text: string;
  reason: string | null;
  status: string;
  parked_at: string;
  last_reviewed_at: string | null;
  source: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database insert shape.
 */
export interface DbParkedItemInsert {
  user_id: string;
  text: string;
  reason?: string;
  status: string;
  source?: string;
  project_id?: string;
}

/**
 * Database update shape.
 */
export interface DbParkedItemUpdate {
  text?: string;
  reason?: string;
  status?: string;
  last_reviewed_at?: string;
}

/**
 * Convert database row to domain entity.
 *
 * @param row - Database row
 * @returns ParkedItem domain entity
 */
export function toParkedItem(row: DbParkedItem): ParkedItem {
  return {
    id: row.id,
    userId: row.user_id,
    text: row.text,
    reason: row.reason ?? undefined,
    status: row.status as ParkedItemStatus,
    parkedAt: row.parked_at,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
    source: row.source ? (row.source as ParkedItemSource) : undefined,
    projectId: row.project_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert create input to database insert format.
 *
 * @param input - Create input from client
 * @param userId - Authenticated user ID
 * @returns Database insert object
 */
export function toDbInsert(input: CreateParkedItemInput, userId: string): DbParkedItemInsert {
  return {
    user_id: userId,
    text: input.text,
    reason: input.reason,
    status: 'parked',
    source: input.source,
    project_id: input.projectId,
  };
}

/**
 * Convert update input to database update format.
 *
 * @param input - Update input from client
 * @returns Database update object
 */
export function toDbUpdate(input: UpdateParkedItemInput): DbParkedItemUpdate {
  const update: DbParkedItemUpdate = {};
  
  if (input.text !== undefined) update.text = input.text;
  if (input.reason !== undefined) update.reason = input.reason;
  if (input.status !== undefined) update.status = input.status;
  if (input.lastReviewedAt !== undefined) update.last_reviewed_at = input.lastReviewedAt;
  
  return update;
}

/**
 * Calculate days since item was parked.
 *
 * @param item - Parked item
 * @returns Number of days since parked
 */
export function getDaysParked(item: ParkedItem): number {
  const parkedDate = new Date(item.parkedAt);
  const now = new Date();
  const diffMs = now.getTime() - parkedDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a parked item is stale (not reviewed in threshold days).
 *
 * @param item - Parked item
 * @returns True if stale
 */
export function isStale(item: ParkedItem): boolean {
  // Check last reviewed date if available, otherwise use parked date
  const relevantDate = item.lastReviewedAt ?? item.parkedAt;
  const checkDate = new Date(relevantDate);
  const now = new Date();
  const diffMs = now.getTime() - checkDate.getTime();
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return daysSince > STALE_THRESHOLD_DAYS;
}

/**
 * Check if a state transition is valid.
 * Per state-machines.mdc: ALWAYS validate transitions.
 *
 * @param from - Current status
 * @param to - Target status
 * @returns True if transition is allowed
 */
export function canTransitionTo(from: ParkedItemStatus, to: ParkedItemStatus): boolean {
  return STATE_TRANSITIONS[from].includes(to);
}

/**
 * Format days parked as human-readable label.
 *
 * @param days - Number of days
 * @returns Formatted label (e.g., "parked 5 days ago")
 */
export function formatDaysParkedLabel(days: number): string {
  if (days === 0) return 'parked today';
  if (days === 1) return 'parked yesterday';
  if (days < 7) return `parked ${days} days ago`;
  if (days < 14) return 'parked 1 week ago';
  if (days < 30) return `parked ${Math.floor(days / 7)} weeks ago`;
  return `parked ${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
}

/**
 * Sort parked items by parked date (newest first).
 *
 * @param items - Array of parked items
 * @returns Sorted array
 */
export function sortByParkedDate(items: ParkedItem[]): ParkedItem[] {
  return [...items].sort(
    (a, b) => new Date(b.parkedAt).getTime() - new Date(a.parkedAt).getTime()
  );
}

/**
 * Filter items by status.
 *
 * @param items - Array of parked items
 * @param status - Status to filter by
 * @returns Filtered array
 */
export function filterByStatus(items: ParkedItem[], status: ParkedItemStatus): ParkedItem[] {
  return items.filter((item) => item.status === status);
}

/**
 * Get stale items from a list.
 *
 * @param items - Array of parked items
 * @returns Items that are stale
 */
export function getStaleItems(items: ParkedItem[]): ParkedItem[] {
  return items.filter(isStale);
}

/**
 * Check if parking lot is at capacity.
 *
 * @param currentCount - Current number of parked items
 * @returns True if at limit
 */
export function isAtCapacity(currentCount: number): boolean {
  return currentCount >= PARKING_LOT_LIMIT;
}
