/**
 * @file challengeNudges.test.ts
 * @description Tests for F020 Challenge Nudges
 * @module coaching
 *
 * Per 001-tdd.mdc: Write tests first that define expected behavior.
 */

import {
  formatActiveChallengeForPrompt,
  getNudgeForChallenge,
  getChallengeNudgeInstructions,
} from './challengeNudges';
import type { ChallengeDefinition } from '@/modules/challenges/types';

// Sample challenge for testing
const SAMPLE_CHALLENGE: ChallengeDefinition = {
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
    { content: 'Step 1 content' },
    { content: 'Step 2 content' },
    { content: 'Step 3 content' },
  ],
  tips: ['Tip 1', 'Tip 2'],
};

describe('challengeNudges', () => {
  describe('formatActiveChallengeForPrompt', () => {
    it('formats challenge with basic info', () => {
      const result = formatActiveChallengeForPrompt({
        challenge: SAMPLE_CHALLENGE,
        daysSinceStarted: 2,
      });

      expect(result).toContain('The Values Foundation');
      expect(result).toContain('Define what productivity means to you personally');
      // daysSinceStarted: 2 means they started 2 days ago = Day 3
      expect(result).toContain('Day 3 of this foundation');
    });

    it('shows day 1 correctly', () => {
      const result = formatActiveChallengeForPrompt({
        challenge: SAMPLE_CHALLENGE,
        daysSinceStarted: 0,
      });

      expect(result).toContain('Day 1 of this foundation');
    });

    it('includes the journey part', () => {
      const result = formatActiveChallengeForPrompt({
        challenge: SAMPLE_CHALLENGE,
        daysSinceStarted: 3,
      });

      expect(result).toContain('Clarity');
    });
  });

  describe('getNudgeForChallenge', () => {
    it('returns morning nudge for morning flow', () => {
      const result = getNudgeForChallenge({
        challenge: SAMPLE_CHALLENGE,
        flow: 'morning',
      });

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(20);
    });

    it('returns evening nudge for evening flow', () => {
      const result = getNudgeForChallenge({
        challenge: SAMPLE_CHALLENGE,
        flow: 'evening',
      });

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(20);
    });

    it('returns generic nudge for adhoc flow', () => {
      const result = getNudgeForChallenge({
        challenge: SAMPLE_CHALLENGE,
        flow: 'adhoc',
      });

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('includes challenge title in nudge', () => {
      const result = getNudgeForChallenge({
        challenge: SAMPLE_CHALLENGE,
        flow: 'morning',
      });

      expect(result).toContain('Values');
    });

    it('produces different nudges for different challenges', () => {
      const challenge2: ChallengeDefinition = {
        ...SAMPLE_CHALLENGE,
        id: 4,
        title: 'The Prime-Time Foundation',
        description: 'Discover your biological peak hours',
      };

      const nudge1 = getNudgeForChallenge({
        challenge: SAMPLE_CHALLENGE,
        flow: 'morning',
      });

      const nudge2 = getNudgeForChallenge({
        challenge: challenge2,
        flow: 'morning',
      });

      expect(nudge1).not.toBe(nudge2);
    });
  });

  describe('getChallengeNudgeInstructions', () => {
    it('returns instructions with the challenge title', () => {
      const result = getChallengeNudgeInstructions({
        challenge: SAMPLE_CHALLENGE,
        flow: 'morning',
        daysSinceStarted: 2,
      });

      expect(result).toContain('The Values Foundation');
    });

    it('includes morning-specific instructions for morning flow', () => {
      const result = getChallengeNudgeInstructions({
        challenge: SAMPLE_CHALLENGE,
        flow: 'morning',
        daysSinceStarted: 1,
      });

      expect(result).toContain('Top 3');
    });

    it('includes evening-specific instructions for evening flow', () => {
      const result = getChallengeNudgeInstructions({
        challenge: SAMPLE_CHALLENGE,
        flow: 'evening',
        daysSinceStarted: 1,
      });

      expect(result).toContain('reflect');
    });

    it('tells AI not to force the nudge', () => {
      const result = getChallengeNudgeInstructions({
        challenge: SAMPLE_CHALLENGE,
        flow: 'morning',
        daysSinceStarted: 1,
      });

      // Should encourage natural integration, not forced
      expect(result.toLowerCase()).toMatch(/natural|don't force|if relevant|organically/);
    });

    it('handles new challenges differently (day 1)', () => {
      const result = getChallengeNudgeInstructions({
        challenge: SAMPLE_CHALLENGE,
        flow: 'morning',
        daysSinceStarted: 0,
      });

      // Day 1 should mention it's new/just started
      expect(result.toLowerCase()).toMatch(/started|just|new|first/);
    });

    it('handles ongoing challenges (day 3+)', () => {
      const result = getChallengeNudgeInstructions({
        challenge: SAMPLE_CHALLENGE,
        flow: 'morning',
        daysSinceStarted: 5,
      });

      // daysSinceStarted: 5 means they started 5 days ago = Day 6
      expect(result).toContain('Day 6');
    });
  });
});
