/**
 * @file stateMachine.test.ts
 * @description Tests for Challenge state machine logic
 * @module challenges
 *
 * Per state-machines.mdc, the UserChallenge state machine is:
 * available → offered → active → data_collected → analyzed → completed
 *            ↘ declined (→ offered after 7 days)
 */

import {
  ChallengeStatusSchema,
  UserChallengeSchema,
  canTransition,
  getValidTransitions,
  DECLINE_COOLDOWN_DAYS,
  type ChallengeStatus,
  type UserChallenge,
} from './stateMachine';

describe('ChallengeStatusSchema', () => {
  it('should accept all valid statuses', () => {
    const validStatuses: ChallengeStatus[] = [
      'available',
      'offered',
      'declined',
      'active',
      'data_collected',
      'analyzed',
      'completed',
    ];

    for (const status of validStatuses) {
      expect(ChallengeStatusSchema.parse(status)).toBe(status);
    }
  });

  it('should reject invalid statuses', () => {
    expect(() => ChallengeStatusSchema.parse('invalid')).toThrow();
    expect(() => ChallengeStatusSchema.parse('')).toThrow();
    expect(() => ChallengeStatusSchema.parse('pending')).toThrow();
  });
});

describe('UserChallengeSchema', () => {
  const validChallenge: UserChallenge = {
    id: 'uc_123',
    user_id: 'user_456',
    challenge_id: 1,
    status: 'available',
    started_at: null,
    completed_at: null,
    declined_at: null,
    data: null,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  };

  it('should accept a valid user challenge', () => {
    const result = UserChallengeSchema.parse(validChallenge);
    expect(result.id).toBe('uc_123');
    expect(result.status).toBe('available');
  });

  it('should accept challenge with started_at for active status', () => {
    const activeChallenge = {
      ...validChallenge,
      status: 'active' as const,
      started_at: '2026-01-15T10:00:00Z',
    };
    const result = UserChallengeSchema.parse(activeChallenge);
    expect(result.started_at).toBe('2026-01-15T10:00:00Z');
  });

  it('should accept challenge with completed_at for completed status', () => {
    const completedChallenge = {
      ...validChallenge,
      status: 'completed' as const,
      started_at: '2026-01-15T10:00:00Z',
      completed_at: '2026-01-20T10:00:00Z',
    };
    const result = UserChallengeSchema.parse(completedChallenge);
    expect(result.completed_at).toBe('2026-01-20T10:00:00Z');
  });

  it('should accept challenge with declined_at for declined status', () => {
    const declinedChallenge = {
      ...validChallenge,
      status: 'declined' as const,
      declined_at: '2026-01-15T10:00:00Z',
    };
    const result = UserChallengeSchema.parse(declinedChallenge);
    expect(result.declined_at).toBe('2026-01-15T10:00:00Z');
  });

  it('should accept challenge with data object', () => {
    const challengeWithData = {
      ...validChallenge,
      status: 'data_collected' as const,
      started_at: '2026-01-15T10:00:00Z',
      data: { energy_logs: [{ time: '09:00', level: 7 }] },
    };
    const result = UserChallengeSchema.parse(challengeWithData);
    expect(result.data).toEqual({ energy_logs: [{ time: '09:00', level: 7 }] });
  });

  it('should require id and user_id', () => {
    expect(() => UserChallengeSchema.parse({ ...validChallenge, id: '' })).toThrow();
    expect(() => UserChallengeSchema.parse({ ...validChallenge, user_id: '' })).toThrow();
  });

  it('should require valid challenge_id', () => {
    expect(() => UserChallengeSchema.parse({ ...validChallenge, challenge_id: 0 })).toThrow();
    expect(() => UserChallengeSchema.parse({ ...validChallenge, challenge_id: 23 })).toThrow();
  });
});

describe('canTransition', () => {
  describe('from available', () => {
    it('should allow transition to offered', () => {
      expect(canTransition('available', 'offered')).toBe(true);
    });

    it('should not allow transition to other states', () => {
      expect(canTransition('available', 'active')).toBe(false);
      expect(canTransition('available', 'declined')).toBe(false);
      expect(canTransition('available', 'completed')).toBe(false);
    });
  });

  describe('from offered', () => {
    it('should allow transition to active', () => {
      expect(canTransition('offered', 'active')).toBe(true);
    });

    it('should allow transition to declined', () => {
      expect(canTransition('offered', 'declined')).toBe(true);
    });

    it('should not allow transition to other states', () => {
      expect(canTransition('offered', 'available')).toBe(false);
      expect(canTransition('offered', 'completed')).toBe(false);
    });
  });

  describe('from declined', () => {
    it('should allow transition to offered (after cooldown)', () => {
      expect(canTransition('declined', 'offered')).toBe(true);
    });

    it('should not allow transition to other states', () => {
      expect(canTransition('declined', 'active')).toBe(false);
      expect(canTransition('declined', 'available')).toBe(false);
    });
  });

  describe('from active', () => {
    it('should allow transition to data_collected', () => {
      expect(canTransition('active', 'data_collected')).toBe(true);
    });

    it('should not allow transition to other states', () => {
      expect(canTransition('active', 'offered')).toBe(false);
      expect(canTransition('active', 'completed')).toBe(false);
    });
  });

  describe('from data_collected', () => {
    it('should allow transition to analyzed', () => {
      expect(canTransition('data_collected', 'analyzed')).toBe(true);
    });

    it('should not allow transition to other states', () => {
      expect(canTransition('data_collected', 'active')).toBe(false);
      expect(canTransition('data_collected', 'completed')).toBe(false);
    });
  });

  describe('from analyzed', () => {
    it('should allow transition to completed', () => {
      expect(canTransition('analyzed', 'completed')).toBe(true);
    });

    it('should not allow transition to other states', () => {
      expect(canTransition('analyzed', 'active')).toBe(false);
      expect(canTransition('analyzed', 'available')).toBe(false);
    });
  });

  describe('from completed', () => {
    it('should not allow any transitions (terminal state)', () => {
      expect(canTransition('completed', 'available')).toBe(false);
      expect(canTransition('completed', 'offered')).toBe(false);
      expect(canTransition('completed', 'active')).toBe(false);
    });
  });
});

describe('getValidTransitions', () => {
  it('should return correct transitions for each state', () => {
    expect(getValidTransitions('available')).toEqual(['offered']);
    expect(getValidTransitions('offered')).toEqual(['active', 'declined']);
    expect(getValidTransitions('declined')).toEqual(['offered']);
    expect(getValidTransitions('active')).toEqual(['data_collected']);
    expect(getValidTransitions('data_collected')).toEqual(['analyzed']);
    expect(getValidTransitions('analyzed')).toEqual(['completed']);
    expect(getValidTransitions('completed')).toEqual([]);
  });
});

describe('DECLINE_COOLDOWN_DAYS', () => {
  it('should be 7 days', () => {
    expect(DECLINE_COOLDOWN_DAYS).toBe(7);
  });
});

describe('State machine business rules', () => {
  it('should have a linear happy path from available to completed', () => {
    const happyPath: ChallengeStatus[] = [
      'available',
      'offered',
      'active',
      'data_collected',
      'analyzed',
      'completed',
    ];

    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(canTransition(happyPath[i], happyPath[i + 1])).toBe(true);
    }
  });

  it('should allow decline from offered only', () => {
    const allStates: ChallengeStatus[] = [
      'available',
      'offered',
      'declined',
      'active',
      'data_collected',
      'analyzed',
      'completed',
    ];

    for (const state of allStates) {
      if (state === 'offered') {
        expect(canTransition(state, 'declined')).toBe(true);
      } else {
        expect(canTransition(state, 'declined')).toBe(false);
      }
    }
  });

  it('should allow re-offering after decline', () => {
    expect(canTransition('declined', 'offered')).toBe(true);
  });
});
