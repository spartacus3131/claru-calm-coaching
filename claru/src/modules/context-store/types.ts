/**
 * User Context Store Types - F005 Daily Note Extraction + F006 Rich Fields
 *
 * Types for daily notes, plans, and extracted data.
 * Based on claru-user-context-store-canvas.md.
 * 
 * F006: Added MorningPrompts, OrganizedTasks, EndOfDay, DailyNoteDraft
 * to match the user's Obsidian daily note workflow.
 */

import { z } from 'zod';

/**
 * Work type classification.
 * Per coaching-engine-canvas:
 * - deep_focus: Tasks requiring 45+ minutes uninterrupted
 * - admin: Quick 2-5 minute tasks that can be batched
 * - meeting: Meeting-related work including prep
 */
export type WorkType = 'deep_focus' | 'admin' | 'meeting';

const VALID_WORK_TYPES: WorkType[] = ['deep_focus', 'admin', 'meeting'];

/**
 * Checks if a string is a valid work type.
 */
export function isWorkType(value: string): value is WorkType {
  return VALID_WORK_TYPES.includes(value as WorkType);
}

/**
 * A single Top 3 priority item.
 */
export interface Top3Item {
  text: string;
  workType: WorkType;
  completed: boolean;
  completedAt?: Date;
}

/**
 * Input for creating a Top3Item.
 */
export interface CreateTop3ItemInput {
  text: string;
  workType: WorkType;
  completed?: boolean;
  completedAt?: Date;
}

/**
 * Creates a Top3Item with defaults.
 */
export function createTop3Item(input: CreateTop3ItemInput): Top3Item {
  return {
    text: input.text,
    workType: input.workType,
    completed: input.completed ?? false,
    completedAt: input.completedAt,
  };
}

/**
 * Time block for focused work.
 */
export interface FocusBlock {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

/**
 * The plan portion of a daily note.
 */
export interface DailyNotePlan {
  top3: Top3Item[];
  adminBatch: string[];
  focusBlock?: FocusBlock;
  meetingPrep?: string[];
}

/**
 * Evening reflection data.
 */
export interface DailyNoteReflection {
  wins: string[];
  learnings: string[];
  released: string[];
}

/**
 * Complete daily note structure.
 */
export interface DailyNote {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  rawDump?: string;
  plan?: DailyNotePlan;
  reflection?: DailyNoteReflection;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Daily note states.
 * Per user-context-store-canvas:
 * Created → PlanSet → ReflectionAdded → Completed
 */
export type DailyNoteState = 'created' | 'plan_set' | 'reflection_added' | 'completed';

const VALID_DAILY_NOTE_STATES: DailyNoteState[] = ['created', 'plan_set', 'reflection_added', 'completed'];

/**
 * Checks if a string is a valid daily note state.
 */
export function isDailyNoteState(value: string): value is DailyNoteState {
  return VALID_DAILY_NOTE_STATES.includes(value as DailyNoteState);
}

/**
 * Valid state transitions for daily notes.
 */
const DAILY_NOTE_TRANSITIONS: Record<DailyNoteState, DailyNoteState[]> = {
  created: ['plan_set'],
  plan_set: ['reflection_added'],
  reflection_added: ['completed'],
  completed: [],
};

/**
 * Checks if a state transition is valid.
 */
export function canTransitionDailyNote(from: DailyNoteState, to: DailyNoteState): boolean {
  return DAILY_NOTE_TRANSITIONS[from].includes(to);
}

/**
 * Determines the current state of a daily note based on its content.
 */
export function getDailyNoteState(note: DailyNote): DailyNoteState {
  if (note.reflection && note.plan) {
    return 'completed';
  }
  if (note.reflection) {
    return 'reflection_added';
  }
  if (note.plan) {
    return 'plan_set';
  }
  return 'created';
}

/**
 * Carryover item from incomplete Top 3.
 */
export interface CarryoverItem {
  text: string;
  workType: WorkType;
  originalDate: string; // YYYY-MM-DD
  daysSinceOriginal: number;
}

/**
 * Parked item - task intentionally deferred for later.
 * Per domain-language.mdc: Use "parked" not "deferred" or "backlog".
 */
export interface ParkedItem {
  id: string;
  userId: string;
  text: string;
  reason?: string; // Why it was parked
  status: ParkedItemStatus;
  createdAt: Date;
  updatedAt: Date;
  lastReviewedAt?: Date;
}

/**
 * Parked item states.
 * Per state-machines.mdc:
 * parked → under_review → reactivated | parked | deleted
 */
export type ParkedItemStatus = 'parked' | 'under_review' | 'reactivated' | 'deleted';

const VALID_PARKED_STATUSES: ParkedItemStatus[] = ['parked', 'under_review', 'reactivated', 'deleted'];

/**
 * Checks if a string is a valid parked item status.
 */
export function isParkedItemStatus(value: string): value is ParkedItemStatus {
  return VALID_PARKED_STATUSES.includes(value as ParkedItemStatus);
}

/**
 * Context snapshot for AI personalization.
 */
export interface ContextSnapshot {
  yesterdayPlan?: DailyNotePlan;
  carryover: CarryoverItem[];
  parkedItems: ParkedItem[];
  recentPatterns: string[];
  currentStreak: number;
}

// ============================================
// F006: Rich Daily Note Fields
// ============================================
// These types match the user's Obsidian daily note workflow
// with morning prompts, organized tasks, and end-of-day reflection.

/**
 * Morning check-in prompts to surface mental load.
 * Per Obsidian template: helps extract hidden concerns.
 */
export interface MorningPrompts {
  weighingOnMe: string;
  avoiding: string;
  meetings: string;
  followUps: string;
  win: string;
}

/**
 * Zod schema for MorningPrompts validation.
 */
export const MorningPromptsSchema = z.object({
  weighingOnMe: z.string(),
  avoiding: z.string(),
  meetings: z.string(),
  followUps: z.string(),
  win: z.string(),
});

/**
 * Creates default empty morning prompts.
 */
export function createDefaultMorningPrompts(): MorningPrompts {
  return {
    weighingOnMe: '',
    avoiding: '',
    meetings: '',
    followUps: '',
    win: '',
  };
}

/**
 * Organized tasks categorized by urgency and type.
 * Per Obsidian template: helps structure the day.
 */
export interface OrganizedTasks {
  actionsToday: string[];
  thisWeek: string[];
  decisionsNeeded: string[];
  quickWins: string[];
  notes: string;
}

/**
 * Zod schema for OrganizedTasks validation.
 */
export const OrganizedTasksSchema = z.object({
  actionsToday: z.array(z.string()),
  thisWeek: z.array(z.string()),
  decisionsNeeded: z.array(z.string()),
  quickWins: z.array(z.string()),
  notes: z.string(),
});

/**
 * Creates default empty organized tasks.
 */
export function createDefaultOrganizedTasks(): OrganizedTasks {
  return {
    actionsToday: [],
    thisWeek: [],
    decisionsNeeded: [],
    quickWins: [],
    notes: '',
  };
}

/**
 * End of day reflection (freeform text).
 * Different from DailyNoteReflection which is structured arrays.
 */
export interface EndOfDay {
  gotDone: string;
  carryingOver: string;
  wins: string;
}

/**
 * Zod schema for EndOfDay validation.
 */
export const EndOfDaySchema = z.object({
  gotDone: z.string(),
  carryingOver: z.string(),
  wins: z.string(),
});

/**
 * Creates default empty end of day.
 */
export function createDefaultEndOfDay(): EndOfDay {
  return {
    gotDone: '',
    carryingOver: '',
    wins: '',
  };
}

/**
 * Simple Top 3 item for UI (without workType).
 * Used in DailyNoteDraft for simpler UI binding.
 */
export interface DailyNoteTop3Item {
  text: string;
  completed: boolean;
}

/**
 * Zod schema for DailyNoteTop3Item validation.
 */
export const DailyNoteTop3ItemSchema = z.object({
  text: z.string(),
  completed: z.boolean(),
});

/**
 * Complete daily note draft structure for UI.
 * This matches the old src/ UI expectations.
 */
export interface DailyNoteDraft {
  noteDate: string; // yyyy-MM-dd
  rawDump: string;
  morningPrompts: MorningPrompts;
  top3: DailyNoteTop3Item[];
  organizedTasks: OrganizedTasks;
  endOfDay: EndOfDay;
}

/**
 * Date format regex for yyyy-MM-dd.
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Zod schema for DailyNoteDraft validation.
 */
export const DailyNoteDraftSchema = z.object({
  noteDate: z.string().regex(DATE_REGEX, 'Date must be in yyyy-MM-dd format'),
  rawDump: z.string(),
  morningPrompts: MorningPromptsSchema,
  top3: z.array(DailyNoteTop3ItemSchema),
  organizedTasks: OrganizedTasksSchema,
  endOfDay: EndOfDaySchema,
});

/**
 * Creates a default empty daily note draft for a given date.
 */
export function createDefaultDailyNoteDraft(noteDate: string): DailyNoteDraft {
  return {
    noteDate,
    rawDump: '',
    morningPrompts: createDefaultMorningPrompts(),
    top3: [
      { text: '', completed: false },
      { text: '', completed: false },
      { text: '', completed: false },
    ],
    organizedTasks: createDefaultOrganizedTasks(),
    endOfDay: createDefaultEndOfDay(),
  };
}
