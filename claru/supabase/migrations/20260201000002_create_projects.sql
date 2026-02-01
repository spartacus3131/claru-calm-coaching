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
