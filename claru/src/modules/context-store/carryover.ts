/**
 * @file carryover.ts
 * @description Carryover detection for incomplete Top 3 items - F009
 * @module context-store
 * 
 * Detects incomplete tasks from yesterday and formats them for the morning check-in.
 */

import type { DailyNote, CarryoverItem, ParkedItem } from './types';

/**
 * Input for carryover detection.
 */
export interface CarryoverInput {
  yesterdayNote: DailyNote | null;
  today: string; // YYYY-MM-DD format
}

/**
 * Calculates the number of days between two dates.
 * 
 * @param fromDate - Earlier date in YYYY-MM-DD format
 * @param toDate - Later date in YYYY-MM-DD format
 * @returns Number of days between the dates
 */
function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffTime = to.getTime() - from.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Gets carryover items from yesterday's incomplete Top 3.
 * 
 * Per domain-language.mdc: Use "carryover" not "leftover" or "incomplete".
 * 
 * @param input - Yesterday's note and today's date
 * @returns Array of carryover items
 * 
 * @example
 * const carryover = getCarryoverItems({
 *   yesterdayNote: note,
 *   today: '2026-02-01',
 * });
 */
export function getCarryoverItems(input: CarryoverInput): CarryoverItem[] {
  const { yesterdayNote, today } = input;

  // No note = no carryover
  if (!yesterdayNote) {
    return [];
  }

  // No plan = no carryover
  if (!yesterdayNote.plan) {
    return [];
  }

  // Filter to incomplete Top 3 items
  const incompleteItems = yesterdayNote.plan.top3.filter(
    (item) => !item.completed
  );

  // Convert to CarryoverItem format
  return incompleteItems.map((item) => ({
    text: item.text,
    workType: item.workType,
    originalDate: yesterdayNote.date,
    daysSinceOriginal: daysBetween(yesterdayNote.date, today),
  }));
}

/**
 * Formats carryover items for inclusion in the system prompt.
 * 
 * @param items - Carryover items to format
 * @returns Formatted string for prompt, or "None" if empty
 * 
 * @example
 * const formatted = formatCarryoverForPrompt(carryover);
 * // Returns:
 * // "- Finish investor deck (deep_focus) - 1 day
 * //  - Prep for standup (meeting) - 1 day"
 */
export function formatCarryoverForPrompt(items: CarryoverItem[]): string {
  if (items.length === 0) {
    return 'None';
  }

  return items
    .map((item) => {
      const daysLabel = item.daysSinceOriginal === 1 
        ? '1 day' 
        : `${item.daysSinceOriginal} days`;
      return `- ${item.text} (${item.workType}) - carrying over for ${daysLabel}`;
    })
    .join('\n');
}

/**
 * Calculates days since a date.
 */
function daysSince(date: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formats parked items for inclusion in the system prompt.
 * 
 * Per domain-language.mdc: These are "parked" items, not "backlog" or "deferred".
 * 
 * @param items - Parked items to format
 * @returns Formatted string for prompt, or "None" if empty
 * 
 * @example
 * const formatted = formatParkedItemsForPrompt(parkedItems);
 * // Returns:
 * // "- Research competitors (parked 5 days ago)
 * //  - Update resume (parked 10 days ago) ⚠️ consider reviewing"
 */
export function formatParkedItemsForPrompt(items: ParkedItem[]): string {
  if (items.length === 0) {
    return 'None';
  }

  return items
    .map((item) => {
      const daysParked = daysSince(item.createdAt);
      const daysLabel = daysParked === 0 
        ? 'today' 
        : daysParked === 1 
          ? '1 day ago'
          : `${daysParked} days ago`;
      
      const reasonPart = item.reason ? ` - "${item.reason}"` : '';
      const warningPart = daysParked >= 7 ? ' ⚠️ consider reviewing' : '';
      
      return `- ${item.text} (parked ${daysLabel})${reasonPart}${warningPart}`;
    })
    .join('\n');
}
