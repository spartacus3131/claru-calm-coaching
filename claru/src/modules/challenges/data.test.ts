/**
 * @file data.test.ts
 * @description Tests for the 22 challenge definitions
 * @module challenges
 */

import {
  CHALLENGES,
  PART_INFO,
  getChallengeById,
  getChallengesByPart,
} from './data';
import { ChallengeDefinitionSchema } from './types';

describe('CHALLENGES data', () => {
  it('should have exactly 22 challenges', () => {
    expect(CHALLENGES).toHaveLength(22);
  });

  it('should have unique IDs from 1 to 22', () => {
    const ids = CHALLENGES.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(22);
    for (let i = 1; i <= 22; i++) {
      expect(uniqueIds.has(i)).toBe(true);
    }
  });

  it('should have all challenges validate against the schema', () => {
    for (const challenge of CHALLENGES) {
      const result = ChallengeDefinitionSchema.safeParse(challenge);
      if (!result.success) {
        console.error(`Challenge ${challenge.id} failed validation:`, result.error.flatten());
      }
      expect(result.success).toBe(true);
    }
  });

  it('should have challenges ordered by ID', () => {
    for (let i = 0; i < CHALLENGES.length - 1; i++) {
      expect(CHALLENGES[i].id).toBeLessThan(CHALLENGES[i + 1].id);
    }
  });

  describe('Clarity part (1-7)', () => {
    it('should have 7 challenges in clarity part', () => {
      const clarityChallenges = CHALLENGES.filter(c => c.part === 'clarity');
      expect(clarityChallenges).toHaveLength(7);
    });

    it('should include challenges 1-7', () => {
      const clarityChallenges = CHALLENGES.filter(c => c.part === 'clarity');
      const ids = clarityChallenges.map(c => c.id).sort((a, b) => a - b);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe('Systems part (8-15)', () => {
    it('should have 8 challenges in systems part', () => {
      const systemsChallenges = CHALLENGES.filter(c => c.part === 'systems');
      expect(systemsChallenges).toHaveLength(8);
    });

    it('should include challenges 8-15', () => {
      const systemsChallenges = CHALLENGES.filter(c => c.part === 'systems');
      const ids = systemsChallenges.map(c => c.id).sort((a, b) => a - b);
      expect(ids).toEqual([8, 9, 10, 11, 12, 13, 14, 15]);
    });
  });

  describe('Capacity part (16-22)', () => {
    it('should have 7 challenges in capacity part', () => {
      const capacityChallenges = CHALLENGES.filter(c => c.part === 'capacity');
      expect(capacityChallenges).toHaveLength(7);
    });

    it('should include challenges 16-22', () => {
      const capacityChallenges = CHALLENGES.filter(c => c.part === 'capacity');
      const ids = capacityChallenges.map(c => c.id).sort((a, b) => a - b);
      expect(ids).toEqual([16, 17, 18, 19, 20, 21, 22]);
    });
  });
});

describe('PART_INFO', () => {
  it('should have info for all three parts', () => {
    expect(PART_INFO).toHaveProperty('clarity');
    expect(PART_INFO).toHaveProperty('systems');
    expect(PART_INFO).toHaveProperty('capacity');
  });

  it('should have correct order for parts', () => {
    expect(PART_INFO.clarity.order).toBe(1);
    expect(PART_INFO.systems.order).toBe(2);
    expect(PART_INFO.capacity.order).toBe(3);
  });

  it('should have non-empty titles and descriptions', () => {
    for (const [part, info] of Object.entries(PART_INFO)) {
      expect(info.title.length).toBeGreaterThan(0);
      expect(info.description.length).toBeGreaterThan(0);
    }
  });
});

describe('getChallengeById', () => {
  it('should return challenge for valid ID', () => {
    const challenge = getChallengeById(1);
    expect(challenge).toBeDefined();
    expect(challenge?.id).toBe(1);
    expect(challenge?.title).toBe('The Values Foundation');
  });

  it('should return undefined for invalid ID', () => {
    expect(getChallengeById(0)).toBeUndefined();
    expect(getChallengeById(23)).toBeUndefined();
    expect(getChallengeById(-1)).toBeUndefined();
  });

  it('should return all 22 challenges when queried by ID', () => {
    for (let i = 1; i <= 22; i++) {
      const challenge = getChallengeById(i);
      expect(challenge).toBeDefined();
      expect(challenge?.id).toBe(i);
    }
  });
});

describe('getChallengesByPart', () => {
  it('should return challenges grouped by part', () => {
    const grouped = getChallengesByPart();
    expect(grouped.clarity).toHaveLength(7);
    expect(grouped.systems).toHaveLength(8);
    expect(grouped.capacity).toHaveLength(7);
  });

  it('should maintain challenge order within each part', () => {
    const grouped = getChallengesByPart();
    
    // Clarity should be 1-7
    const clarityIds = grouped.clarity.map(c => c.id);
    expect(clarityIds).toEqual([1, 2, 3, 4, 5, 6, 7]);
    
    // Systems should be 8-15
    const systemsIds = grouped.systems.map(c => c.id);
    expect(systemsIds).toEqual([8, 9, 10, 11, 12, 13, 14, 15]);
    
    // Capacity should be 16-22
    const capacityIds = grouped.capacity.map(c => c.id);
    expect(capacityIds).toEqual([16, 17, 18, 19, 20, 21, 22]);
  });

  it('should return all 22 challenges total', () => {
    const grouped = getChallengesByPart();
    const total = grouped.clarity.length + grouped.systems.length + grouped.capacity.length;
    expect(total).toBe(22);
  });
});

describe('Challenge content quality', () => {
  it('should have at least 3 steps per challenge', () => {
    for (const challenge of CHALLENGES) {
      expect(challenge.steps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('should have non-empty whatYouGet for all challenges', () => {
    for (const challenge of CHALLENGES) {
      expect(challenge.whatYouGet.length).toBeGreaterThan(10);
    }
  });

  it('should have consistent partTitle matching part', () => {
    for (const challenge of CHALLENGES) {
      if (challenge.part === 'clarity') {
        expect(challenge.partTitle).toBe('Clarity');
      } else if (challenge.part === 'systems') {
        expect(challenge.partTitle).toBe('Systems');
      } else if (challenge.part === 'capacity') {
        expect(challenge.partTitle).toBe('Capacity');
      }
    }
  });

  it('should have tips for most challenges', () => {
    const challengesWithTips = CHALLENGES.filter(c => c.tips && c.tips.length > 0);
    expect(challengesWithTips.length).toBeGreaterThanOrEqual(20);
  });

  it('should not contain em-dashes (per voice guidelines)', () => {
    for (const challenge of CHALLENGES) {
      const allText = [
        challenge.title,
        challenge.description,
        challenge.whatYouGet,
        ...(challenge.tips || []),
        ...challenge.steps.map(s => s.content),
        challenge.researchInsight || '',
        challenge.actionableTip || '',
      ].join(' ');
      
      expect(allText).not.toContain('—');
    }
  });
});
