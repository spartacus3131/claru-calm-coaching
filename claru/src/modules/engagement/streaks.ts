/**
 * @file streaks.ts
 * @description Streak tracking types and utilities
 * @module modules/engagement
 *
 * F028: Streak Tracking - Count consecutive days with check-ins
 * Per bounded-contexts.mdc: Engagement Tracker owns streak data.
 * Per domain-language.mdc: Use "streak", "check-in", "consecutive days".
 */

import { z } from 'zod';

// ----- Types -----

/**
 * Type of engagement that counts toward streaks.
 */
export type EngagementType = 'morning_checkin' | 'evening_checkin' | 'hotspots_checkin';

export const ENGAGEMENT_TYPES: EngagementType[] = [
  'morning_checkin',
  'evening_checkin',
  'hotspots_checkin',
];

/**
 * An engagement record (one check-in event).
 */
export interface EngagementRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  engagementType: EngagementType;
  completedAt: Date;
  sessionId?: string;
}

/**
 * Database row for engagement_records table.
 */
export interface DbEngagementRecord {
  id: string;
  user_id: string;
  date: string;
  engagement_type: EngagementType;
  completed_at: string;
  session_id: string | null;
  created_at: string;
}

/**
 * User streak summary (cached for performance).
 */
export interface StreakSummary {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckinDate: string | null;
  totalCheckins: number;
  updatedAt: Date;
}

/**
 * Database row for user_streaks table.
 */
export interface DbStreakSummary {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
  total_checkins: number;
  updated_at: string;
}

/**
 * Streak display data for UI.
 */
export interface StreakDisplay {
  current: number;
  longest: number;
  lastCheckin: string | null;
  total: number;
  isActive: boolean; // Has checked in today or yesterday
  milestone: StreakMilestone | null;
}

/**
 * Streak milestones for celebration.
 */
export type StreakMilestone = 3 | 7 | 14 | 21 | 30 | 60 | 90 | 180 | 365;

export const STREAK_MILESTONES: StreakMilestone[] = [3, 7, 14, 21, 30, 60, 90, 180, 365];

// ----- Zod Schemas -----

/**
 * Schema for recording a new engagement.
 */
export const RecordEngagementSchema = z.object({
  engagementType: z.enum(['morning_checkin', 'evening_checkin', 'hotspots_checkin']),
  sessionId: z.string().uuid().optional(),
});

export type RecordEngagementInput = z.infer<typeof RecordEngagementSchema>;

// ----- Conversion Functions -----

/**
 * Convert database record to domain entity.
 */
export function toEngagementRecord(db: DbEngagementRecord): EngagementRecord {
  return {
    id: db.id,
    userId: db.user_id,
    date: db.date,
    engagementType: db.engagement_type,
    completedAt: new Date(db.completed_at),
    sessionId: db.session_id ?? undefined,
  };
}

/**
 * Convert database streak summary to domain entity.
 */
export function toStreakSummary(db: DbStreakSummary): StreakSummary {
  return {
    userId: db.user_id,
    currentStreak: db.current_streak,
    longestStreak: db.longest_streak,
    lastCheckinDate: db.last_checkin_date,
    totalCheckins: db.total_checkins,
    updatedAt: new Date(db.updated_at),
  };
}

/**
 * Convert input to database insert format.
 */
export function toDbInsert(
  input: RecordEngagementInput,
  userId: string,
  date: string
): Omit<DbEngagementRecord, 'id' | 'created_at' | 'completed_at'> & { completed_at: string } {
  return {
    user_id: userId,
    date,
    engagement_type: input.engagementType,
    session_id: input.sessionId ?? null,
    completed_at: new Date().toISOString(),
  };
}

// ----- Utility Functions -----

/**
 * Check if the streak is currently active.
 * Active means the user checked in today or yesterday.
 *
 * @param lastCheckinDate - Last check-in date in YYYY-MM-DD format
 */
export function isStreakActive(lastCheckinDate: string | null): boolean {
  if (!lastCheckinDate) return false;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return lastCheckinDate === today || lastCheckinDate === yesterdayStr;
}

/**
 * Check if today's check-in has been completed.
 *
 * @param lastCheckinDate - Last check-in date in YYYY-MM-DD format
 */
export function hasCheckedInToday(lastCheckinDate: string | null): boolean {
  if (!lastCheckinDate) return false;

  const today = new Date().toISOString().split('T')[0];
  return lastCheckinDate === today;
}

/**
 * Get the current streak milestone if user just hit one.
 *
 * @param currentStreak - Current streak count
 */
export function getCurrentMilestone(currentStreak: number): StreakMilestone | null {
  // Find the highest milestone that matches exactly
  for (let i = STREAK_MILESTONES.length - 1; i >= 0; i--) {
    if (currentStreak === STREAK_MILESTONES[i]) {
      return STREAK_MILESTONES[i];
    }
  }
  return null;
}

/**
 * Get the next milestone to achieve.
 *
 * @param currentStreak - Current streak count
 */
export function getNextMilestone(currentStreak: number): StreakMilestone | null {
  for (const milestone of STREAK_MILESTONES) {
    if (milestone > currentStreak) {
      return milestone;
    }
  }
  return null;
}

/**
 * Get days remaining until next milestone.
 *
 * @param currentStreak - Current streak count
 */
export function getDaysToNextMilestone(currentStreak: number): number | null {
  const next = getNextMilestone(currentStreak);
  return next ? next - currentStreak : null;
}

/**
 * Format streak count for display.
 *
 * @param count - Number of consecutive days
 */
export function formatStreakLabel(count: number): string {
  if (count === 0) return 'No streak';
  if (count === 1) return '1 day';
  return `${count} days`;
}

/**
 * Get an encouraging message based on streak status.
 *
 * @param streak - Streak summary
 */
export function getStreakMessage(streak: StreakSummary): string {
  const { currentStreak, longestStreak, lastCheckinDate } = streak;
  const active = isStreakActive(lastCheckinDate);
  const checkedInToday = hasCheckedInToday(lastCheckinDate);
  const milestone = getCurrentMilestone(currentStreak);

  if (milestone) {
    return `${milestone}-day streak! Keep building momentum.`;
  }

  // Active streak but hasn't checked in today - nudge to continue
  if (active && !checkedInToday && currentStreak > 0) {
    return "Don't break your streak. Check in today!";
  }

  // Checked in today - encourage them
  if (checkedInToday) {
    const next = getNextMilestone(currentStreak);
    if (next) {
      const days = next - currentStreak;
      return `${days} more day${days === 1 ? '' : 's'} to your next milestone.`;
    }
    return "You're on fire. Keep going!";
  }

  // Streak is broken but they had one before
  if (!active && longestStreak > 0) {
    return `Your best streak was ${longestStreak} days. Ready to start fresh?`;
  }

  return 'Start your streak with a morning check-in.';
}

/**
 * Create streak display data for UI.
 *
 * @param summary - Streak summary from database
 */
export function toStreakDisplay(summary: StreakSummary | null): StreakDisplay {
  if (!summary) {
    return {
      current: 0,
      longest: 0,
      lastCheckin: null,
      total: 0,
      isActive: false,
      milestone: null,
    };
  }

  return {
    current: summary.currentStreak,
    longest: summary.longestStreak,
    lastCheckin: summary.lastCheckinDate,
    total: summary.totalCheckins,
    isActive: isStreakActive(summary.lastCheckinDate),
    milestone: getCurrentMilestone(summary.currentStreak),
  };
}

/**
 * Calculate streak from a list of dates (client-side calculation).
 * Useful for offline or when database is unavailable.
 *
 * @param dates - Array of date strings in YYYY-MM-DD format
 */
export function calculateStreakFromDates(dates: string[]): {
  current: number;
  longest: number;
} {
  if (dates.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Sort dates descending (most recent first) and dedupe
  const sortedDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Check if most recent date is today or yesterday (active streak)
  const mostRecentDate = sortedDates[0];
  const isActive = mostRecentDate === todayStr || mostRecentDate === yesterdayStr;

  let currentStreak = isActive ? 1 : 0;
  let currentStreakFrozen = false; // Once we hit a gap, stop counting current
  let longestStreak = 0;
  let tempStreak = 1;

  // Walk through dates looking for consecutive days
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i - 1] + 'T00:00:00');
    const prevDate = new Date(sortedDates[i] + 'T00:00:00');

    // Calculate expected previous day
    const expectedPrev = new Date(currentDate);
    expectedPrev.setDate(expectedPrev.getDate() - 1);

    if (prevDate.getTime() === expectedPrev.getTime()) {
      // Consecutive day
      tempStreak++;
      if (isActive && !currentStreakFrozen) {
        currentStreak = tempStreak;
      }
    } else {
      // Gap found - save longest and reset
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
      // Current streak is frozen after first gap
      currentStreakFrozen = true;
    }
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}
