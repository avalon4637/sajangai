-- AI output feedback table for thumbs up/down ratings
-- Used to track user satisfaction with AI-generated content across all agent outputs

CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('chat', 'briefing', 'review_reply', 'diagnosis', 'seri_report')),
  source_id text,
  rating smallint NOT NULL CHECK (rating IN (1, -1)),
  prompt_version text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_business ON ai_feedback(business_id, created_at DESC);
