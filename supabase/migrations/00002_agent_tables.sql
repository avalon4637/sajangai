-- sajang.ai 멀티에이전트 시스템 테이블
-- Phase 1: 에이전트 프로필, 대화, 메시지, 기억, 이벤트, 활동 로그

-- 에이전트 프로필 (사업장별 에이전트 설정)
CREATE TABLE agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_type text NOT NULL CHECK (agent_type IN ('manager', 'dapjangi', 'seri', 'viral')),
  display_name text NOT NULL,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, agent_type)
);

CREATE INDEX idx_agent_profiles_business ON agent_profiles(business_id);

-- 대화 스레드
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_type text NOT NULL CHECK (agent_type IN ('manager', 'dapjangi', 'seri', 'viral', 'team')),
  title text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_conversations_business_agent ON conversations(business_id, agent_type);

-- 대화 메시지
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  agent_type text CHECK (agent_type IN ('manager', 'dapjangi', 'seri', 'viral')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_business ON messages(business_id, created_at);

-- 에이전트 장기 기억
CREATE TABLE agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_type text NOT NULL CHECK (agent_type IN ('manager', 'dapjangi', 'seri', 'viral')),
  memory_type text NOT NULL CHECK (memory_type IN ('fact', 'preference', 'insight', 'decision')),
  content text NOT NULL,
  importance integer DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  source_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agent_memory_business_agent ON agent_memory(business_id, agent_type);
CREATE INDEX idx_agent_memory_type ON agent_memory(business_id, memory_type);

-- 에이전트 간 통신 이벤트 큐
CREATE TABLE agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  source_agent text NOT NULL CHECK (source_agent IN ('manager', 'dapjangi', 'seri', 'viral', 'system')),
  target_agent text NOT NULL CHECK (target_agent IN ('manager', 'dapjangi', 'seri', 'viral', 'all')),
  event_type text NOT NULL CHECK (event_type IN ('finding', 'request', 'response', 'alert')),
  title text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'consumed', 'expired')),
  consumed_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_agent_events_target ON agent_events(business_id, target_agent, status);
CREATE INDEX idx_agent_events_source ON agent_events(business_id, source_agent);

-- 활동 로그 (사용자에게 보여줄 피드)
CREATE TABLE agent_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_type text NOT NULL CHECK (agent_type IN ('manager', 'dapjangi', 'seri', 'viral', 'system')),
  action text NOT NULL,
  summary text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_activity_log_business ON agent_activity_log(business_id, created_at DESC);

-- RLS 활성화
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 사업장 데이터만 접근
CREATE POLICY "Users can manage own agent_profiles"
  ON agent_profiles FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own conversations"
  ON conversations FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own messages"
  ON messages FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own agent_memory"
  ON agent_memory FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own agent_events"
  ON agent_events FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own agent_activity_log"
  ON agent_activity_log FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- updated_at 트리거
CREATE TRIGGER agent_profiles_updated_at
  BEFORE UPDATE ON agent_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
