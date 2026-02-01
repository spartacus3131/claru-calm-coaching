/**
 * @file projects.ts
 * @description Project types and validation for User Context Store
 * @module context-store
 * 
 * F014: Projects CRUD
 * 
 * Per event-storming.md: "Flat list of projects, user creates and references in check-ins"
 * Per PRD: "A user-defined container for related work"
 */

import { z } from 'zod';

/**
 * Project type values.
 */
export const ProjectType = z.enum(['active', 'recurring']);
export type ProjectType = z.infer<typeof ProjectType>;

/**
 * Project status values.
 */
export const ProjectStatus = z.enum(['active', 'blocked', 'in-progress', 'completed', 'paused']);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

/**
 * Project entity.
 * Per domain-language.mdc: Use "Project" not "goal" or "initiative"
 */
export interface Project {
  id: string;
  userId: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  goals: string[];
  blockers: string[];
  nextActions: string[];
  recentProgress: string | null;
  notes: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Zod schema for creating a project.
 * Per typescript.mdc: ALWAYS validate external input with Zod
 */
export const CreateProjectSchema = z.object({
  title: z.string().min(1, 'Project name is required').max(200),
  type: ProjectType.optional().default('active'),
  status: ProjectStatus.optional().default('active'),
  goals: z.array(z.string()).optional().default([]),
  blockers: z.array(z.string()).optional().default([]),
  nextActions: z.array(z.string()).optional().default([]),
  recentProgress: z.string().max(5000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

/**
 * Zod schema for updating a project.
 */
export const UpdateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: ProjectType.optional(),
  status: ProjectStatus.optional(),
  goals: z.array(z.string()).optional(),
  blockers: z.array(z.string()).optional(),
  nextActions: z.array(z.string()).optional(),
  recentProgress: z.string().max(5000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  position: z.number().optional(),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

/**
 * Converts database row to Project entity.
 * 
 * @param row - Database row with snake_case columns
 * @returns Project entity with camelCase properties
 */
export function toProject(row: {
  id: string;
  user_id: string;
  title: string;
  type: string;
  status: string;
  goals: unknown;
  blockers: unknown;
  next_actions: unknown;
  recent_progress: string | null;
  notes: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}): Project {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    type: row.type as ProjectType,
    status: row.status as ProjectStatus,
    goals: Array.isArray(row.goals) ? row.goals : [],
    blockers: Array.isArray(row.blockers) ? row.blockers : [],
    nextActions: Array.isArray(row.next_actions) ? row.next_actions : [],
    recentProgress: row.recent_progress,
    notes: row.notes,
    position: row.position ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Converts Project entity to database insert format.
 * 
 * @param input - Create project input
 * @param userId - User ID from auth
 * @returns Database insert object with snake_case columns
 */
export function toDbInsert(input: CreateProjectInput, userId: string) {
  return {
    user_id: userId,
    title: input.title,
    type: input.type ?? 'active',
    status: input.status ?? 'active',
    goals: input.goals ?? [],
    blockers: input.blockers ?? [],
    next_actions: input.nextActions ?? [],
    recent_progress: input.recentProgress ?? null,
    notes: input.notes ?? null,
  };
}

/**
 * Converts update input to database update format.
 * 
 * @param input - Update project input
 * @returns Database update object with snake_case columns
 */
export function toDbUpdate(input: UpdateProjectInput) {
  const update: Record<string, unknown> = {};
  
  if (input.title !== undefined) update.title = input.title;
  if (input.type !== undefined) update.type = input.type;
  if (input.status !== undefined) update.status = input.status;
  if (input.goals !== undefined) update.goals = input.goals;
  if (input.blockers !== undefined) update.blockers = input.blockers;
  if (input.nextActions !== undefined) update.next_actions = input.nextActions;
  if (input.recentProgress !== undefined) update.recent_progress = input.recentProgress;
  if (input.notes !== undefined) update.notes = input.notes;
  if (input.position !== undefined) update.position = input.position;
  
  return update;
}
