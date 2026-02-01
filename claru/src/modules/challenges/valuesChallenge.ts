/**
 * @file valuesChallenge.ts
 * @description F021 - Full implementation of Challenge 1 (Values Foundation)
 * @module challenges
 *
 * The Values Foundation helps users discover their deeper motivations for
 * productivity. This module handles:
 * - Storing the values users identify
 * - Providing values context to the coaching engine
 * - Formatting values for system prompts
 *
 * Challenge Steps:
 * 1. Imagine 2 extra hours of leisure time - what would you do?
 * 2. What productivity goals/habits do you want to take on?
 * 3. What deep-rooted values are associated with your goals?
 *
 * Per domain-language.mdc: Use "Values Foundation" terminology.
 * Per bounded-contexts.mdc: Challenge Engine owns this data.
 */

import { z } from 'zod';

/**
 * The Values Foundation challenge ID.
 */
export const VALUES_CHALLENGE_ID = 1;

/**
 * Schema for storing Values Foundation outcomes.
 *
 * @property values - Core values the user identified (e.g., "freedom", "learning")
 * @property leisureIdeas - How they'd use extra leisure time (Step 1)
 * @property productivityGoals - Goals/habits they want to take on (Step 2)
 * @property stepsCompleted - Which steps (1-3) they've completed
 * @property completedAt - When they finished the challenge
 */
export const ValuesDataSchema = z.object({
  values: z
    .array(z.string().min(1).max(100))
    .min(1, 'At least one value is required')
    .max(10, 'Maximum 10 values'),
  leisureIdeas: z.string().max(1000).optional(),
  productivityGoals: z.string().max(1000).optional(),
  stepsCompleted: z
    .array(z.number().int().min(1).max(3))
    .default([]),
  completedAt: z.string().datetime().optional(),
});

export type ValuesData = z.infer<typeof ValuesDataSchema>;

/**
 * Validates and parses Values Foundation data.
 *
 * @param data - Raw data to validate
 * @returns Parsed ValuesData or null if invalid
 */
export function parseValuesData(data: unknown): ValuesData | null {
  const result = ValuesDataSchema.safeParse(data);
  if (!result.success) {
    return null;
  }
  return result.data;
}

/**
 * Creates a partial ValuesData from individual step responses.
 * Used to incrementally build up the values data as user completes steps.
 *
 * @param stepNumber - Which step (1, 2, or 3)
 * @param response - User's response to that step
 * @param existing - Existing values data to merge with
 * @returns Updated ValuesData
 */
export function addStepResponse(
  stepNumber: 1 | 2 | 3,
  response: string,
  existing?: Partial<ValuesData>
): Partial<ValuesData> {
  const updated: Partial<ValuesData> = {
    ...existing,
    stepsCompleted: [...(existing?.stepsCompleted ?? [])],
  };

  // Add step number if not already present
  if (!updated.stepsCompleted!.includes(stepNumber)) {
    updated.stepsCompleted!.push(stepNumber);
  }

  switch (stepNumber) {
    case 1:
      updated.leisureIdeas = response;
      break;
    case 2:
      updated.productivityGoals = response;
      break;
    case 3:
      // Step 3 is where they identify values
      // We store the raw response; extraction happens separately
      break;
  }

  return updated;
}

/**
 * Extracts individual values from a user's response text.
 * Looks for common value keywords and patterns.
 *
 * @param text - Raw text containing values
 * @returns Array of extracted value strings
 *
 * @example
 * extractValuesFromText("freedom and learning matter most to me")
 * // Returns ["freedom", "learning"]
 */
export function extractValuesFromText(text: string): string[] {
  // Common value keywords (based on challenge prompt examples)
  const valueKeywords = [
    'meaning',
    'purpose',
    'community',
    'relationships',
    'freedom',
    'independence',
    'autonomy',
    'learning',
    'growth',
    'creativity',
    'family',
    'health',
    'adventure',
    'security',
    'stability',
    'achievement',
    'success',
    'balance',
    'peace',
    'calm',
    'connection',
    'contribution',
    'impact',
    'legacy',
    'authenticity',
    'integrity',
    'honesty',
    'respect',
    'compassion',
    'kindness',
    'love',
    'joy',
    'happiness',
    'fulfillment',
    'flexibility',
    'control',
    'time',
    'money',
    'wealth',
    'recognition',
    'influence',
    'leadership',
    'mastery',
    'excellence',
    'simplicity',
  ];

  const lowerText = text.toLowerCase();
  const found: string[] = [];

  // Find known value keywords
  for (const keyword of valueKeywords) {
    if (lowerText.includes(keyword) && !found.includes(keyword)) {
      found.push(keyword);
    }
  }

  // Also try to extract comma/and-separated values
  // e.g., "I care about freedom, learning, and family"
  const patterns = [
    /(?:i (?:deeply )?care about|value|important to me|matter(?:s)? to me)[:\s]+([^.!?]+)/gi,
    /my (?:core )?values (?:are|include)[:\s]+([^.!?]+)/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const valueList = match[1];
      // Split on comma, 'and', or 'or'
      const parts = valueList.split(/[,]|\s+and\s+|\s+or\s+/);
      for (const part of parts) {
        const cleaned = part.trim().toLowerCase().replace(/[^a-z\s-]/g, '');
        if (cleaned.length > 2 && cleaned.length < 30 && !found.includes(cleaned)) {
          found.push(cleaned);
        }
      }
    }
  }

  // Limit to 10 values
  return found.slice(0, 10);
}

/**
 * Formats user's values for inclusion in a coaching system prompt.
 *
 * @param data - ValuesData with user's identified values
 * @returns Formatted string for system prompt
 */
export function formatValuesForPrompt(data: ValuesData): string {
  if (data.values.length === 0) {
    return 'The user has not yet identified their core values.';
  }

  const valuesList = data.values
    .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
    .join(', ');

  return `The user has identified these core values: ${valuesList}.

When discussing their priorities or Top 3, look for connections to these values.
This gives their daily tasks deeper meaning.`;
}

/**
 * Checks if the user has completed all 3 steps of the Values Foundation.
 *
 * @param data - ValuesData to check
 * @returns True if all steps completed
 */
export function isValuesComplete(data: Partial<ValuesData>): boolean {
  const steps = data.stepsCompleted ?? [];
  return steps.includes(1) && steps.includes(2) && steps.includes(3);
}

/**
 * Gets the next incomplete step for the Values Foundation.
 *
 * @param data - Current ValuesData
 * @returns Next step number (1, 2, or 3) or null if complete
 */
export function getNextValuesStep(
  data: Partial<ValuesData>
): 1 | 2 | 3 | null {
  const steps = data.stepsCompleted ?? [];
  if (!steps.includes(1)) return 1;
  if (!steps.includes(2)) return 2;
  if (!steps.includes(3)) return 3;
  return null;
}

/**
 * Gets step instructions for the Values Foundation.
 */
export const VALUES_STEP_INSTRUCTIONS: Record<1 | 2 | 3, string> = {
  1: 'Imagine you have two more hours of leisure time every day as a result of becoming more productive. How will you use that time? What new things will you take on?',
  2: 'What productivity goals, new habits, routines, or rituals do you have in mind that you want to take on?',
  3: 'Ask yourself: What deep-rooted values are associated with your productivity goals? Why do you want to become more productive?',
};
