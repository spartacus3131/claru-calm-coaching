-- Fix daily_notes schema to match technical architecture
-- The database has diverged from the canonical schema

-- Step 1: Add missing columns if they don't exist
ALTER TABLE daily_notes ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE daily_notes ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'created';
ALTER TABLE daily_notes ADD COLUMN IF NOT EXISTS plan JSONB;
ALTER TABLE daily_notes ADD COLUMN IF NOT EXISTS reflection JSONB;

-- Step 2: If note_date exists, migrate data to date column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_notes' AND column_name = 'note_date'
  ) THEN
    UPDATE daily_notes SET date = note_date WHERE date IS NULL;
  END IF;
END $$;

-- Step 3: Add constraint for state values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'daily_notes' AND constraint_name = 'daily_notes_state_check'
  ) THEN
    ALTER TABLE daily_notes ADD CONSTRAINT daily_notes_state_check 
      CHECK (state IN ('created', 'plan_set', 'reflection_added', 'completed'));
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Step 4: Create unique constraint for user_id + date if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'daily_notes_user_date_unique'
  ) THEN
    CREATE UNIQUE INDEX daily_notes_user_date_unique ON daily_notes(user_id, date);
  END IF;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

SELECT 'daily_notes schema aligned with technical architecture' as status;
