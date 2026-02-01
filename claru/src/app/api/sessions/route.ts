import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  type SessionFlow,
  type SessionState,
  type CoachingSession,
  validateSessionTransition,
  InvalidTransitionError,
  TurnLimitExceeded,
  TURN_LIMITS,
} from '@/modules/coaching/types';

/**
 * Coaching Sessions API - F007
 *
 * Per state-machines.mdc: ALWAYS use state machine validation.
 *
 * POST: Create or get active session
 * PATCH: Transition session state
 * GET: Get active session for user
 */

/**
 * GET /api/sessions
 * Returns the active session for the current user, or null.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active session (created, in_progress, or plan_confirmed)
    const { data, error } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('user_id', user.id)
      .in('state', ['created', 'in_progress', 'plan_confirmed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch session:', error);
      return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Sessions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/sessions
 * Creates a new session or returns existing active session.
 * Body: { flow: 'morning' | 'evening' }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const flow = body.flow as SessionFlow;

    if (!flow || !['morning', 'evening'].includes(flow)) {
      return NextResponse.json(
        { error: 'Invalid flow. Must be "morning" or "evening"' },
        { status: 400 }
      );
    }

    // Check for existing active session
    const { data: existing } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('user_id', user.id)
      .in('state', ['created', 'in_progress', 'plan_confirmed'])
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        data: existing,
        message: 'Existing active session returned',
      });
    }

    // Create new session
    const { data, error } = await supabase
      .from('coaching_sessions')
      .insert({
        user_id: user.id,
        flow,
        state: 'created',
        turn_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Sessions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/sessions
 * Transitions session state using state machine validation.
 * Body: { sessionId: string, toState: SessionState, incrementTurn?: boolean }
 *
 * Per state-machines.mdc: NEVER do direct state updates without validation.
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, toState, incrementTurn } = body as {
      sessionId: string;
      toState: SessionState;
      incrementTurn?: boolean;
    };

    if (!sessionId || !toState) {
      return NextResponse.json(
        { error: 'sessionId and toState are required' },
        { status: 400 }
      );
    }

    // Fetch current session
    const { data: session, error: fetchError } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id) // Defense in depth per supabase.mdc
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Convert to CoachingSession type for validation
    const currentSession: CoachingSession = {
      id: session.id,
      userId: session.user_id,
      flow: session.flow as SessionFlow,
      state: session.state as SessionState,
      turnCount: session.turn_count,
      startedAt: new Date(session.started_at),
      completedAt: session.completed_at ? new Date(session.completed_at) : undefined,
    };

    // Validate transition using state machine
    try {
      validateSessionTransition(currentSession, toState);
    } catch (err) {
      if (err instanceof InvalidTransitionError) {
        return NextResponse.json(
          { error: err.message, code: 'INVALID_TRANSITION' },
          { status: 400 }
        );
      }
      if (err instanceof TurnLimitExceeded) {
        return NextResponse.json(
          {
            error: err.message,
            code: 'TURN_LIMIT_EXCEEDED',
            limit: TURN_LIMITS[currentSession.flow],
          },
          { status: 400 }
        );
      }
      throw err;
    }

    // Build update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      state: toState,
      last_activity_at: new Date().toISOString(),
    };

    if (incrementTurn) {
      updates.turn_count = session.turn_count + 1;
    }

    if (toState === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    // Perform the update
    const { data: updated, error: updateError } = await supabase
      .from('coaching_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update session:', updateError);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Sessions PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
