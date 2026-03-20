-- Chat messages for conversation memory (Warm tier)
-- Stores per-session message history for multi-turn chat context
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  token_count int,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_business ON chat_messages(business_id, created_at);

-- Conversation summaries for long-term memory (Cold tier)
-- Stores compressed summaries of past sessions for cross-session recall
CREATE TABLE IF NOT EXISTS conversation_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  summary text NOT NULL,
  key_facts jsonb DEFAULT '[]',
  follow_ups jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversation_summaries_business ON conversation_summaries(business_id, created_at);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own business chat data
CREATE POLICY "chat_messages_own_business" ON chat_messages
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "conversation_summaries_own_business" ON conversation_summaries
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );
