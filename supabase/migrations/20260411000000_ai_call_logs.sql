-- AI call logging infrastructure for Phase 0.5
-- Purpose: Track cost, latency, success rate, and errors of every Claude API call
-- to enable /admin/operations observability and unit economics monitoring.

CREATE TABLE IF NOT EXISTS ai_call_logs (
  id BIGSERIAL PRIMARY KEY,

  -- Context
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  caller TEXT,                      -- e.g. 'seri-engine', 'briefing-generator', 'chat-tools'
  function_name TEXT NOT NULL,      -- e.g. 'callClaudeText', 'callClaudeObject', 'callClaudeHaiku'

  -- Model
  model TEXT NOT NULL,              -- e.g. 'claude-sonnet-4-6'

  -- Usage
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  cache_write_tokens INTEGER DEFAULT 0,

  -- Economics (approximate, in KRW)
  cost_krw NUMERIC(10, 4) NOT NULL DEFAULT 0,

  -- Performance
  latency_ms INTEGER NOT NULL DEFAULT 0,

  -- Outcome
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_code TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for the two main query patterns:
-- (1) recent window aggregation (admin dashboard)
-- (2) per-business drilldown
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_created_at
  ON ai_call_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_business_created
  ON ai_call_logs (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_status_created
  ON ai_call_logs (status, created_at DESC);

COMMENT ON TABLE ai_call_logs IS
  'Claude API call audit log. Populated by src/lib/ai/claude-client.ts wrapper.';
COMMENT ON COLUMN ai_call_logs.caller IS
  'Tag identifying the caller module (e.g. seri-engine). Optional but recommended.';
COMMENT ON COLUMN ai_call_logs.cost_krw IS
  'Approximate KRW cost computed from input/output tokens and published model pricing.';

-- Row Level Security: writes are server-side only (service role bypasses RLS).
-- Reads are limited to admins (see admin_system migration) and the owning business.
ALTER TABLE ai_call_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all logs (uses is_admin() helper from 00019_admin_system.sql)
CREATE POLICY "ai_call_logs_admin_read"
  ON ai_call_logs
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Business owners can read their own call logs
CREATE POLICY "ai_call_logs_owner_read"
  ON ai_call_logs
  FOR SELECT
  TO authenticated
  USING (
    business_id IS NOT NULL
    AND business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );
