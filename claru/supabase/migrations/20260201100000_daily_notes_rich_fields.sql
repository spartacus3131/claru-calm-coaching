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
