/**
 * Coaching Engine Types - F003 Morning Check-In Chat
 *
 * Core type definitions for the coaching conversation system.
 * Based on claru-coaching-engine-canvas.md.
 */

/**
 * Message role - who sent the message.
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * A single message in the conversation.
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

/**
 * Input for creating a new message.
 */
export interface CreateMessageInput {
  role: MessageRole;
  content: string;
}

/**
 * Creates a new message with generated id and timestamp.
 */
export function createMessage(input: CreateMessageInput): Message {
  return {
    id: crypto.randomUUID(),
    role: input.role,
    content: input.content,
    createdAt: new Date(),
  };
}

/**
 * Session flow type.
 * - morning: Morning check-in (7 phases, 15 turn limit)
 * - evening: Evening reflection (5 phases, 10 turn limit)
 * - adhoc: Ad-hoc coaching conversation (10 turn limit)
 * - challenge_intro: Challenge introduction (guide through starting a challenge)
 */
export type SessionFlow = 'morning' | 'evening' | 'adhoc' | 'challenge_intro';

/**
 * Session state machine states.
 * Per state-machines.mdc:
 * - created → in_progress → plan_confirmed → completed
 * - in_progress → abandoned (timeout)
 */
export type SessionState = 'created' | 'in_progress' | 'plan_confirmed' | 'completed' | 'abandoned';

/**
 * Valid session states.
 */
const VALID_STATES: SessionState[] = ['created', 'in_progress', 'plan_confirmed', 'completed', 'abandoned'];

/**
 * Allowed state transitions per state-machines.mdc.
 */
const STATE_TRANSITIONS: Record<SessionState, SessionState[]> = {
  created: ['in_progress'],
  in_progress: ['in_progress', 'plan_confirmed', 'abandoned'], // Can stay in_progress for more turns
  plan_confirmed: ['completed'],
  completed: [], // terminal state
  abandoned: [], // terminal state
};

/**
 * Checks if a string is a valid session state.
 */
export function isValidSessionState(state: string): state is SessionState {
  return VALID_STATES.includes(state as SessionState);
}

/**
 * Checks if a state transition is allowed.
 */
export function canTransitionTo(from: SessionState, to: SessionState): boolean {
  return STATE_TRANSITIONS[from].includes(to);
}

/**
 * Coaching session entity.
 */
export interface CoachingSession {
  id: string;
  userId: string;
  flow: SessionFlow;
  state: SessionState;
  turnCount: number;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Turn limits per flow type.
 * Per coaching-engine-canvas: 15 for morning, 10 for evening.
 * Adhoc has 10 turns for general coaching conversations.
 * Challenge intro has 15 turns to guide through all steps.
 */
export const TURN_LIMITS: Record<SessionFlow, number> = {
  morning: 15,
  evening: 10,
  adhoc: 10,
  challenge_intro: 15,
};

/**
 * Session timeout in milliseconds (30 minutes).
 * Per coaching-engine-canvas: Sessions auto-abandon after 30 minutes of inactivity.
 */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Error: Invalid state transition attempted.
 * Per state-machines.mdc.
 */
export class InvalidTransitionError extends Error {
  constructor(from: SessionState, to: SessionState) {
    super(`Cannot transition from ${from} to ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Error: Session exceeded turn limit.
 * Per state-machines.mdc.
 */
export class TurnLimitExceeded extends Error {
  constructor(flow: SessionFlow, limit: number) {
    super(`Session exceeded ${limit} turns for ${flow} flow`);
    this.name = 'TurnLimitExceeded';
  }
}

/**
 * Validates and performs a session state transition.
 * Per state-machines.mdc: ALWAYS use this function, never direct updates.
 *
 * @throws InvalidTransitionError if transition is not allowed
 * @throws TurnLimitExceeded if turn limit reached during in_progress → in_progress
 */
export function validateSessionTransition(
  session: CoachingSession,
  to: SessionState
): void {
  // Check if transition is allowed
  if (!canTransitionTo(session.state, to)) {
    throw new InvalidTransitionError(session.state, to);
  }

  // Guard: Check turn limit for in_progress → in_progress
  if (session.state === 'in_progress' && to === 'in_progress') {
    const limit = TURN_LIMITS[session.flow];
    if (session.turnCount >= limit) {
      throw new TurnLimitExceeded(session.flow, limit);
    }
  }
}

/**
 * Creates a new coaching session.
 */
export function createSession(input: {
  userId: string;
  flow: SessionFlow;
}): CoachingSession {
  return {
    id: crypto.randomUUID(),
    userId: input.userId,
    flow: input.flow,
    state: 'created',
    turnCount: 0,
    startedAt: new Date(),
  };
}
