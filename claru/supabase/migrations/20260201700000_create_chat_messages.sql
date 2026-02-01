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
