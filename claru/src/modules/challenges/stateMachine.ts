/**
 * @file stateMachine.ts
 * @description Challenge state machine for tracking user progress through challenges
 * @module challenges
 *
 * State Machine Definition (per state-machines.mdc):
 *
 * States: available → offered → active → data_collected → analyzed → completed
 *                    ↘ declined (→ offered after 7 days)
 *
 * Transitions:
 * - available → offered: DetectTrigger (AI suggests challenge)
 * - offered → active: UserAccepts
 * - offered → declined: UserDeclines
 * - declined → offered: CooldownExpires (7 days)
 * - active → data_collected: MinimumDataReached
 * - data_collected → analyzed: RunAnalysis
 * - analyzed → completed: IntegrateLearning
 */

import { z } from 'zod';

/**
 * The possible states a user's challenge can be in.
 */
export const ChallengeStatusSchema = z.enum([
  'available',      // Challenge exists but hasn't been offered to user
  'offered',        // AI has suggested this challenge to user
  'declined',       // User declined the challenge (can re-offer after cooldown)
  'active',         // User accepted and is working on challenge
  'data_collected', // Minimum data has been collected
  'analyzed',       // Analysis has been run on collected data
  'completed',      // Challenge finished, learning integrated
]);
export type ChallengeStatus = z.infer<typeof ChallengeStatusSchema>;

/**
 * Number of days before a declined challenge can be re-offered.
 */
export const DECLINE_COOLDOWN_DAYS = 7;

/**
 * Defines valid state transitions.
 * Key is the current state, value is array of valid next states.
 */
const STATE_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
  available: ['offered'],
  offered: ['active', 'declined'],
  declined: ['offered'], // After cooldown
  active: ['data_collected'],
  data_collected: ['analyzed'],
  analyzed: ['completed'],
  completed: [], // Terminal state
};

/**
 * A user's instance of a challenge with their progress.
 *
 * @property id - Unique identifier for this user-challenge record
 * @property user_id - The user who owns this challenge instance
 * @property challenge_id - Reference to the challenge definition (1-22)
 * @property status - Current state in the lifecycle
 * @property started_at - When the user started the challenge (active state)
 * @property completed_at - When the challenge was completed
 * @property declined_at - When the challenge was declined (for cooldown calculation)
 * @property data - Challenge-specific data collected during progress
 * @property created_at - Record creation timestamp
 * @property updated_at - Last update timestamp
 */
export const UserChallengeSchema = z.object({
  id: z.string().min(1, 'ID cannot be empty'),
  user_id: z.string().min(1, 'User ID cannot be empty'),
  challenge_id: z.number().int().min(1).max(22, 'Challenge ID must be 1-22'),
  status: ChallengeStatusSchema,
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  declined_at: z.string().nullable(),
  data: z.record(z.string(), z.any()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type UserChallenge = z.infer<typeof UserChallengeSchema>;

/**
 * Check if a state transition is valid.
 *
 * @param from - Current state
 * @param to - Desired next state
 * @returns True if the transition is allowed
 *
 * @example
 * canTransition('offered', 'active') // true
 * canTransition('completed', 'active') // false
 */
export function canTransition(from: ChallengeStatus, to: ChallengeStatus): boolean {
  return STATE_TRANSITIONS[from].includes(to);
}

/**
 * Get all valid next states from a given state.
 *
 * @param current - Current state
 * @returns Array of valid next states
 *
 * @example
 * getValidTransitions('offered') // ['active', 'declined']
 * getValidTransitions('completed') // []
 */
export function getValidTransitions(current: ChallengeStatus): ChallengeStatus[] {
  return STATE_TRANSITIONS[current];
}

/**
 * Error thrown when an invalid state transition is attempted.
 */
export class InvalidTransitionError extends Error {
  constructor(
    public from: ChallengeStatus,
    public to: ChallengeStatus
  ) {
    super(`Cannot transition from ${from} to ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Error thrown when trying to re-offer a declined challenge before cooldown expires.
 */
export class CooldownNotExpiredError extends Error {
  constructor(public daysRemaining: number) {
    super(`Must wait ${daysRemaining} more day(s) before re-offering this challenge`);
    this.name = 'CooldownNotExpiredError';
  }
}

/**
 * Calculate days since a given timestamp.
 *
 * @param timestamp - ISO timestamp string
 * @returns Number of days since the timestamp
 */
export function daysSince(timestamp: string): number {
  const then = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if a declined challenge's cooldown has expired.
 *
 * @param declinedAt - ISO timestamp when challenge was declined
 * @returns True if cooldown has expired and challenge can be re-offered
 */
export function isCooldownExpired(declinedAt: string): boolean {
  return daysSince(declinedAt) >= DECLINE_COOLDOWN_DAYS;
}

/**
 * Get days remaining in cooldown period.
 *
 * @param declinedAt - ISO timestamp when challenge was declined
 * @returns Days remaining (0 if cooldown expired)
 */
export function getCooldownDaysRemaining(declinedAt: string): number {
  const elapsed = daysSince(declinedAt);
  return Math.max(0, DECLINE_COOLDOWN_DAYS - elapsed);
}
