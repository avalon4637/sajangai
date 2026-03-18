-- Replace agent_events with store_context (shared context pattern)
-- Each specialist agent writes analysis results here; supervisor reads all.

-- Drop old A2A event system
DROP TABLE IF EXISTS agent_events CASCADE;

-- Create store_context table (one row per agent per business)
CREATE TABLE store_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_type text NOT NULL CHECK (agent_type IN ('dapjangi', 'seri', 'viral')),
  context_data jsonb NOT NULL DEFAULT '{}',
  summary text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, agent_type)
);

CREATE INDEX idx_store_context_business ON store_context(business_id);

-- RLS
ALTER TABLE store_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own store_context"
  ON store_context FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
