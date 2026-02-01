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
