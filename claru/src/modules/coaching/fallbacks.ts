/**
 * @file fallbacks.ts
 * @description F030 Fallback Responses - graceful handling when AI is unavailable.
 * @module coaching
 *
 * Per ai-claude.mdc:
 * - ALWAYS have static fallbacks for API failures
 * - Fallbacks should be phase-aware
 *
 * Per ai-coaching-behavior.mdc:
 * - Fallbacks must match Claru persona (warm but not effusive)
 * - No em-dashes (per voice guide)
 */

import type { SessionFlow } from './types';

/**
 * Coaching phases within a check-in flow.
 */
export type CoachingPhase = 'greeting' | 'dump' | 'priority' | 'reflect' | 'default';

/**
 * Fallback responses organized by flow and phase.
 * 
 * Per ai-claude.mdc: Static fallbacks for each coaching phase.
 * Per ai-coaching-behavior.mdc: Keep responses 2-4 sentences, warm but direct.
 */
const FALLBACK_RESPONSES: Record<SessionFlow, Record<CoachingPhase, string>> = {
  morning: {
    greeting:
      "Good morning! I'm having a brief connection issue. What's on your mind today?",
    dump:
      "I'm having trouble connecting. Go ahead and type everything on your mind, and I'll help organize when I'm back.",
    priority:
      "Connection issue on my end. What are your top 3 priorities for today?",
    reflect:
      "Having trouble connecting. What were your wins today?",
    default:
      "Good morning! I'm having a brief connection issue. What's on your mind today?",
  },
  evening: {
    greeting:
      "Evening! I'm having a brief connection issue. How did your day go?",
    dump:
      "I'm having trouble connecting. Go ahead and share how the day went, and I'll help you process when I'm back.",
    priority:
      "Connection issue on my end. What's carrying over to tomorrow?",
    reflect:
      "Having trouble connecting. What were your wins today?",
    default:
      "I'm having trouble connecting right now. Take a moment to jot down what got done today and what's carrying over. We'll sync up when I'm back.",
  },
  adhoc: {
    greeting:
      "Hey there! I'm having a brief connection issue. What can I help with?",
    dump:
      "I'm having trouble connecting. Go ahead and share what's on your mind, and I'll help when I'm back.",
    priority:
      "Connection issue on my end. What's the most important thing you want to tackle?",
    reflect:
      "Having trouble connecting. What's on your mind?",
    default:
      "I'm having trouble connecting right now. Let's pick up when I'm back online.",
  },
  challenge_intro: {
    greeting:
      "I'm having a brief connection issue. Let's continue exploring this foundation when I'm back.",
    dump:
      "I'm having trouble connecting. Go ahead and share your thoughts, and I'll help when I'm back.",
    priority:
      "Connection issue on my end. What aspect of this foundation interests you most?",
    reflect:
      "Having trouble connecting. What's resonating with you about this foundation?",
    default:
      "I'm having trouble connecting right now. Let's continue exploring this foundation when I'm back online.",
  },
};

/**
 * Gets the appropriate fallback response for a given flow and phase.
 *
 * @param flow - The current coaching flow (morning, evening, challenge_intro)
 * @param phase - The current phase within the flow
 * @returns A user-friendly fallback message
 *
 * @example
 * const fallback = getFallbackResponse('morning', 'greeting');
 * // "Good morning! I'm having a brief connection issue. What's on your mind today?"
 */
export function getFallbackResponse(
  flow: SessionFlow,
  phase: CoachingPhase
): string {
  const flowResponses = FALLBACK_RESPONSES[flow] ?? FALLBACK_RESPONSES.morning;
  return flowResponses[phase] ?? flowResponses.default;
}

/**
 * Custom error class for AI fallback scenarios.
 * Contains the fallback response to display to the user.
 *
 * Per 005-error-handling.mdc:
 * - Define clear error types for the application
 * - Include context for debugging
 */
export class FallbackError extends Error {
  public readonly fallbackResponse: string;
  public readonly flow: SessionFlow;
  public readonly phase: CoachingPhase;

  constructor(
    message: string,
    flow: SessionFlow,
    phase: CoachingPhase
  ) {
    super(message);
    this.name = 'FallbackError';
    this.flow = flow;
    this.phase = phase;
    this.fallbackResponse = getFallbackResponse(flow, phase);
  }
}

/**
 * Type guard for FallbackError.
 *
 * @param error - The error to check
 * @returns True if the error is a FallbackError
 */
export function isFallbackError(error: unknown): error is FallbackError {
  return error instanceof FallbackError;
}

/**
 * Determines the coaching phase based on conversation history.
 * Useful for providing context-appropriate fallbacks.
 *
 * @param messageCount - Number of messages in the conversation
 * @param flow - The current coaching flow
 * @returns The inferred coaching phase
 */
export function inferPhaseFromContext(
  messageCount: number,
  flow: SessionFlow
): CoachingPhase {
  if (messageCount === 0) {
    return 'greeting';
  }

  if (flow === 'evening') {
    // Evening flow: starts with review, moves to reflection
    if (messageCount < 3) return 'dump';
    return 'reflect';
  }

  // Morning flow: greeting → dump → priority
  if (messageCount < 2) return 'dump';
  if (messageCount < 5) return 'priority';
  return 'default';
}
