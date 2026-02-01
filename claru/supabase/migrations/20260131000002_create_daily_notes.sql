-- ============================================
-- F005: Daily Note Extraction - Daily Notes Table
-- ============================================
-- Creates daily_notes table for storing extracted plan data.
--
-- Per user-context-store-canvas:
-- - One note per user per date
-- - States: created → plan_set → reflection_added → completed

-- Create enum for daily note state
CREATE TYPE daily_note_state AS ENUM ('created', 'plan_set', 'reflection_added', 'completed');

-- Create daily_notes table
CREATE TABLE daily_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  state daily_note_state NOT NULL DEFAULT 'created',
  
  -- Raw brain dump from user
  raw_dump TEXT,
  
  -- Plan data (morning check-in)
  top3 JSONB DEFAULT '[]',  -- Array of Top3Item objects
  admin_batch JSONB DEFAULT '[]',  -- Array of strings
  focus_block JSONB,  -- { start: "HH:MM", end: "HH:MM" }
  meeting_prep JSONB DEFAULT '[]',  -- Array of strings
  
  -- Reflection data (evening check-in)
  wins JSONB DEFAULT '[]',  -- Array of strings
  learnings JSONB DEFAULT '[]',  -- Array of strings
  released JSONB DEFAULT '[]',  -- Array of strings
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one note per user per date
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Enable RLS (per supabase.mdc: EVERY table MUST have RLS enabled)
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own notes
CREATE POLICY "Users can access own daily notes" ON daily_notes
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX idx_daily_notes_user_id ON daily_notes(user_id);
CREATE INDEX idx_daily_notes_user_date ON daily_notes(user_id, date DESC);
CREATE INDEX idx_daily_notes_date ON daily_notes(date DESC);

-- Trigger: Update updated_at on changes
CREATE TRIGGER update_daily_notes_updated_at
  BEFORE UPDATE ON daily_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Business rule: Cannot create notes for future dates
CREATE OR REPLACE FUNCTION check_daily_note_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot create daily note for future date';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_daily_note_date
  BEFORE INSERT OR UPDATE ON daily_notes
  FOR EACH ROW EXECUTE FUNCTION check_daily_note_date();
