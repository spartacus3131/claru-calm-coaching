/**
 * @file challengeIntroPrompts.test.ts
 * @description Tests for F019 - Challenge Introduction Flow prompts
 * @module coaching
 *
 * Per 001-tdd.mdc: Write tests first (RED), then implement (GREEN).
 */

import {
  buildChallengeIntroPrompt,
  formatChallengeForPrompt,
  getChallengeIntroGreeting,
  type ChallengeIntroContext,
} from './challengeIntroPrompts';

describe('formatChallengeForPrompt', () => {
  const challenge = {
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
      { content: 'Step 1: Imagine you have two more hours of leisure time.' },
      { content: 'Step 2: What productivity goals do you have in mind?' },
      { content: 'Step 3: What deep-rooted values are associated with your goals?' },
    ],
    tips: [
      'Fill in the blank: "I deeply care about this because ____."',
      'Deathbed test: Would I regret doing more or less of this?',
    ],
    researchInsight: 'Research shows that intrinsic motivation leads to greater persistence.',
    actionableTip: 'Use the Values → Goals → Intention → Action framework.',
    citation: 'Self-Determination Theory (Deci & Ryan)',
  };

  it('formats challenge with all fields', () => {
    const formatted = formatChallengeForPrompt(challenge);

    expect(formatted).toContain('The Values Foundation');
    expect(formatted).toContain('Define what productivity means to you personally');
    expect(formatted).toContain('7 minutes');
    expect(formatted).toContain('Energy: 6/10');
    expect(formatted).toContain('Value: 8/10');
    expect(formatted).toContain('Step 1');
    expect(formatted).toContain('Step 2');
    expect(formatted).toContain('Step 3');
    expect(formatted).toContain('Tips:');
    expect(formatted).toContain('Research Insight:');
    expect(formatted).toContain('Self-Determination Theory');
  });

  it('formats challenge without optional fields', () => {
    const minimalChallenge = {
      id: 2,
      title: 'The Impact Foundation',
      description: 'Identify your highest-impact tasks',
      part: 'clarity',
      partTitle: 'Clarity',
      time: '10 minutes',
      energy: 8,
      value: 10,
      whatYouGet: 'You will discover the highest-impact tasks.',
      steps: [{ content: 'Make a list of everything.' }],
    };

    const formatted = formatChallengeForPrompt(minimalChallenge);

    expect(formatted).toContain('The Impact Foundation');
    expect(formatted).toContain('Make a list of everything');
    expect(formatted).not.toContain('Tips:');
    expect(formatted).not.toContain('Research Insight:');
  });
});

describe('getChallengeIntroGreeting', () => {
  it('returns greeting for first challenge', () => {
    const greeting = getChallengeIntroGreeting({
      challengeTitle: 'The Values Foundation',
      challengeNumber: 1,
      isFirstChallenge: true,
    });

    expect(greeting).toContain('Values Foundation');
    expect(greeting).toContain('first');
  });

  it('returns greeting for subsequent challenges', () => {
    const greeting = getChallengeIntroGreeting({
      challengeTitle: 'The Impact Foundation',
      challengeNumber: 2,
      isFirstChallenge: false,
    });

    expect(greeting).toContain('Impact Foundation');
    expect(greeting).not.toContain('first');
  });

  it('does not use em dashes', () => {
    const greeting = getChallengeIntroGreeting({
      challengeTitle: 'Test Challenge',
      challengeNumber: 1,
      isFirstChallenge: true,
    });

    expect(greeting).not.toContain('—');
  });
});

describe('buildChallengeIntroPrompt', () => {
  const challenge = {
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
      { content: 'Imagine you have two more hours of leisure time.' },
      { content: 'What productivity goals do you have in mind?' },
      { content: 'What deep-rooted values are associated with your goals?' },
    ],
    tips: ['Fill in the blank: "I deeply care about this because ____."'],
    researchInsight: 'Research shows that intrinsic motivation leads to persistence.',
    actionableTip: 'Use the Values framework.',
    citation: 'Self-Determination Theory',
  };

  const baseContext: ChallengeIntroContext = {
    userName: 'Alex',
    challenge,
    isFirstChallenge: true,
  };

  it('includes user name', () => {
    const prompt = buildChallengeIntroPrompt(baseContext);
    expect(prompt).toContain('Alex');
  });

  it('includes challenge details', () => {
    const prompt = buildChallengeIntroPrompt(baseContext);
    expect(prompt).toContain('The Values Foundation');
    expect(prompt).toContain('7 minutes');
  });

  it('includes Claru persona', () => {
    const prompt = buildChallengeIntroPrompt(baseContext);
    expect(prompt).toContain('Direct and efficient');
    expect(prompt).toContain('Non-judgmental');
  });

  it('includes introduction flow instructions', () => {
    const prompt = buildChallengeIntroPrompt(baseContext);
    expect(prompt).toContain('CHALLENGE INTRODUCTION');
    expect(prompt).toContain('Step 1');
  });

  it('includes guardrails', () => {
    const prompt = buildChallengeIntroPrompt(baseContext);
    expect(prompt).toContain('NEVER');
  });

  it('marks first challenge context appropriately', () => {
    const prompt = buildChallengeIntroPrompt(baseContext);
    expect(prompt).toContain('first foundation');
  });

  it('marks subsequent challenge context appropriately', () => {
    const context = { ...baseContext, isFirstChallenge: false };
    const prompt = buildChallengeIntroPrompt(context);
    expect(prompt).not.toContain('first foundation');
  });

  it('does not use em dashes anywhere', () => {
    const prompt = buildChallengeIntroPrompt(baseContext);
    expect(prompt).not.toContain('—');
  });
});
