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
