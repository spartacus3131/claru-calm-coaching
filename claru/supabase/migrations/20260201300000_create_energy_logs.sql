-- Migration: Create energy_logs table
-- Feature: F024 - Energy Logging
-- Description: Store hourly energy level logs for BPT discovery and engagement tracking

-- Create energy_logs table
CREATE TABLE IF NOT EXISTS energy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Energy log data
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 10),
  activity TEXT,
  procrastination_minutes INTEGER CHECK (procrastination_minutes >= 0 AND procrastination_minutes <= 60),
  
  -- Optional link to challenge for tracking context
  challenge_id INTEGER CHECK (challenge_id >= 1 AND challenge_id <= 22),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_energy_logs_user_id ON energy_logs(user_id);
CREATE INDEX idx_energy_logs_logged_at ON energy_logs(logged_at);
CREATE INDEX idx_energy_logs_user_logged_at ON energy_logs(user_id, logged_at DESC);
CREATE INDEX idx_energy_logs_user_hour ON energy_logs(user_id, hour);

-- Enable RLS
ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own energy logs
CREATE POLICY "Users can view own energy logs"
  ON energy_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own energy logs"
  ON energy_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own energy logs"
  ON energy_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own energy logs"
  ON energy_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_energy_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER energy_logs_updated_at
  BEFORE UPDATE ON energy_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_energy_logs_updated_at();

-- Comments
COMMENT ON TABLE energy_logs IS 'Hourly energy level logs for BPT discovery (F024)';
COMMENT ON COLUMN energy_logs.hour IS 'Hour of day (0-23) when energy was logged';
COMMENT ON COLUMN energy_logs.energy_level IS 'Self-reported energy level (1-10)';
COMMENT ON COLUMN energy_logs.activity IS 'What the user was doing at this time';
COMMENT ON COLUMN energy_logs.procrastination_minutes IS 'Minutes spent procrastinating in this hour';
COMMENT ON COLUMN energy_logs.challenge_id IS 'Optional: links log to Prime Time Foundation (C4)';
