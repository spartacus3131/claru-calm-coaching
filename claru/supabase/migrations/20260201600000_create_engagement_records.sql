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
