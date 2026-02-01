/**
 * @file valuesChallenge.test.ts
 * @description Tests for F021 Values Foundation implementation
 * @module challenges
 */

import {
  VALUES_CHALLENGE_ID,
  ValuesDataSchema,
  parseValuesData,
  addStepResponse,
  extractValuesFromText,
  formatValuesForPrompt,
  isValuesComplete,
  getNextValuesStep,
  VALUES_STEP_INSTRUCTIONS,
  type ValuesData,
} from './valuesChallenge';

describe('VALUES_CHALLENGE_ID', () => {
  it('should be 1', () => {
    expect(VALUES_CHALLENGE_ID).toBe(1);
  });
});

describe('ValuesDataSchema', () => {
  it('should validate complete values data', () => {
    const data = {
      values: ['freedom', 'learning', 'family'],
      leisureIdeas: 'Read more books, spend time with kids',
      productivityGoals: 'Wake up earlier, exercise daily',
      stepsCompleted: [1, 2, 3],
      completedAt: '2026-02-01T12:00:00Z',
    };

    const result = ValuesDataSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.values).toEqual(['freedom', 'learning', 'family']);
    }
  });

  it('should validate minimal values data', () => {
    const data = {
      values: ['freedom'],
    };

    const result = ValuesDataSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stepsCompleted).toEqual([]);
    }
  });

  it('should require at least one value', () => {
    const data = {
      values: [],
    };

    const result = ValuesDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject more than 10 values', () => {
    const data = {
      values: Array(11).fill('value'),
    };

    const result = ValuesDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject empty string values', () => {
    const data = {
      values: ['freedom', ''],
    };

    const result = ValuesDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject values over 100 characters', () => {
    const data = {
      values: ['a'.repeat(101)],
    };

    const result = ValuesDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('parseValuesData', () => {
  it('should return parsed data for valid input', () => {
    const data = { values: ['freedom'] };
    const result = parseValuesData(data);
    expect(result).not.toBeNull();
    expect(result?.values).toEqual(['freedom']);
  });

  it('should return null for invalid input', () => {
    const result = parseValuesData({ values: [] });
    expect(result).toBeNull();
  });

  it('should return null for non-object input', () => {
    const result = parseValuesData('not an object');
    expect(result).toBeNull();
  });
});

describe('addStepResponse', () => {
  it('should add step 1 response (leisure ideas)', () => {
    const result = addStepResponse(1, 'Read more books');
    expect(result.leisureIdeas).toBe('Read more books');
    expect(result.stepsCompleted).toContain(1);
  });

  it('should add step 2 response (productivity goals)', () => {
    const result = addStepResponse(2, 'Wake up earlier');
    expect(result.productivityGoals).toBe('Wake up earlier');
    expect(result.stepsCompleted).toContain(2);
  });

  it('should add step 3 and mark completed', () => {
    const result = addStepResponse(3, 'Freedom and learning');
    expect(result.stepsCompleted).toContain(3);
  });

  it('should merge with existing data', () => {
    const existing = {
      leisureIdeas: 'Read more',
      stepsCompleted: [1],
    };
    const result = addStepResponse(2, 'Exercise daily', existing);
    expect(result.leisureIdeas).toBe('Read more');
    expect(result.productivityGoals).toBe('Exercise daily');
    expect(result.stepsCompleted).toContain(1);
    expect(result.stepsCompleted).toContain(2);
  });

  it('should not duplicate step numbers', () => {
    const existing = {
      stepsCompleted: [1],
    };
    const result = addStepResponse(1, 'Updated response', existing);
    const stepCount = result.stepsCompleted!.filter((s) => s === 1).length;
    expect(stepCount).toBe(1);
  });
});

describe('extractValuesFromText', () => {
  it('should extract known value keywords', () => {
    const text = 'I care about freedom and learning in my work';
    const values = extractValuesFromText(text);
    expect(values).toContain('freedom');
    expect(values).toContain('learning');
  });

  it('should extract values from "I care about X" pattern', () => {
    const text = 'I deeply care about creativity, family, and growth';
    const values = extractValuesFromText(text);
    expect(values).toContain('creativity');
    expect(values).toContain('family');
    expect(values).toContain('growth');
  });

  it('should extract values from "my values are X" pattern', () => {
    const text = 'My core values are integrity, authenticity, and compassion.';
    const values = extractValuesFromText(text);
    expect(values).toContain('integrity');
    expect(values).toContain('authenticity');
    expect(values).toContain('compassion');
  });

  it('should handle comma-separated lists', () => {
    const text = 'Values: freedom, peace, balance';
    const values = extractValuesFromText(text);
    expect(values).toContain('freedom');
    expect(values).toContain('peace');
    expect(values).toContain('balance');
  });

  it('should not duplicate values', () => {
    const text = 'Freedom is important. I value freedom above all.';
    const values = extractValuesFromText(text);
    const freedomCount = values.filter((v) => v === 'freedom').length;
    expect(freedomCount).toBe(1);
  });

  it('should limit to 10 values', () => {
    const text =
      'meaning, purpose, community, relationships, freedom, learning, creativity, family, health, adventure, security, balance';
    const values = extractValuesFromText(text);
    expect(values.length).toBeLessThanOrEqual(10);
  });

  it('should handle empty text', () => {
    const values = extractValuesFromText('');
    expect(values).toEqual([]);
  });

  it('should be case insensitive', () => {
    const text = 'FREEDOM and Learning matter';
    const values = extractValuesFromText(text);
    expect(values).toContain('freedom');
    expect(values).toContain('learning');
  });
});

describe('formatValuesForPrompt', () => {
  it('should format multiple values nicely', () => {
    const data: ValuesData = {
      values: ['freedom', 'learning', 'family'],
      stepsCompleted: [1, 2, 3],
    };
    const formatted = formatValuesForPrompt(data);
    expect(formatted).toContain('Freedom, Learning, Family');
    expect(formatted).toContain('core values');
  });

  it('should capitalize each value', () => {
    const data: ValuesData = {
      values: ['freedom'],
      stepsCompleted: [3],
    };
    const formatted = formatValuesForPrompt(data);
    expect(formatted).toContain('Freedom');
    expect(formatted).not.toContain('freedom.');
  });

  it('should handle no values gracefully', () => {
    // Need to bypass validation for this test
    const data = { values: [], stepsCompleted: [] } as unknown as ValuesData;
    const formatted = formatValuesForPrompt(data);
    expect(formatted).toContain('has not yet identified');
  });

  it('should include coaching guidance', () => {
    const data: ValuesData = {
      values: ['growth'],
      stepsCompleted: [3],
    };
    const formatted = formatValuesForPrompt(data);
    expect(formatted).toContain('Top 3');
    expect(formatted).toContain('deeper meaning');
  });
});

describe('isValuesComplete', () => {
  it('should return true when all steps completed', () => {
    const data = { stepsCompleted: [1, 2, 3] };
    expect(isValuesComplete(data)).toBe(true);
  });

  it('should return true regardless of step order', () => {
    const data = { stepsCompleted: [3, 1, 2] };
    expect(isValuesComplete(data)).toBe(true);
  });

  it('should return false when steps missing', () => {
    const data = { stepsCompleted: [1, 2] };
    expect(isValuesComplete(data)).toBe(false);
  });

  it('should return false for empty steps', () => {
    const data = { stepsCompleted: [] };
    expect(isValuesComplete(data)).toBe(false);
  });

  it('should handle undefined stepsCompleted', () => {
    const data = {};
    expect(isValuesComplete(data)).toBe(false);
  });
});

describe('getNextValuesStep', () => {
  it('should return 1 for empty progress', () => {
    const data = {};
    expect(getNextValuesStep(data)).toBe(1);
  });

  it('should return 2 after step 1', () => {
    const data = { stepsCompleted: [1] };
    expect(getNextValuesStep(data)).toBe(2);
  });

  it('should return 3 after steps 1 and 2', () => {
    const data = { stepsCompleted: [1, 2] };
    expect(getNextValuesStep(data)).toBe(3);
  });

  it('should return null when all complete', () => {
    const data = { stepsCompleted: [1, 2, 3] };
    expect(getNextValuesStep(data)).toBeNull();
  });

  it('should find gaps in non-sequential completion', () => {
    const data = { stepsCompleted: [2, 3] };
    expect(getNextValuesStep(data)).toBe(1);
  });
});

describe('VALUES_STEP_INSTRUCTIONS', () => {
  it('should have instructions for all 3 steps', () => {
    expect(VALUES_STEP_INSTRUCTIONS[1]).toBeDefined();
    expect(VALUES_STEP_INSTRUCTIONS[2]).toBeDefined();
    expect(VALUES_STEP_INSTRUCTIONS[3]).toBeDefined();
  });

  it('should mention leisure time in step 1', () => {
    expect(VALUES_STEP_INSTRUCTIONS[1]).toContain('leisure time');
  });

  it('should mention productivity goals in step 2', () => {
    expect(VALUES_STEP_INSTRUCTIONS[2]).toContain('productivity goals');
  });

  it('should mention values in step 3', () => {
    expect(VALUES_STEP_INSTRUCTIONS[3]).toContain('values');
  });
});
