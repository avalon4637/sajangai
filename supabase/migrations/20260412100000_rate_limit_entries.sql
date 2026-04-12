-- Persistent rate limit entries for Supabase-backed sliding window
-- Replaces the in-memory Map that resets on every Vercel cold start.

CREATE TABLE IF NOT EXISTS rate_limit_entries (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookups for sliding window count: WHERE key = X AND created_at > Y
CREATE INDEX IF NOT EXISTS idx_rate_limit_entries_key_created
  ON rate_limit_entries (key, created_at DESC);

-- Auto-cleanup: rows older than 1 hour are useless (max window is 1h for naver-sync)
-- Run via pg_cron or Supabase scheduled function if available.
-- For now, the application deletes stale rows on each check.

COMMENT ON TABLE rate_limit_entries IS
  'Sliding-window rate limit backend. Each row = one request. Old rows pruned on read.';

-- RLS: server-side only (service role bypasses RLS). No client reads needed.
ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;
