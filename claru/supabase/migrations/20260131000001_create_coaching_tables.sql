-- ============================================
-- F003: Morning Check-In Chat - Coaching Tables
-- ============================================
-- Creates coaching_sessions and conversation_turns tables.
--
-- Per coaching-engine-canvas:
-- - One active session per user
-- - Session states: created → in_progress → completed/abandoned
-- - Turn limits: 15 for morning, 10 for evening

-- Create enum for session flow
CREATE TYPE session_flow AS ENUM ('morning', 'evening');

-- Create enum for session state
CREATE TYPE session_state AS ENUM ('created', 'in_progress', 'completed', 'abandoned');

-- Create coaching_sessions table
CREATE TABLE coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flow session_flow NOT NULL,
  state session_state NOT NULL DEFAULT 'created',
  turn_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (per supabase.mdc: EVERY table MUST have RLS enabled)
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own sessions
CREATE POLICY "Users can access own sessions" ON coaching_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- Create conversation_turns table
CREATE TABLE conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  user_input TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE conversation_turns ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access turns for their own sessions
-- Per supabase.mdc: Join to parent table for ownership check
CREATE POLICY "Users can access own turns" ON conversation_turns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coaching_sessions
      WHERE id = conversation_turns.session_id
      AND user_id = auth.uid()
    )
  );

-- Indexes for common queries
CREATE INDEX idx_coaching_sessions_user_id ON coaching_sessions(user_id);
CREATE INDEX idx_coaching_sessions_user_state ON coaching_sessions(user_id, state);
CREATE INDEX idx_conversation_turns_session_id ON conversation_turns(session_id);

-- Trigger: Update updated_at on session changes
CREATE TRIGGER update_coaching_sessions_updated_at
  BEFORE UPDATE ON coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Constraint: Only one active session per user
-- A session is "active" if state is 'created' or 'in_progress'
CREATE UNIQUE INDEX idx_one_active_session_per_user 
  ON coaching_sessions(user_id) 
  WHERE state IN ('created', 'in_progress');
