/**
 * @file impactChallenge.test.ts
 * @description Tests for F022 Impact Foundation implementation
 * @module challenges
 */

import {
  IMPACT_CHALLENGE_ID,
  ImpactDataSchema,
  parseImpactData,
  addImpactStepResponse,
  extractHighImpactTasks,
  formatImpactForPrompt,
  isImpactComplete,
  getNextImpactStep,
  IMPACT_STEP_INSTRUCTIONS,
  type ImpactData,
} from './impactChallenge';

describe('IMPACT_CHALLENGE_ID', () => {
  it('should be 2', () => {
    expect(IMPACT_CHALLENGE_ID).toBe(2);
  });
});

describe('ImpactDataSchema', () => {
  it('should validate complete impact data', () => {
    const data = {
      highImpactTasks: ['Lead product strategy', 'Close key deals', 'Mentor team'],
      responsibilities: 'Product roadmap, stakeholder management, team 1:1s, budgeting',
      stepsCompleted: [1, 2, 3],
      completedAt: '2026-02-01T12:00:00Z',
    };

    const result = ImpactDataSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.highImpactTasks).toHaveLength(3);
    }
  });

  it('should validate minimal impact data', () => {
    const data = {
      highImpactTasks: ['Build features'],
    };

    const result = ImpactDataSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stepsCompleted).toEqual([]);
    }
  });

  it('should require at least one high-impact task', () => {
    const data = {
      highImpactTasks: [],
    };

    const result = ImpactDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should enforce exactly 3 high-impact tasks for completion', () => {
    const data = {
      highImpactTasks: ['Task 1', 'Task 2', 'Task 3', 'Task 4'],
    };

    const result = ImpactDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject empty string tasks', () => {
    const data = {
      highImpactTasks: ['Valid task', ''],
    };

    const result = ImpactDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject tasks over 200 characters', () => {
    const data = {
      highImpactTasks: ['a'.repeat(201)],
    };

    const result = ImpactDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should allow responsibilities up to 2000 characters', () => {
    const data = {
      highImpactTasks: ['Task 1'],
      responsibilities: 'a'.repeat(2000),
    };

    const result = ImpactDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('parseImpactData', () => {
  it('should return parsed data for valid input', () => {
    const data = { highImpactTasks: ['Lead product'] };
    const result = parseImpactData(data);
    expect(result).not.toBeNull();
    expect(result?.highImpactTasks).toEqual(['Lead product']);
  });

  it('should return null for invalid input', () => {
    const result = parseImpactData({ highImpactTasks: [] });
    expect(result).toBeNull();
  });

  it('should return null for non-object input', () => {
    const result = parseImpactData('not an object');
    expect(result).toBeNull();
  });
});

describe('addImpactStepResponse', () => {
  it('should add step 1 response (responsibilities)', () => {
    const result = addImpactStepResponse(1, 'Product roadmap, stakeholder management, team leads');
    expect(result.responsibilities).toBe('Product roadmap, stakeholder management, team leads');
    expect(result.stepsCompleted).toContain(1);
  });

  it('should add step 2 response (first high-impact task)', () => {
    const result = addImpactStepResponse(2, 'Lead product strategy');
    expect(result.highImpactTasks).toContain('Lead product strategy');
    expect(result.stepsCompleted).toContain(2);
  });

  it('should add step 3 response (second and third high-impact tasks)', () => {
    const existing = {
      highImpactTasks: ['Lead product strategy'],
      stepsCompleted: [1, 2],
    };
    const result = addImpactStepResponse(3, 'Close key deals, Mentor team members', existing);
    expect(result.highImpactTasks).toHaveLength(3);
    expect(result.stepsCompleted).toContain(3);
  });

  it('should merge with existing data', () => {
    const existing = {
      responsibilities: 'Product, Engineering, Design',
      stepsCompleted: [1],
    };
    const result = addImpactStepResponse(2, 'Product strategy', existing);
    expect(result.responsibilities).toBe('Product, Engineering, Design');
    expect(result.highImpactTasks).toContain('Product strategy');
    expect(result.stepsCompleted).toContain(1);
    expect(result.stepsCompleted).toContain(2);
  });

  it('should not duplicate step numbers', () => {
    const existing = {
      stepsCompleted: [1],
    };
    const result = addImpactStepResponse(1, 'Updated responsibilities', existing);
    const stepCount = result.stepsCompleted!.filter((s) => s === 1).length;
    expect(stepCount).toBe(1);
  });
});

describe('extractHighImpactTasks', () => {
  it('should extract numbered tasks', () => {
    const text = `
      1. Lead product strategy
      2. Close key deals
      3. Mentor team members
    `;
    const tasks = extractHighImpactTasks(text);
    expect(tasks).toHaveLength(3);
    expect(tasks[0]).toContain('Lead product strategy');
    expect(tasks[1]).toContain('Close key deals');
    expect(tasks[2]).toContain('Mentor team members');
  });

  it('should extract comma-separated tasks', () => {
    const text = 'Product strategy, deal closing, team mentoring';
    const tasks = extractHighImpactTasks(text);
    expect(tasks.length).toBeGreaterThanOrEqual(3);
  });

  it('should extract "and"-separated tasks', () => {
    const text = 'Product strategy and deal closing and team mentoring';
    const tasks = extractHighImpactTasks(text);
    expect(tasks.length).toBeGreaterThanOrEqual(3);
  });

  it('should clean up task text', () => {
    const text = '1)  Lead product strategy  ';
    const tasks = extractHighImpactTasks(text);
    expect(tasks[0]).toBe('Lead product strategy');
  });

  it('should limit to 3 tasks', () => {
    const text = 'Task 1, Task 2, Task 3, Task 4, Task 5';
    const tasks = extractHighImpactTasks(text);
    expect(tasks.length).toBeLessThanOrEqual(3);
  });

  it('should handle empty text', () => {
    const tasks = extractHighImpactTasks('');
    expect(tasks).toEqual([]);
  });

  it('should handle bullet points', () => {
    const text = `
      - Lead product strategy
      - Close key deals
      - Mentor team
    `;
    const tasks = extractHighImpactTasks(text);
    expect(tasks.length).toBeGreaterThanOrEqual(3);
  });

  it('should filter out very short tasks', () => {
    const text = '1. A, 2. Lead product strategy';
    const tasks = extractHighImpactTasks(text);
    expect(tasks).not.toContain('A');
  });
});

describe('formatImpactForPrompt', () => {
  it('should format high-impact tasks nicely', () => {
    const data: ImpactData = {
      highImpactTasks: ['Lead product strategy', 'Close key deals', 'Mentor team'],
      stepsCompleted: [1, 2, 3],
    };
    const formatted = formatImpactForPrompt(data);
    expect(formatted).toContain('Lead product strategy');
    expect(formatted).toContain('Close key deals');
    expect(formatted).toContain('Mentor team');
    expect(formatted).toContain('high-impact');
  });

  it('should number the tasks', () => {
    const data: ImpactData = {
      highImpactTasks: ['Task A', 'Task B', 'Task C'],
      stepsCompleted: [3],
    };
    const formatted = formatImpactForPrompt(data);
    expect(formatted).toContain('1.');
    expect(formatted).toContain('2.');
    expect(formatted).toContain('3.');
  });

  it('should handle incomplete data gracefully', () => {
    // Need to bypass validation for this test
    const data = { highImpactTasks: [], stepsCompleted: [] } as unknown as ImpactData;
    const formatted = formatImpactForPrompt(data);
    expect(formatted).toContain('has not yet identified');
  });

  it('should include coaching guidance', () => {
    const data: ImpactData = {
      highImpactTasks: ['Strategy'],
      stepsCompleted: [2],
    };
    const formatted = formatImpactForPrompt(data);
    expect(formatted).toContain('Top 3');
  });
});

describe('isImpactComplete', () => {
  it('should return true when all steps completed', () => {
    const data = { stepsCompleted: [1, 2, 3] };
    expect(isImpactComplete(data)).toBe(true);
  });

  it('should return true regardless of step order', () => {
    const data = { stepsCompleted: [3, 1, 2] };
    expect(isImpactComplete(data)).toBe(true);
  });

  it('should return false when steps missing', () => {
    const data = { stepsCompleted: [1, 2] };
    expect(isImpactComplete(data)).toBe(false);
  });

  it('should return false for empty steps', () => {
    const data = { stepsCompleted: [] };
    expect(isImpactComplete(data)).toBe(false);
  });

  it('should handle undefined stepsCompleted', () => {
    const data = {};
    expect(isImpactComplete(data)).toBe(false);
  });
});

describe('getNextImpactStep', () => {
  it('should return 1 for empty progress', () => {
    const data = {};
    expect(getNextImpactStep(data)).toBe(1);
  });

  it('should return 2 after step 1', () => {
    const data = { stepsCompleted: [1] };
    expect(getNextImpactStep(data)).toBe(2);
  });

  it('should return 3 after steps 1 and 2', () => {
    const data = { stepsCompleted: [1, 2] };
    expect(getNextImpactStep(data)).toBe(3);
  });

  it('should return null when all complete', () => {
    const data = { stepsCompleted: [1, 2, 3] };
    expect(getNextImpactStep(data)).toBeNull();
  });

  it('should find gaps in non-sequential completion', () => {
    const data = { stepsCompleted: [2, 3] };
    expect(getNextImpactStep(data)).toBe(1);
  });
});

describe('IMPACT_STEP_INSTRUCTIONS', () => {
  it('should have instructions for all 3 steps', () => {
    expect(IMPACT_STEP_INSTRUCTIONS[1]).toBeDefined();
    expect(IMPACT_STEP_INSTRUCTIONS[2]).toBeDefined();
    expect(IMPACT_STEP_INSTRUCTIONS[3]).toBeDefined();
  });

  it('should mention responsibilities in step 1', () => {
    expect(IMPACT_STEP_INSTRUCTIONS[1]).toContain('responsible');
  });

  it('should mention one item in step 2', () => {
    expect(IMPACT_STEP_INSTRUCTIONS[2]).toContain('one');
  });

  it('should mention second and third in step 3', () => {
    expect(IMPACT_STEP_INSTRUCTIONS[3]).toContain('second');
    expect(IMPACT_STEP_INSTRUCTIONS[3]).toContain('third');
  });
});
