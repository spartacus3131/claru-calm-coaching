-- Migration: Create user_challenges table
-- Feature: F017 - Challenge State Machine
-- Description: Track user progress through challenges with state machine lifecycle

-- Create enum for challenge status
CREATE TYPE challenge_status AS ENUM (
  'available',
  'offered',
  'declined',
  'active',
  'data_collected',
  'analyzed',
  'completed'
);

-- Create user_challenges table
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL CHECK (challenge_id >= 1 AND challenge_id <= 22),
  status challenge_status NOT NULL DEFAULT 'available',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Each user can only have one instance of each challenge
  UNIQUE(user_id, challenge_id)
);

-- Create index for common queries
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);
CREATE INDEX idx_user_challenges_user_status ON user_challenges(user_id, status);

-- Enable RLS
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own challenges
CREATE POLICY "Users can view own challenges"
  ON user_challenges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON user_challenges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON user_challenges
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own challenges"
  ON user_challenges
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_user_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_challenges_updated_at
  BEFORE UPDATE ON user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_user_challenges_updated_at();

-- Comment on table
COMMENT ON TABLE user_challenges IS 'Tracks user progress through the 22 productivity challenges';
COMMENT ON COLUMN user_challenges.challenge_id IS 'References challenge definition (1-22)';
COMMENT ON COLUMN user_challenges.status IS 'State machine: available → offered → active → data_collected → analyzed → completed';
COMMENT ON COLUMN user_challenges.data IS 'Challenge-specific data (e.g., energy logs for BPT challenge)';
