/**
 * @file impactChallenge.ts
 * @description F022 - Full implementation of Challenge 2 (Impact Foundation)
 * @module challenges
 *
 * The Impact Foundation helps users identify their highest-impact tasks,
 * the 3 activities that contribute 80% of their value. This module handles:
 * - Storing the high-impact tasks users identify
 * - Providing impact context to the coaching engine
 * - Formatting high-impact tasks for system prompts
 *
 * Challenge Steps:
 * 1. List everything you're responsible for in your work
 * 2. Identify the ONE task that accomplishes the most
 * 3. Identify the second and third highest-impact tasks
 *
 * Per domain-language.mdc: Use "Impact Foundation" terminology.
 * Per bounded-contexts.mdc: Challenge Engine owns this data.
 */

import { z } from 'zod';

/**
 * The Impact Foundation challenge ID.
 */
export const IMPACT_CHALLENGE_ID = 2;

/**
 * Schema for storing Impact Foundation outcomes.
 *
 * @property highImpactTasks - The 3 highest-impact tasks identified (1-3 items)
 * @property responsibilities - Full list of work responsibilities (Step 1)
 * @property stepsCompleted - Which steps (1-3) they've completed
 * @property completedAt - When they finished the challenge
 */
export const ImpactDataSchema = z.object({
  highImpactTasks: z
    .array(z.string().min(1).max(200))
    .min(1, 'At least one high-impact task is required')
    .max(3, 'Maximum 3 high-impact tasks'),
  responsibilities: z.string().max(2000).optional(),
  stepsCompleted: z
    .array(z.number().int().min(1).max(3))
    .default([]),
  completedAt: z.string().datetime().optional(),
});

export type ImpactData = z.infer<typeof ImpactDataSchema>;

/**
 * Validates and parses Impact Foundation data.
 *
 * @param data - Raw data to validate
 * @returns Parsed ImpactData or null if invalid
 */
export function parseImpactData(data: unknown): ImpactData | null {
  const result = ImpactDataSchema.safeParse(data);
  if (!result.success) {
    return null;
  }
  return result.data;
}

/**
 * Creates a partial ImpactData from individual step responses.
 * Used to incrementally build up the impact data as user completes steps.
 *
 * @param stepNumber - Which step (1, 2, or 3)
 * @param response - User's response to that step
 * @param existing - Existing impact data to merge with
 * @returns Updated ImpactData
 */
export function addImpactStepResponse(
  stepNumber: 1 | 2 | 3,
  response: string,
  existing?: Partial<ImpactData>
): Partial<ImpactData> {
  const updated: Partial<ImpactData> = {
    ...existing,
    stepsCompleted: [...(existing?.stepsCompleted ?? [])],
    highImpactTasks: [...(existing?.highImpactTasks ?? [])],
  };

  // Add step number if not already present
  if (!updated.stepsCompleted!.includes(stepNumber)) {
    updated.stepsCompleted!.push(stepNumber);
  }

  switch (stepNumber) {
    case 1:
      // Step 1: List of responsibilities
      updated.responsibilities = response;
      break;
    case 2:
      // Step 2: First (most important) high-impact task
      // Clear and set the first task
      updated.highImpactTasks = [response.trim()];
      break;
    case 3:
      // Step 3: Second and third high-impact tasks
      // Extract tasks and add to existing first task
      const newTasks = extractHighImpactTasks(response);
      const firstTask = updated.highImpactTasks?.[0];
      if (firstTask) {
        updated.highImpactTasks = [firstTask, ...newTasks.slice(0, 2)];
      } else {
        updated.highImpactTasks = newTasks.slice(0, 3);
      }
      break;
  }

  return updated;
}

/**
 * Extracts individual high-impact tasks from a user's response text.
 * Handles numbered lists, comma separation, bullet points, and "and" separators.
 *
 * @param text - Raw text containing tasks
 * @returns Array of extracted task strings (max 3)
 *
 * @example
 * extractHighImpactTasks("1. Strategy 2. Sales 3. Mentoring")
 * // Returns ["Strategy", "Sales", "Mentoring"]
 */
export function extractHighImpactTasks(text: string): string[] {
  if (!text.trim()) {
    return [];
  }

  const tasks: string[] = [];

  // Split by newlines first to handle line-by-line formats
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Check if we have numbered or bullet list format
  const hasNumberedFormat = lines.some((l) => /^\d+[.):\s]/.test(l));
  const hasBulletFormat = lines.some((l) => /^[-*•]\s/.test(l));

  if (hasNumberedFormat || hasBulletFormat) {
    for (const line of lines) {
      // Remove numbered prefix (1. or 1) or 1:)
      let cleaned = line.replace(/^\d+[.):\s]+\s*/, '');
      // Remove bullet prefix
      cleaned = cleaned.replace(/^[-*•]\s*/, '');
      cleaned = cleaned.trim();

      if (cleaned.length > 3 && cleaned.length <= 200) {
        tasks.push(cleaned);
      }
    }

    if (tasks.length > 0) {
      return tasks.slice(0, 3);
    }
  }

  // Fall back to comma/and separation for single-line input
  const parts = text
    .split(/[,]|\s+and\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 3 && p.length <= 200);

  for (const part of parts) {
    // Clean up any leading numbers or special chars
    const cleaned = part.replace(/^[\d.):\-*•\s]+/, '').trim();
    if (cleaned.length > 3) {
      tasks.push(cleaned);
    }
  }

  return tasks.slice(0, 3);
}

/**
 * Formats user's high-impact tasks for inclusion in a coaching system prompt.
 *
 * @param data - ImpactData with user's identified high-impact tasks
 * @returns Formatted string for system prompt
 */
export function formatImpactForPrompt(data: ImpactData): string {
  if (!data.highImpactTasks || data.highImpactTasks.length === 0) {
    return 'The user has not yet identified their high-impact tasks.';
  }

  const tasksList = data.highImpactTasks
    .map((task, idx) => `${idx + 1}. ${task}`)
    .join('\n');

  return `The user has identified these high-impact tasks:

${tasksList}

These are the 3 activities that contribute ~80% of their value at work.
When setting their Top 3 for the day, prioritize tasks that align with these high-impact areas.
This helps them focus on what matters most.`;
}

/**
 * Checks if the user has completed all 3 steps of the Impact Foundation.
 *
 * @param data - ImpactData to check
 * @returns True if all steps completed
 */
export function isImpactComplete(data: Partial<ImpactData>): boolean {
  const steps = data.stepsCompleted ?? [];
  return steps.includes(1) && steps.includes(2) && steps.includes(3);
}

/**
 * Gets the next incomplete step for the Impact Foundation.
 *
 * @param data - Current ImpactData
 * @returns Next step number (1, 2, or 3) or null if complete
 */
export function getNextImpactStep(
  data: Partial<ImpactData>
): 1 | 2 | 3 | null {
  const steps = data.stepsCompleted ?? [];
  if (!steps.includes(1)) return 1;
  if (!steps.includes(2)) return 2;
  if (!steps.includes(3)) return 3;
  return null;
}

/**
 * Gets step instructions for the Impact Foundation.
 */
export const IMPACT_STEP_INSTRUCTIONS: Record<1 | 2 | 3, string> = {
  1: "Make a list of everything you're responsible for in your work. Get everything onto paper.",
  2: 'If you could do just one item on that list all day, every day, what item would allow you to accomplish the most with the same amount of time?',
  3: 'If you could do only two more items all day, what second and third tasks would let you accomplish the most?',
};
