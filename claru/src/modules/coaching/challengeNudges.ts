/**
 * @file challengeNudges.ts
 * @description F020 Challenge Nudges - AI mentions active challenge in check-ins
 * @module coaching
 *
 * Generates contextual nudges based on the user's active challenge.
 * These nudges are woven into morning/evening check-ins to keep the
 * challenge top of mind without being pushy.
 *
 * Per ai-coaching-behavior.mdc:
 * - Natural integration, not forced
 * - One question at a time
 * - Non-judgmental
 */

import type { ChallengeDefinition } from '@/modules/challenges/types';
import type { SessionFlow } from './types';

/**
 * Context for formatting a challenge for the prompt.
 */
export interface ActiveChallengeContext {
  challenge: ChallengeDefinition;
  /** Days since the user started this challenge (0 = first day) */
  daysSinceStarted: number;
}

/**
 * Context for generating a nudge.
 */
export interface NudgeContext {
  challenge: ChallengeDefinition;
  flow: SessionFlow;
}

/**
 * Full context for generating challenge nudge instructions.
 */
export interface ChallengeNudgeContext {
  challenge: ChallengeDefinition;
  flow: SessionFlow;
  daysSinceStarted: number;
}

/**
 * Formats the active challenge for inclusion in the system prompt.
 *
 * @param context - Active challenge context
 * @returns Formatted string describing the active challenge
 */
export function formatActiveChallengeForPrompt(
  context: ActiveChallengeContext
): string {
  const { challenge, daysSinceStarted } = context;
  const dayDisplay = daysSinceStarted === 0 ? 1 : daysSinceStarted + 1;

  const lines: string[] = [];

  lines.push(`**${challenge.title}**`);
  lines.push(`*${challenge.description}*`);
  lines.push('');
  lines.push(`- Journey Part: ${challenge.partTitle}`);
  lines.push(`- Day ${dayDisplay} of this foundation`);
  lines.push('');
  lines.push(`Goal: ${challenge.whatYouGet.split('.')[0]}.`);

  return lines.join('\n');
}

/**
 * Gets a contextual nudge for the given challenge and flow.
 * These are suggestions for how the AI might naturally reference the challenge.
 *
 * @param context - Nudge context
 * @returns A nudge suggestion string
 */
export function getNudgeForChallenge(context: NudgeContext): string {
  const { challenge, flow } = context;
  const title = challenge.title;

  // Challenge-specific nudges based on the challenge type
  const challengeNudges: Record<number, { morning: string; evening: string }> = {
    1: {
      // Values Foundation
      morning: `Ask if their Top 3 connects to the values they identified in "${title}". Example: "How does this align with the values you uncovered?"`,
      evening: `When reviewing wins, ask if any connected to their deeper values from "${title}".`,
    },
    2: {
      // Impact Foundation
      morning: `Remind them of their high-impact tasks from "${title}" when setting Top 3. Example: "Is any of this related to your highest-impact work?"`,
      evening: `Ask if they spent time on their highest-impact tasks today.`,
    },
    3: {
      // Rule of 3 Foundation
      morning: `They're practicing the Rule of 3. Reinforce the habit: "What are your Top 3 for today?"`,
      evening: `Ask how the Rule of 3 worked for them today. Did focusing on 3 help?`,
    },
    4: {
      // Prime-Time Foundation
      morning: `If they know their BPT, ask: "When's your prime time today? What will you protect it for?"`,
      evening: `Ask if they tracked their energy today and what they noticed.`,
    },
    5: {
      // Flipping Foundation
      morning: `If they mention a dreaded task, use "${title}" framing: "What's making that aversive? Can we flip it?"`,
      evening: `Ask if they noticed any procrastination triggers today and how they handled them.`,
    },
    7: {
      // Disconnecting Foundation
      morning: `Ask if they can schedule offline focus time today. Example: "Can you carve out 30 minutes to disconnect?"`,
      evening: `Ask if they had any offline focus time and how it felt.`,
    },
    13: {
      // Capture Foundation
      morning: `The brain dump IS the challenge. Acknowledge: "Good, you're practicing the Capture Foundation by getting this out of your head."`,
      evening: `Ask if anything else is lingering in their mind that needs capturing.`,
    },
    17: {
      // Single-Tasking Foundation
      morning: `Ask which task they'll single-task on during focus time.`,
      evening: `Ask how their single-tasking went. Did their mind wander? How did they refocus?`,
    },
    18: {
      // Meditation Foundation
      morning: `Ask if they've done their 5 minutes today (or will). Example: "Have you done your 5 minutes yet?"`,
      evening: `Check in on their meditation streak. How many days in a row?`,
    },
  };

  // Default nudges for challenges without specific ones
  const defaultNudges = {
    morning: `They're working on "${title}". If it's relevant to their Top 3 or today's focus, mention it naturally.`,
    evening: `They're working on "${title}". If relevant to their reflection, ask about progress or insights.`,
  };

  const nudges = challengeNudges[challenge.id] ?? defaultNudges;

  if (flow === 'morning') {
    return nudges.morning;
  } else if (flow === 'evening') {
    return nudges.evening;
  } else {
    // Adhoc flow - use generic
    return `They're working on "${title}". Weave it in if relevant to the conversation.`;
  }
}

/**
 * Gets complete instructions for how the AI should handle the active challenge.
 *
 * @param context - Full challenge nudge context
 * @returns Instructions string for the system prompt
 */
export function getChallengeNudgeInstructions(
  context: ChallengeNudgeContext
): string {
  const { challenge, flow, daysSinceStarted } = context;
  const dayDisplay = daysSinceStarted === 0 ? 1 : daysSinceStarted + 1;
  const nudge = getNudgeForChallenge({ challenge, flow });

  const isNewChallenge = daysSinceStarted <= 1;
  const newChallengeNote = isNewChallenge
    ? `They just started this foundation. Acknowledge it warmly but don't dwell on it.`
    : `Day ${dayDisplay} of this foundation. They've been at it for a bit.`;

  const flowSpecificGuidance =
    flow === 'morning'
      ? `When helping them set their Top 3, look for natural connections to this foundation.`
      : flow === 'evening'
        ? `When they reflect on their day, ask if they made any progress or had insights related to this foundation.`
        : `If the conversation touches on topics related to this foundation, connect the dots.`;

  return `
## Active Foundation

The user has an active foundation: "${challenge.title}"
${newChallengeNote}

### How to Integrate (Naturally)

${nudge}

${flowSpecificGuidance}

### Critical Rules

- DON'T force it. If it doesn't fit the conversation, don't mention it.
- DON'T ask about the foundation every turn. Mention it organically 1-2 times per session max.
- DON'T make them feel guilty if they haven't worked on it.
- DO connect their daily work to the foundation when it's relevant.
- DO treat this as context, not a task to complete.
`.trim();
}
