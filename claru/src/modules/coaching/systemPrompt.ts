/**
 * System Prompt Builder - F003 Morning Check-In Chat + F008 Evening Reflection + F020 Challenge Nudges + F021 Values
 *
 * Builds the system prompt for Claude based on coaching context.
 * 
 * All prompt content lives in ./prompts.ts for easy review and editing.
 */

import type { SessionFlow } from './types';
import type { ChallengeDefinition } from '@/modules/challenges/types';
import type { ValuesData } from '@/modules/challenges/valuesChallenge';
import {
  PERSONA,
  RESPONSE_RULES,
  GUARDRAILS,
  MORNING_FLOW,
  EVENING_FLOW,
  GOOD_EXAMPLES,
  BAD_EXAMPLES,
} from './prompts';
import { getChallengeNudgeInstructions } from './challengeNudges';
import { formatValuesForPrompt } from '@/modules/challenges/valuesChallenge';

/**
 * Active challenge context for nudges (F020).
 */
export interface ActiveChallengeContext {
  challenge: ChallengeDefinition;
  daysSinceStarted: number;
}

/**
 * Context provided to the system prompt builder.
 */
export interface CoachingContext {
  userName: string;
  flow: SessionFlow;
  turnNumber: number;
  maxTurns: number;
  yesterdayPlan?: string;
  carryover?: string[];
  activeProjects?: string[];
  parkedItems?: string; // Pre-formatted parking lot context
  /** F020: Active challenge for nudges during check-ins */
  activeChallenge?: ActiveChallengeContext;
  /** F021: Completed Values Foundation data for context */
  completedValues?: ValuesData;
}

/**
 * Builds the system prompt for the coaching conversation.
 *
 * Per ai-claude.mdc: System prompts should have clear sections.
 */
export function buildSystemPrompt(context: CoachingContext): string {
  const yesterdaySection = context.yesterdayPlan
    ? context.yesterdayPlan
    : 'None';

  const carryoverSection = context.carryover?.length
    ? context.carryover.map((item) => `- ${item}`).join('\n')
    : 'None';

  const projectsSection = context.activeProjects?.length
    ? context.activeProjects.map((p) => `- ${p}`).join('\n')
    : 'None';

  const parkedSection = context.parkedItems ?? 'None';

  // Use different flow instructions based on morning vs evening
  const flowInstructions = context.flow === 'evening' 
    ? EVENING_FLOW
    : MORNING_FLOW;

  // F020: Include active challenge nudge instructions if present
  const challengeSection = context.activeChallenge
    ? getChallengeNudgeInstructions({
        challenge: context.activeChallenge.challenge,
        flow: context.flow,
        daysSinceStarted: context.activeChallenge.daysSinceStarted,
      })
    : '';

  // F021: Include completed Values Foundation data
  const valuesSection = context.completedValues
    ? formatValuesForPrompt(context.completedValues)
    : '';

  const basePrompt = `
## Role
You are Claru, an AI productivity coach.

## Persona
${PERSONA}

## Response Rules
${RESPONSE_RULES}

## Current Context
- User: ${context.userName}
- Flow: ${context.flow} check-in
- Turn: ${context.turnNumber}/${context.maxTurns}

## Yesterday's Plan
${yesterdaySection}

## Carryover Items
${carryoverSection}

## Parking Lot (items saved for later)
${parkedSection}

## Active Projects
${projectsSection}
When relevant, connect tasks to the user's active projects. Help them see how today's work advances their larger goals.
${valuesSection ? `\n## User's Core Values\n${valuesSection}` : ''}${challengeSection ? `\n${challengeSection}` : ''}

## Guardrails
${GUARDRAILS}
${flowInstructions ? `\n${flowInstructions}` : ''}

## Example Good Responses
${GOOD_EXAMPLES}

## Example Bad Responses (NEVER do these)
${BAD_EXAMPLES}
`.trim();

  return basePrompt;
}
