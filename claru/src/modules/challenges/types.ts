/**
 * @file types.ts
 * @description Challenge Engine types and Zod validation schemas
 * @module challenges
 *
 * Defines the core types for the 22 productivity challenges (called "Foundations"
 * in user-facing copy). Each challenge belongs to one of three journey parts:
 * Clarity, Systems, or Capacity.
 */

import { z } from 'zod';

/**
 * The three parts of the productivity journey.
 * - clarity: Know what matters (Foundations 1-7)
 * - systems: Build your infrastructure (Foundations 8-15)
 * - capacity: Protect your energy (Foundations 16-22)
 */
export const JourneyPartSchema = z.enum(['clarity', 'systems', 'capacity']);
export type JourneyPart = z.infer<typeof JourneyPartSchema>;

/**
 * A single step within a challenge.
 * Each challenge has 3 guided steps the user works through.
 */
export const ChallengeStepSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Step content cannot be empty'),
});
export type ChallengeStep = z.infer<typeof ChallengeStepSchema>;

/**
 * Static definition of a challenge/foundation.
 * This is the "template" data that doesn't change per user.
 *
 * @property id - Unique identifier (1-22)
 * @property title - Display title (e.g., "The Values Foundation")
 * @property description - Short tagline
 * @property part - Which journey part this belongs to
 * @property partTitle - Human-readable part name
 * @property time - Estimated time to complete (e.g., "7 minutes", "~1 week")
 * @property energy - Energy required (1-10)
 * @property value - Expected value/impact (1-10)
 * @property whatYouGet - Detailed description of benefits
 * @property steps - The 3 guided steps
 * @property tips - Optional helpful tips
 * @property worksheetPrompts - Optional reflection prompts
 * @property relevantResearch - Optional research topics
 * @property researchInsight - Optional research summary
 * @property actionableTip - Optional single actionable tip
 * @property citation - Optional source citation
 */
export const ChallengeDefinitionSchema = z.object({
  id: z.number().int().positive('Challenge ID must be a positive integer'),
  title: z.string().min(1, 'Title cannot be empty'),
  description: z.string().min(1, 'Description cannot be empty'),
  part: JourneyPartSchema,
  partTitle: z.string().min(1, 'Part title cannot be empty'),
  time: z.string().min(1, 'Time estimate cannot be empty'),
  energy: z.number().int().min(1).max(10, 'Energy must be between 1 and 10'),
  value: z.number().int().min(1).max(10, 'Value must be between 1 and 10'),
  whatYouGet: z.string().min(1, 'whatYouGet cannot be empty'),
  steps: z.array(ChallengeStepSchema).min(1, 'Must have at least one step'),
  tips: z.array(z.string()).optional(),
  worksheetPrompts: z.array(z.string()).optional(),
  relevantResearch: z.array(z.string()).optional(),
  researchInsight: z.string().optional(),
  actionableTip: z.string().optional(),
  citation: z.string().optional(),
});
export type ChallengeDefinition = z.infer<typeof ChallengeDefinitionSchema>;

/**
 * Metadata about a journey part.
 */
export const PartInfoSchema = z.object({
  title: z.string(),
  order: z.number().int().min(1).max(3),
  description: z.string(),
});
export type PartInfo = z.infer<typeof PartInfoSchema>;

/**
 * Map of journey parts to their metadata.
 */
export const PartInfoMapSchema = z.record(JourneyPartSchema, PartInfoSchema);
export type PartInfoMap = z.infer<typeof PartInfoMapSchema>;
