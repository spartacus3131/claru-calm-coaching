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
