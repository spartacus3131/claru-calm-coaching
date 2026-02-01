-- ============================================
-- F001: User Authentication - Profiles Table
-- ============================================
-- Creates the user_profiles table and auto-create trigger.
--
-- F001 requirement: Profile created on signup via trigger

-- Create profiles table
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (per supabase.mdc: EVERY table MUST have RLS enabled)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own profile
CREATE POLICY "Users can access own profile" ON user_profiles
  FOR ALL
  USING (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, name)
  VALUES (new.id, new.raw_user_meta_data ->> 'name');
  RETURN new;
END;
$$;

-- Trigger: Create profile when new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at on profile changes
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for common queries
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
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
-- ============================================
-- F007: Add plan_confirmed state to session_state enum
-- ============================================
-- Per state-machines.mdc:
-- States: created → in_progress → plan_confirmed → completed
--                            ↘ abandoned

-- Add the new state to the enum
ALTER TYPE session_state ADD VALUE IF NOT EXISTS 'plan_confirmed' AFTER 'in_progress';

-- Update the unique index to include plan_confirmed as active
DROP INDEX IF EXISTS idx_one_active_session_per_user;

CREATE UNIQUE INDEX idx_one_active_session_per_user 
  ON coaching_sessions(user_id) 
  WHERE state IN ('created', 'in_progress', 'plan_confirmed');
-- F010: AI Usage Logs table for token tracking
-- Per ai-claude.mdc: ALWAYS log AI usage for cost monitoring

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4-5-20250514',
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for daily usage queries (F011: Rate Limiting)
CREATE INDEX idx_ai_usage_logs_user_daily 
  ON ai_usage_logs (user_id, created_at);

-- RLS: Users can only see their own usage
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage logs"
  ON ai_usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs"
  ON ai_usage_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE ai_usage_logs IS 'AI token usage tracking for cost monitoring and rate limiting (F010/F011)';
-- F014: Projects table
-- Per event-storming.md: "Flat list of projects, user creates and references in check-ins"
-- Per PRD: "A user-defined container for related work (e.g., 'Q1 Product Launch', 'Fitness Goals')"

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  hotspot_id TEXT,  -- Future: links to 7 life areas (Mind, Body, Emotions, Career, Finances, Relationships, Fun)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'parked', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Index for listing user's projects by status
CREATE INDEX idx_projects_user_status ON projects(user_id, status);

-- RLS: Users can only access their own projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE projects IS 'User projects - containers for related work (F014)';
COMMENT ON COLUMN projects.hotspot_id IS 'Future: links to 7 life areas from The Productivity Project';
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
-- ============================================
-- F006: Daily Note Panel - Rich Fields Migration
-- ============================================
-- Adds morning_prompts, organized_tasks, and end_of_day fields
-- to match the user's Obsidian daily note workflow.
--
-- Per domain-language.mdc: Using correct terms (Daily Note, Top 3)
-- Per supabase.mdc: RLS already enabled on daily_notes table

-- Add morning_prompts JSONB column
-- Structure: { weighingOnMe, avoiding, meetings, followUps, win }
ALTER TABLE daily_notes
ADD COLUMN IF NOT EXISTS morning_prompts JSONB DEFAULT '{
  "weighingOnMe": "",
  "avoiding": "",
  "meetings": "",
  "followUps": "",
  "win": ""
}'::jsonb;

-- Add organized_tasks JSONB column
-- Structure: { actionsToday[], thisWeek[], decisionsNeeded[], quickWins[], notes }
ALTER TABLE daily_notes
ADD COLUMN IF NOT EXISTS organized_tasks JSONB DEFAULT '{
  "actionsToday": [],
  "thisWeek": [],
  "decisionsNeeded": [],
  "quickWins": [],
  "notes": ""
}'::jsonb;

-- Add end_of_day JSONB column
-- Structure: { gotDone, carryingOver, wins }
-- Note: This is different from the existing wins/learnings/released columns
-- which are for structured reflection. end_of_day is freeform text.
ALTER TABLE daily_notes
ADD COLUMN IF NOT EXISTS end_of_day JSONB DEFAULT '{
  "gotDone": "",
  "carryingOver": "",
  "wins": ""
}'::jsonb;

-- Add comment explaining the schema
COMMENT ON COLUMN daily_notes.morning_prompts IS 'Morning check-in prompts: weighingOnMe, avoiding, meetings, followUps, win';
COMMENT ON COLUMN daily_notes.organized_tasks IS 'Organized tasks: actionsToday[], thisWeek[], decisionsNeeded[], quickWins[], notes';
COMMENT ON COLUMN daily_notes.end_of_day IS 'End of day reflection: gotDone, carryingOver, wins (freeform text)';
-- Migration: Create user_challenges table
-- Feature: F018 - Challenges Screen
-- Date: 2026-02-01
--
-- This table tracks each user's progress through the 22 productivity challenges.
-- Challenge definitions are static (in code), but user progress is stored here.
-- State machine: available → offered → active → data_collected → analyzed → completed
--                        ↘ declined (→ offered after 7 days)

-- Create the user_challenges table
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL CHECK (challenge_id >= 1 AND challenge_id <= 22),
  status TEXT NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'offered', 'declined', 'active', 'data_collected', 'analyzed', 'completed')
  ),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Each user can only have one record per challenge
  UNIQUE(user_id, challenge_id)
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user_status ON user_challenges(user_id, status);

-- Enable Row Level Security
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own challenges
CREATE POLICY "Users can view own challenges"
  ON user_challenges FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own challenges
CREATE POLICY "Users can create own challenges"
  ON user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own challenges
CREATE POLICY "Users can update own challenges"
  ON user_challenges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own challenges
CREATE POLICY "Users can delete own challenges"
  ON user_challenges FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_challenges_updated_at
  BEFORE UPDATE ON user_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_user_challenges_updated_at();

-- Comment on table
COMMENT ON TABLE user_challenges IS 'Tracks user progress through the 22 productivity challenges';
COMMENT ON COLUMN user_challenges.challenge_id IS 'References challenge definition (1-22) in code';
COMMENT ON COLUMN user_challenges.status IS 'State machine: available → offered → active → data_collected → analyzed → completed';
COMMENT ON COLUMN user_challenges.data IS 'Challenge-specific data collected during progress (e.g., energy logs for BPT)';
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
-- Migration: Create parked_items table
-- Feature: F026 - Parking Lot
-- Description: Store items parked for later review
-- Context: Parking Lot Manager

-- Create parked_items table
CREATE TABLE IF NOT EXISTS parked_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Item content
  text TEXT NOT NULL CHECK (char_length(text) >= 1 AND char_length(text) <= 500),
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 200),
  
  -- State machine: parked → under_review → reactivated | parked | deleted
  status TEXT DEFAULT 'parked' CHECK (status IN ('parked', 'under_review', 'reactivated', 'deleted')),
  
  -- Tracking
  parked_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  
  -- Metadata
  source TEXT CHECK (source IS NULL OR source IN ('check_in', 'manual', 'ai_suggested')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_parked_items_user_id ON parked_items(user_id);
CREATE INDEX idx_parked_items_user_status ON parked_items(user_id, status);
CREATE INDEX idx_parked_items_user_parked_at ON parked_items(user_id, parked_at DESC);

-- RLS
ALTER TABLE parked_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own parked items
CREATE POLICY "Users can view own parked items"
  ON parked_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own parked items"
  ON parked_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parked items"
  ON parked_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own parked items"
  ON parked_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_parked_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parked_items_updated_at
  BEFORE UPDATE ON parked_items
  FOR EACH ROW
  EXECUTE FUNCTION update_parked_items_updated_at();

-- Comments
COMMENT ON TABLE parked_items IS 'Items parked for later review (F026)';
COMMENT ON COLUMN parked_items.text IS 'The parked item text (1-500 chars)';
COMMENT ON COLUMN parked_items.reason IS 'Why it was parked (optional)';
COMMENT ON COLUMN parked_items.status IS 'State: parked, under_review, reactivated, deleted';
COMMENT ON COLUMN parked_items.parked_at IS 'When the item was first parked';
COMMENT ON COLUMN parked_items.last_reviewed_at IS 'When the item was last reviewed';
COMMENT ON COLUMN parked_items.source IS 'Where the item came from: check_in, manual, ai_suggested';
-- F027: Hot Spots
-- Weekly ratings for 7 life areas
-- Per bounded-contexts.mdc: Engagement Tracker context owns this data

-- Custom hot spot areas (user can personalize names/colors)
CREATE TABLE IF NOT EXISTS hotspot_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'text-violet-500',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, area_id)
);

-- Weekly ratings for each area
CREATE TABLE IF NOT EXISTS hotspot_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  area TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start, area)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_hotspot_areas_user_id ON hotspot_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_hotspot_ratings_user_week ON hotspot_ratings(user_id, week_start);

-- Per supabase.mdc: EVERY table MUST have RLS enabled
ALTER TABLE hotspot_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspot_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own data
CREATE POLICY "Users can manage own hotspot areas"
  ON hotspot_areas
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own hotspot ratings"
  ON hotspot_ratings
  FOR ALL
  USING (auth.uid() = user_id);

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_hotspot_areas_updated_at ON hotspot_areas;
CREATE TRIGGER update_hotspot_areas_updated_at
  BEFORE UPDATE ON hotspot_areas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hotspot_ratings_updated_at ON hotspot_ratings;
CREATE TRIGGER update_hotspot_ratings_updated_at
  BEFORE UPDATE ON hotspot_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- F028: Streak Tracking
-- Records daily check-ins for streak calculation
-- Per bounded-contexts.mdc: Engagement Tracker context owns this data

-- Engagement type enum
CREATE TYPE engagement_type AS ENUM ('morning_checkin', 'evening_checkin', 'hotspots_checkin');

-- Daily engagement records - one per user per date per type
CREATE TABLE IF NOT EXISTS engagement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  engagement_type engagement_type NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_id UUID REFERENCES coaching_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, engagement_type)
);

-- User streak summary - cached for performance
-- Updated by trigger or scheduled job
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_checkin_date DATE,
  total_checkins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_engagement_records_user_date 
  ON engagement_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_records_date 
  ON engagement_records(date DESC);

-- Per supabase.mdc: EVERY table MUST have RLS enabled
ALTER TABLE engagement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own data
CREATE POLICY "Users can manage own engagement records"
  ON engagement_records
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own streak summary"
  ON user_streaks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow insert/update for streak updates (from API)
CREATE POLICY "Users can update own streak summary"
  ON user_streaks
  FOR ALL
  USING (auth.uid() = user_id);

-- Function to calculate current streak for a user
CREATE OR REPLACE FUNCTION calculate_user_streak(p_user_id UUID)
RETURNS TABLE(current_streak INT, longest_streak INT, last_checkin DATE, total_checkins BIGINT) AS $$
DECLARE
  streak INT := 0;
  max_streak INT := 0;
  prev_date DATE;
  curr_date DATE;
  last_date DATE;
  total INT;
BEGIN
  -- Get total check-ins
  SELECT COUNT(DISTINCT date) INTO total
  FROM engagement_records
  WHERE user_id = p_user_id;

  -- Get distinct dates in descending order
  FOR curr_date IN 
    SELECT DISTINCT date 
    FROM engagement_records 
    WHERE user_id = p_user_id 
    ORDER BY date DESC
  LOOP
    IF last_date IS NULL THEN
      last_date := curr_date;
    END IF;

    IF prev_date IS NULL THEN
      -- First iteration
      IF curr_date = CURRENT_DATE OR curr_date = CURRENT_DATE - 1 THEN
        streak := 1;
      ELSE
        streak := 0;
      END IF;
    ELSIF prev_date - curr_date = 1 THEN
      -- Consecutive day
      streak := streak + 1;
    ELSE
      -- Gap in dates, streak broken
      IF streak > max_streak THEN
        max_streak := streak;
      END IF;
      streak := 0;
    END IF;

    prev_date := curr_date;
  END LOOP;

  -- Final comparison
  IF streak > max_streak THEN
    max_streak := streak;
  END IF;

  RETURN QUERY SELECT streak, max_streak, last_date, total;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user_streaks after engagement record insert
CREATE OR REPLACE FUNCTION update_streak_on_engagement()
RETURNS TRIGGER AS $$
DECLARE
  streak_data RECORD;
BEGIN
  -- Calculate new streak values
  SELECT * INTO streak_data FROM calculate_user_streak(NEW.user_id);
  
  -- Upsert into user_streaks
  INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_checkin_date, total_checkins, updated_at)
  VALUES (
    NEW.user_id,
    COALESCE(streak_data.current_streak, 0),
    COALESCE(streak_data.longest_streak, 0),
    streak_data.last_checkin,
    COALESCE(streak_data.total_checkins, 0),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = COALESCE(streak_data.current_streak, 0),
    longest_streak = GREATEST(user_streaks.longest_streak, COALESCE(streak_data.longest_streak, 0)),
    last_checkin_date = streak_data.last_checkin,
    total_checkins = COALESCE(streak_data.total_checkins, 0),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_streak_after_engagement
  AFTER INSERT ON engagement_records
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_on_engagement();
-- ============================================
-- F029: Try Mode - Chat Messages Table
-- ============================================
-- Creates chat_messages table for persistent chat storage.
-- Used for:
-- 1. Migrating trial messages when user signs up
-- 2. Future chat history persistence (F031)
--
-- Per supabase.mdc: RLS enabled, user_id scoped

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (per supabase.mdc: EVERY table MUST have RLS enabled)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own messages
CREATE POLICY "Users can access own messages" ON chat_messages
  FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_user_created ON chat_messages(user_id, created_at DESC);

-- Comment for documentation
COMMENT ON TABLE chat_messages IS 'F029: Trial message migration, F031: Chat history persistence';
COMMENT ON COLUMN chat_messages.metadata IS 'Optional metadata: { source: "trial_migration", original_id: "..." }';
