/**
 * @file useChallenges.ts
 * @description Hook for managing user challenges with optimistic updates
 * @module hooks
 *
 * Fetches challenges from API and provides methods to update challenge status.
 * Challenge definitions are static, but user progress is tracked via API.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChallengeStatus } from '@/modules/challenges/stateMachine';
import type { JourneyPart } from '@/modules/challenges/types';

/**
 * Challenge with user status merged in.
 */
export interface ChallengeWithStatus {
  id: number;
  title: string;
  description: string;
  part: string;
  partTitle: string;
  time: string;
  energy: number;
  value: number;
  whatYouGet: string;
  steps: { title?: string; content: string }[];
  tips?: string[];
  worksheetPrompts?: string[];
  researchInsight?: string;
  actionableTip?: string;
  citation?: string;
  // User-specific fields
  userStatus: ChallengeStatus;
  startedAt: string | null;
  completedAt: string | null;
  declinedAt: string | null;
  data: Record<string, unknown> | null;
}

/**
 * Group challenges by journey part for display.
 *
 * @param challenges - Array of challenges with status
 * @returns Object with challenges grouped by part
 */
export function groupChallengesByPart(
  challenges: ChallengeWithStatus[]
): Record<JourneyPart, ChallengeWithStatus[]> {
  const grouped: Record<JourneyPart, ChallengeWithStatus[]> = {
    clarity: [],
    systems: [],
    capacity: [],
  };

  for (const challenge of challenges) {
    const part = challenge.part as JourneyPart;
    if (grouped[part]) {
      grouped[part].push(challenge);
    }
  }

  return grouped;
}

/**
 * Hook for fetching and managing user challenges.
 *
 * @returns Challenge state and mutation functions
 *
 * @example
 * const { challenges, activeChallenges, startChallenge } = useChallenges();
 */
export function useChallenges() {
  const [challenges, setChallenges] = useState<ChallengeWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch challenges from API.
   */
  const fetchChallenges = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/challenges');

      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      const json = await response.json();
      setChallenges(json.data || []);
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setChallenges([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  /**
   * Update a challenge's status via API.
   *
   * @param challengeId - Challenge ID (1-22)
   * @param status - New status
   * @param data - Optional challenge-specific data
   * @throws Error if update fails
   */
  const updateChallengeStatus = useCallback(
    async (
      challengeId: number,
      status: ChallengeStatus,
      data?: Record<string, unknown>
    ) => {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, status, data }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to update challenge');
      }

      // Optimistic update
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId
            ? {
                ...c,
                userStatus: status,
                ...(status === 'active' && { startedAt: new Date().toISOString() }),
                ...(status === 'completed' && { completedAt: new Date().toISOString() }),
                ...(status === 'declined' && { declinedAt: new Date().toISOString() }),
              }
            : c
        )
      );

      return response.json();
    },
    []
  );

  /**
   * Start a challenge (available → offered → active).
   *
   * @param challengeId - Challenge ID to start
   */
  const startChallenge = useCallback(
    async (challengeId: number) => {
      const challenge = challenges.find((c) => c.id === challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // If available, need to go through offered first
      if (challenge.userStatus === 'available') {
        await updateChallengeStatus(challengeId, 'offered');
      }

      // Then transition to active
      await updateChallengeStatus(challengeId, 'active');
    },
    [challenges, updateChallengeStatus]
  );

  /**
   * Decline a challenge (offered → declined).
   *
   * @param challengeId - Challenge ID to decline
   */
  const declineChallenge = useCallback(
    async (challengeId: number) => {
      await updateChallengeStatus(challengeId, 'declined');
    },
    [updateChallengeStatus]
  );

  /**
   * Complete a challenge (goes through data_collected → analyzed → completed).
   *
   * @param challengeId - Challenge ID to complete
   */
  const completeChallenge = useCallback(
    async (challengeId: number) => {
      const challenge = challenges.find((c) => c.id === challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // Progress through states
      if (challenge.userStatus === 'active') {
        await updateChallengeStatus(challengeId, 'data_collected');
      }
      if (challenge.userStatus === 'data_collected' || challenge.userStatus === 'active') {
        await updateChallengeStatus(challengeId, 'analyzed');
      }
      await updateChallengeStatus(challengeId, 'completed');
    },
    [challenges, updateChallengeStatus]
  );

  // Computed: challenges currently being worked on
  const activeChallenges = useMemo(
    () => challenges.filter((c) => c.userStatus === 'active'),
    [challenges]
  );

  // Computed: completed challenges
  const completedChallenges = useMemo(
    () => challenges.filter((c) => c.userStatus === 'completed'),
    [challenges]
  );

  // Computed: available challenges (not started)
  const availableChallenges = useMemo(
    () => challenges.filter((c) => c.userStatus === 'available'),
    [challenges]
  );

  // Computed: grouped by part
  const challengesByPart = useMemo(
    () => groupChallengesByPart(challenges),
    [challenges]
  );

  return {
    // State
    challenges,
    isLoading,
    error,
    // Computed
    activeChallenges,
    completedChallenges,
    availableChallenges,
    challengesByPart,
    // Actions
    refetch: fetchChallenges,
    updateChallengeStatus,
    startChallenge,
    declineChallenge,
    completeChallenge,
  };
}
