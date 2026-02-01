/**
 * @file useStreak.ts
 * @description Hook for managing streak state and recording check-ins
 * @module hooks
 *
 * F028: Streak Tracking - Count consecutive days with check-ins
 * Per bounded-contexts.mdc: Engagement Tracker owns streak data.
 * Per domain-language.mdc: Use "streak", "check-in", "consecutive days".
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { StreakDisplay, EngagementType, StreakMilestone } from '@/modules/engagement';
import {
  formatStreakLabel,
  getStreakMessage,
  getNextMilestone,
  getDaysToNextMilestone,
  STREAK_MILESTONES,
} from '@/modules/engagement';

/**
 * Hook return type.
 */
interface UseStreakResult {
  // State
  streak: StreakDisplay | null;
  isLoading: boolean;
  error: string | null;
  // Computed
  streakLabel: string;
  message: string;
  nextMilestone: StreakMilestone | null;
  daysToNextMilestone: number | null;
  // Actions
  recordCheckin: (type: EngagementType, sessionId?: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

/**
 * Default empty streak display.
 */
const DEFAULT_STREAK: StreakDisplay = {
  current: 0,
  longest: 0,
  lastCheckin: null,
  total: 0,
  isActive: false,
  milestone: null,
};

/**
 * Hook for fetching and managing streak data.
 *
 * @returns Streak state and actions
 *
 * @example
 * const { streak, recordCheckin, streakLabel } = useStreak();
 */
export function useStreak(): UseStreakResult {
  const [streak, setStreak] = useState<StreakDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch streak data from API.
   */
  const fetchStreak = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/streaks');

      if (response.status === 401) {
        // Not authenticated - use defaults
        setStreak(DEFAULT_STREAK);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to fetch streak');
      }

      const { data } = await response.json();
      setStreak(data);
    } catch (err) {
      console.error('Failed to fetch streak:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStreak(DEFAULT_STREAK);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  /**
   * Record a check-in for today.
   *
   * @param type - Type of engagement (morning_checkin, evening_checkin, etc.)
   * @param sessionId - Optional session ID to link
   * @returns True if successful
   */
  const recordCheckin = useCallback(
    async (type: EngagementType, sessionId?: string): Promise<boolean> => {
      try {
        const response = await fetch('/api/streaks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engagementType: type,
            sessionId,
          }),
        });

        if (response.status === 401) {
          // Not authenticated - silently fail
          return false;
        }

        if (!response.ok) {
          const json = await response.json();
          throw new Error(json.error || 'Failed to record check-in');
        }

        const { data, alreadyRecorded, recorded } = await response.json();
        setStreak(data);

        // Show celebration for milestones
        if (recorded && data.milestone) {
          toast.success(`🔥 ${data.milestone}-day streak!`, {
            description: 'Keep building momentum!',
          });
        } else if (recorded && !alreadyRecorded) {
          // Show encouraging message for non-milestone days
          const nextMilestone = getNextMilestone(data.current);
          if (nextMilestone) {
            const days = nextMilestone - data.current;
            toast.success(`${data.current} day streak!`, {
              description: `${days} more day${days === 1 ? '' : 's'} to ${nextMilestone}`,
            });
          }
        }

        return true;
      } catch (err) {
        console.error('Failed to record check-in:', err);
        return false;
      }
    },
    []
  );

  // Computed values
  const current = streak?.current ?? 0;
  const streakLabel = formatStreakLabel(current);

  // Create a minimal summary for getStreakMessage
  const summaryForMessage = streak
    ? {
        userId: '',
        currentStreak: streak.current,
        longestStreak: streak.longest,
        lastCheckinDate: streak.lastCheckin,
        totalCheckins: streak.total,
        updatedAt: new Date(),
      }
    : null;

  const message = summaryForMessage
    ? getStreakMessage(summaryForMessage)
    : 'Start your streak with a morning check-in.';

  const nextMilestone = getNextMilestone(current);
  const daysToNextMilestone = getDaysToNextMilestone(current);

  return {
    // State
    streak,
    isLoading,
    error,
    // Computed
    streakLabel,
    message,
    nextMilestone,
    daysToNextMilestone,
    // Actions
    recordCheckin,
    refetch: fetchStreak,
  };
}

// Re-export useful constants and types
export { STREAK_MILESTONES };
export type { StreakDisplay, EngagementType, StreakMilestone };
