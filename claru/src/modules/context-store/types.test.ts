import {
  type Top3Item,
  type DailyNotePlan,
  type DailyNote,
  type WorkType,
  type MorningPrompts,
  type OrganizedTasks,
  type EndOfDay,
  type DailyNoteDraft,
  createTop3Item,
  isWorkType,
  isDailyNoteState,
  canTransitionDailyNote,
  getDailyNoteState,
  createDefaultMorningPrompts,
  createDefaultOrganizedTasks,
  createDefaultEndOfDay,
  createDefaultDailyNoteDraft,
  MorningPromptsSchema,
  OrganizedTasksSchema,
  EndOfDaySchema,
  DailyNoteDraftSchema,
} from './types';

describe('User Context Store - Types', () => {
  describe('WorkType', () => {
    it('validates deep_focus as valid work type', () => {
      expect(isWorkType('deep_focus')).toBe(true);
    });

    it('validates admin as valid work type', () => {
      expect(isWorkType('admin')).toBe(true);
    });

    it('validates meeting as valid work type', () => {
      expect(isWorkType('meeting')).toBe(true);
    });

    it('rejects invalid work type', () => {
      expect(isWorkType('invalid')).toBe(false);
    });
  });

  describe('Top3Item', () => {
    it('creates a Top3Item with required fields', () => {
      const item = createTop3Item({
        text: 'Finish investor deck',
        workType: 'deep_focus',
      });

      expect(item.text).toBe('Finish investor deck');
      expect(item.workType).toBe('deep_focus');
      expect(item.completed).toBe(false);
      expect(item.completedAt).toBeUndefined();
    });

    it('creates a completed Top3Item', () => {
      const completedAt = new Date();
      const item = createTop3Item({
        text: 'Review PR',
        workType: 'admin',
        completed: true,
        completedAt,
      });

      expect(item.completed).toBe(true);
      expect(item.completedAt).toBe(completedAt);
    });
  });

  describe('DailyNotePlan', () => {
    it('has correct structure', () => {
      const plan: DailyNotePlan = {
        top3: [
          createTop3Item({ text: 'Task 1', workType: 'deep_focus' }),
          createTop3Item({ text: 'Task 2', workType: 'admin' }),
          createTop3Item({ text: 'Task 3', workType: 'meeting' }),
        ],
        adminBatch: ['Email replies', 'Slack messages'],
        focusBlock: { start: '09:00', end: '11:00' },
      };

      expect(plan.top3).toHaveLength(3);
      expect(plan.adminBatch).toHaveLength(2);
      expect(plan.focusBlock?.start).toBe('09:00');
    });
  });

  describe('DailyNoteState', () => {
    it('validates created as valid state', () => {
      expect(isDailyNoteState('created')).toBe(true);
    });

    it('validates plan_set as valid state', () => {
      expect(isDailyNoteState('plan_set')).toBe(true);
    });

    it('validates reflection_added as valid state', () => {
      expect(isDailyNoteState('reflection_added')).toBe(true);
    });

    it('validates completed as valid state', () => {
      expect(isDailyNoteState('completed')).toBe(true);
    });

    it('rejects invalid state', () => {
      expect(isDailyNoteState('invalid')).toBe(false);
    });
  });

  describe('canTransitionDailyNote', () => {
    it('allows created → plan_set', () => {
      expect(canTransitionDailyNote('created', 'plan_set')).toBe(true);
    });

    it('allows plan_set → reflection_added', () => {
      expect(canTransitionDailyNote('plan_set', 'reflection_added')).toBe(true);
    });

    it('allows reflection_added → completed', () => {
      expect(canTransitionDailyNote('reflection_added', 'completed')).toBe(true);
    });

    it('disallows created → completed (skipping states)', () => {
      expect(canTransitionDailyNote('created', 'completed')).toBe(false);
    });

    it('disallows completed → anything (terminal state)', () => {
      expect(canTransitionDailyNote('completed', 'created')).toBe(false);
      expect(canTransitionDailyNote('completed', 'plan_set')).toBe(false);
    });
  });

  describe('getDailyNoteState', () => {
    const baseNote: DailyNote = {
      id: '1',
      userId: 'user-1',
      date: '2026-01-31',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('returns created for empty note', () => {
      expect(getDailyNoteState(baseNote)).toBe('created');
    });

    it('returns plan_set when plan exists', () => {
      const note: DailyNote = {
        ...baseNote,
        plan: {
          top3: [createTop3Item({ text: 'Task', workType: 'deep_focus' })],
          adminBatch: [],
        },
      };
      expect(getDailyNoteState(note)).toBe('plan_set');
    });

    it('returns completed when both plan and reflection exist', () => {
      const note: DailyNote = {
        ...baseNote,
        plan: {
          top3: [createTop3Item({ text: 'Task', workType: 'deep_focus' })],
          adminBatch: [],
        },
        reflection: {
          wins: ['Got stuff done'],
          learnings: [],
          released: [],
        },
      };
      expect(getDailyNoteState(note)).toBe('completed');
    });
  });

  // F006: Rich daily note fields for Obsidian workflow compatibility
  describe('MorningPrompts', () => {
    it('creates default morning prompts with empty strings', () => {
      const prompts = createDefaultMorningPrompts();
      expect(prompts.weighingOnMe).toBe('');
      expect(prompts.avoiding).toBe('');
      expect(prompts.meetings).toBe('');
      expect(prompts.followUps).toBe('');
      expect(prompts.win).toBe('');
    });

    it('validates correct structure with Zod', () => {
      const prompts: MorningPrompts = {
        weighingOnMe: 'Need to finish the deck',
        avoiding: 'The difficult conversation',
        meetings: '10am standup, 2pm 1:1',
        followUps: 'Sarah re: budget',
        win: 'Ship the feature',
      };
      const result = MorningPromptsSchema.safeParse(prompts);
      expect(result.success).toBe(true);
    });

    it('rejects missing fields', () => {
      const invalid = { weighingOnMe: 'test' };
      const result = MorningPromptsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('OrganizedTasks', () => {
    it('creates default organized tasks with empty arrays and string', () => {
      const tasks = createDefaultOrganizedTasks();
      expect(tasks.actionsToday).toEqual([]);
      expect(tasks.thisWeek).toEqual([]);
      expect(tasks.decisionsNeeded).toEqual([]);
      expect(tasks.quickWins).toEqual([]);
      expect(tasks.notes).toBe('');
    });

    it('validates correct structure with Zod', () => {
      const tasks: OrganizedTasks = {
        actionsToday: ['Email replies', 'Review PR'],
        thisWeek: ['Finish spec'],
        decisionsNeeded: ['Hire contractor?'],
        quickWins: ['Update Slack status'],
        notes: 'Remember to check in with team',
      };
      const result = OrganizedTasksSchema.safeParse(tasks);
      expect(result.success).toBe(true);
    });

    it('rejects invalid array types', () => {
      const invalid = {
        actionsToday: 'not an array',
        thisWeek: [],
        decisionsNeeded: [],
        quickWins: [],
        notes: '',
      };
      const result = OrganizedTasksSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('EndOfDay', () => {
    it('creates default end of day with empty strings', () => {
      const eod = createDefaultEndOfDay();
      expect(eod.gotDone).toBe('');
      expect(eod.carryingOver).toBe('');
      expect(eod.wins).toBe('');
    });

    it('validates correct structure with Zod', () => {
      const eod: EndOfDay = {
        gotDone: 'Finished the deck, had the 1:1',
        carryingOver: 'PR review - blocked on feedback',
        wins: 'Good conversation with Sarah',
      };
      const result = EndOfDaySchema.safeParse(eod);
      expect(result.success).toBe(true);
    });
  });

  describe('DailyNoteDraft', () => {
    it('creates default draft with all empty fields', () => {
      const draft = createDefaultDailyNoteDraft('2026-02-01');
      expect(draft.noteDate).toBe('2026-02-01');
      expect(draft.rawDump).toBe('');
      expect(draft.morningPrompts.weighingOnMe).toBe('');
      expect(draft.top3).toHaveLength(3);
      expect(draft.top3[0].text).toBe('');
      expect(draft.top3[0].completed).toBe(false);
      expect(draft.organizedTasks.actionsToday).toEqual([]);
      expect(draft.endOfDay.gotDone).toBe('');
    });

    it('validates complete draft structure with Zod', () => {
      const draft: DailyNoteDraft = {
        noteDate: '2026-02-01',
        rawDump: 'Brain dump content here',
        morningPrompts: createDefaultMorningPrompts(),
        top3: [
          { text: 'Task 1', completed: false },
          { text: 'Task 2', completed: true },
          { text: '', completed: false },
        ],
        organizedTasks: createDefaultOrganizedTasks(),
        endOfDay: createDefaultEndOfDay(),
      };
      const result = DailyNoteDraftSchema.safeParse(draft);
      expect(result.success).toBe(true);
    });

    it('validates noteDate format', () => {
      const invalidDraft = {
        noteDate: 'not-a-date',
        rawDump: '',
        morningPrompts: createDefaultMorningPrompts(),
        top3: [],
        organizedTasks: createDefaultOrganizedTasks(),
        endOfDay: createDefaultEndOfDay(),
      };
      const result = DailyNoteDraftSchema.safeParse(invalidDraft);
      expect(result.success).toBe(false);
    });
  });
});
