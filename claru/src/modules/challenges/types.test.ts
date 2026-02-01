/**
 * @file types.test.ts
 * @description Tests for Challenge Engine types and Zod validation schemas
 * @module challenges
 */

import {
  JourneyPartSchema,
  ChallengeStepSchema,
  ChallengeDefinitionSchema,
  type JourneyPart,
  type ChallengeStep,
  type ChallengeDefinition,
} from './types';

describe('JourneyPartSchema', () => {
  it('should accept valid journey parts', () => {
    expect(JourneyPartSchema.parse('clarity')).toBe('clarity');
    expect(JourneyPartSchema.parse('systems')).toBe('systems');
    expect(JourneyPartSchema.parse('capacity')).toBe('capacity');
  });

  it('should reject invalid journey parts', () => {
    expect(() => JourneyPartSchema.parse('invalid')).toThrow();
    expect(() => JourneyPartSchema.parse('')).toThrow();
    expect(() => JourneyPartSchema.parse(123)).toThrow();
  });
});

describe('ChallengeStepSchema', () => {
  it('should accept valid step with content only', () => {
    const step = { content: 'Do this thing' };
    const result = ChallengeStepSchema.parse(step);
    expect(result.content).toBe('Do this thing');
    expect(result.title).toBeUndefined();
  });

  it('should accept valid step with title and content', () => {
    const step = { title: 'Step 1', content: 'Do this thing' };
    const result = ChallengeStepSchema.parse(step);
    expect(result.title).toBe('Step 1');
    expect(result.content).toBe('Do this thing');
  });

  it('should reject step without content', () => {
    expect(() => ChallengeStepSchema.parse({})).toThrow();
    expect(() => ChallengeStepSchema.parse({ title: 'Only title' })).toThrow();
  });

  it('should reject empty content', () => {
    expect(() => ChallengeStepSchema.parse({ content: '' })).toThrow();
  });
});

describe('ChallengeDefinitionSchema', () => {
  const validChallenge: ChallengeDefinition = {
    id: 1,
    title: 'The Values Foundation',
    description: 'Define what productivity means to you personally',
    part: 'clarity',
    partTitle: 'Clarity',
    time: '7 minutes',
    energy: 6,
    value: 8,
    whatYouGet: 'Access to your deeper reasons for becoming more productive.',
    steps: [
      { content: 'Imagine you have two more hours of leisure time every day.' },
      { content: 'What productivity goals do you have in mind?' },
      { content: 'Ask yourself: What deep-rooted values are associated?' },
    ],
  };

  it('should accept a valid challenge definition', () => {
    const result = ChallengeDefinitionSchema.parse(validChallenge);
    expect(result.id).toBe(1);
    expect(result.title).toBe('The Values Foundation');
    expect(result.part).toBe('clarity');
    expect(result.steps).toHaveLength(3);
  });

  it('should accept challenge with optional fields', () => {
    const challengeWithOptionals = {
      ...validChallenge,
      tips: ['Tip 1', 'Tip 2'],
      worksheetPrompts: ['Prompt 1'],
      relevantResearch: ['Topic 1', 'Topic 2'],
      researchInsight: 'Research shows that...',
      actionableTip: 'Do this one thing.',
      citation: 'Author, "Book Title"',
    };
    const result = ChallengeDefinitionSchema.parse(challengeWithOptionals);
    expect(result.tips).toHaveLength(2);
    expect(result.worksheetPrompts).toHaveLength(1);
    expect(result.relevantResearch).toHaveLength(2);
    expect(result.researchInsight).toBe('Research shows that...');
    expect(result.actionableTip).toBe('Do this one thing.');
    expect(result.citation).toBe('Author, "Book Title"');
  });

  it('should require id to be a positive integer', () => {
    expect(() => ChallengeDefinitionSchema.parse({ ...validChallenge, id: 0 })).toThrow();
    expect(() => ChallengeDefinitionSchema.parse({ ...validChallenge, id: -1 })).toThrow();
    expect(() => ChallengeDefinitionSchema.parse({ ...validChallenge, id: 1.5 })).toThrow();
  });

  it('should require title to be non-empty', () => {
    expect(() => ChallengeDefinitionSchema.parse({ ...validChallenge, title: '' })).toThrow();
  });

  it('should require description to be non-empty', () => {
    expect(() => ChallengeDefinitionSchema.parse({ ...validChallenge, description: '' })).toThrow();
  });

  it('should require valid journey part', () => {
    expect(() => ChallengeDefinitionSchema.parse({ ...validChallenge, part: 'invalid' })).toThrow();
  });

  it('should require energy to be between 1 and 10', () => {
    expect(() => ChallengeDefinitionSchema.parse({ ...validChallenge, energy: 0 })).toThrow();
    expect(() => ChallengeDefinitionSchema.parse({ ...validChallenge, energy: 11 })).toThrow();
    expect(ChallengeDefinitionSchema.parse({ ...validChallenge, energy: 1 }).energy).toBe(1);
    expect(ChallengeDefinitionSchema.parse({ ...validChallenge, energy: 10 }).energy).toBe(10);
  });

  it('should require value to be between 1 and 10', () => {
    expect(() => ChallengeDefinitionSchema.parse({ ...validChallenge, value: 0 })).toThrow();
    expect(() => ChallengeDefinitionSchema.parse({ ...validChallenge, value: 11 })).toThrow();
    expect(ChallengeDefinitionSchema.parse({ ...validChallenge, value: 1 }).value).toBe(1);
    expect(ChallengeDefinitionSchema.parse({ ...validChallenge, value: 10 }).value).toBe(10);
  });

  it('should require at least one step', () => {
    expect(() => ChallengeDefinitionSchema.parse({ ...validChallenge, steps: [] })).toThrow();
  });

  it('should validate nested step objects', () => {
    const badSteps = { ...validChallenge, steps: [{ content: '' }] };
    expect(() => ChallengeDefinitionSchema.parse(badSteps)).toThrow();
  });
});

describe('Type exports', () => {
  it('should export JourneyPart type', () => {
    const part: JourneyPart = 'clarity';
    expect(part).toBe('clarity');
  });

  it('should export ChallengeStep type', () => {
    const step: ChallengeStep = { content: 'Do something' };
    expect(step.content).toBe('Do something');
  });

  it('should export ChallengeDefinition type', () => {
    const challenge: ChallengeDefinition = {
      id: 1,
      title: 'Test',
      description: 'Test description',
      part: 'clarity',
      partTitle: 'Clarity',
      time: '5 minutes',
      energy: 5,
      value: 5,
      whatYouGet: 'Something good',
      steps: [{ content: 'Step 1' }],
    };
    expect(challenge.id).toBe(1);
  });
});
