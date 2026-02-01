import {
  type Message,
  type CoachingSession,
  type SessionFlow,
  type SessionState,
  createMessage,
  createSession,
  isValidSessionState,
  canTransitionTo,
  validateSessionTransition,
  InvalidTransitionError,
  TurnLimitExceeded,
  TURN_LIMITS,
} from './types';

describe('Coaching Engine - Types', () => {
  describe('Message', () => {
    it('creates a user message with required fields', () => {
      const message = createMessage({
        role: 'user',
        content: 'Hello, Claru!',
      });

      expect(message.role).toBe('user');
      expect(message.content).toBe('Hello, Claru!');
      expect(message.id).toBeDefined();
      expect(message.createdAt).toBeInstanceOf(Date);
    });

    it('creates an assistant message with required fields', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Good morning! What is on your mind today?',
      });

      expect(message.role).toBe('assistant');
      expect(message.content).toBe('Good morning! What is on your mind today?');
    });
  });

  describe('SessionState', () => {
    it('validates created state', () => {
      expect(isValidSessionState('created')).toBe(true);
    });

    it('validates in_progress state', () => {
      expect(isValidSessionState('in_progress')).toBe(true);
    });

    it('validates plan_confirmed state', () => {
      expect(isValidSessionState('plan_confirmed')).toBe(true);
    });

    it('validates completed state', () => {
      expect(isValidSessionState('completed')).toBe(true);
    });

    it('validates abandoned state', () => {
      expect(isValidSessionState('abandoned')).toBe(true);
    });

    it('rejects invalid state', () => {
      expect(isValidSessionState('invalid')).toBe(false);
    });
  });

  describe('State Transitions (per state-machines.mdc)', () => {
    it('allows created → in_progress', () => {
      expect(canTransitionTo('created', 'in_progress')).toBe(true);
    });

    it('allows in_progress → in_progress (more turns)', () => {
      expect(canTransitionTo('in_progress', 'in_progress')).toBe(true);
    });

    it('allows in_progress → plan_confirmed', () => {
      expect(canTransitionTo('in_progress', 'plan_confirmed')).toBe(true);
    });

    it('allows in_progress → abandoned (timeout)', () => {
      expect(canTransitionTo('in_progress', 'abandoned')).toBe(true);
    });

    it('allows plan_confirmed → completed', () => {
      expect(canTransitionTo('plan_confirmed', 'completed')).toBe(true);
    });

    it('does not allow created → plan_confirmed (must go through in_progress)', () => {
      expect(canTransitionTo('created', 'plan_confirmed')).toBe(false);
    });

    it('does not allow created → completed (must go through states)', () => {
      expect(canTransitionTo('created', 'completed')).toBe(false);
    });

    it('does not allow in_progress → completed (must confirm plan first)', () => {
      expect(canTransitionTo('in_progress', 'completed')).toBe(false);
    });

    it('does not allow completed → anything (terminal state)', () => {
      expect(canTransitionTo('completed', 'in_progress')).toBe(false);
      expect(canTransitionTo('completed', 'created')).toBe(false);
    });

    it('does not allow abandoned → anything (terminal state)', () => {
      expect(canTransitionTo('abandoned', 'in_progress')).toBe(false);
    });
  });

  describe('createSession', () => {
    it('creates a morning session with initial state', () => {
      const session = createSession({ userId: 'user-1', flow: 'morning' });

      expect(session.userId).toBe('user-1');
      expect(session.flow).toBe('morning');
      expect(session.state).toBe('created');
      expect(session.turnCount).toBe(0);
      expect(session.id).toBeDefined();
      expect(session.startedAt).toBeInstanceOf(Date);
    });

    it('creates an evening session', () => {
      const session = createSession({ userId: 'user-1', flow: 'evening' });

      expect(session.flow).toBe('evening');
      expect(session.state).toBe('created');
    });
  });

  describe('validateSessionTransition', () => {
    it('allows valid transition: created → in_progress', () => {
      const session = createSession({ userId: 'user-1', flow: 'morning' });

      expect(() => validateSessionTransition(session, 'in_progress')).not.toThrow();
    });

    it('throws InvalidTransitionError for invalid transition', () => {
      const session = createSession({ userId: 'user-1', flow: 'morning' });

      expect(() => validateSessionTransition(session, 'completed')).toThrow(InvalidTransitionError);
    });

    it('allows in_progress → in_progress when under turn limit', () => {
      const session: CoachingSession = {
        ...createSession({ userId: 'user-1', flow: 'morning' }),
        state: 'in_progress',
        turnCount: 5,
      };

      expect(() => validateSessionTransition(session, 'in_progress')).not.toThrow();
    });

    it('throws TurnLimitExceeded when turn limit reached', () => {
      const session: CoachingSession = {
        ...createSession({ userId: 'user-1', flow: 'morning' }),
        state: 'in_progress',
        turnCount: TURN_LIMITS.morning, // At limit
      };

      expect(() => validateSessionTransition(session, 'in_progress')).toThrow(TurnLimitExceeded);
    });

    it('throws TurnLimitExceeded for evening flow at its limit', () => {
      const session: CoachingSession = {
        ...createSession({ userId: 'user-1', flow: 'evening' }),
        state: 'in_progress',
        turnCount: TURN_LIMITS.evening, // At limit (10)
      };

      expect(() => validateSessionTransition(session, 'in_progress')).toThrow(TurnLimitExceeded);
    });

    it('allows plan_confirmed transition even at turn limit', () => {
      const session: CoachingSession = {
        ...createSession({ userId: 'user-1', flow: 'morning' }),
        state: 'in_progress',
        turnCount: TURN_LIMITS.morning,
      };

      // Can still confirm plan even at turn limit
      expect(() => validateSessionTransition(session, 'plan_confirmed')).not.toThrow();
    });
  });
});
