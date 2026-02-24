-- Migration: Create api_connections and sync_logs tables
-- SPEC: SPEC-INFRA-001 - Hyphen API integration infrastructure

-- api_connections table
CREATE TABLE api_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'hyphen',
  connection_type TEXT NOT NULL CHECK (connection_type IN ('card_sales', 'delivery')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'expired')),
  config JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- sync_logs table
CREATE TABLE sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES api_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('card_sales', 'delivery')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  records_count INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_api_connections_business_id ON api_connections(business_id);
CREATE INDEX idx_api_connections_status ON api_connections(status);
CREATE INDEX idx_sync_logs_connection_id ON sync_logs(connection_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);

-- RLS
ALTER TABLE api_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_connections
CREATE POLICY "Users can view own connections" ON api_connections FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can create own connections" ON api_connections FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own connections" ON api_connections FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own connections" ON api_connections FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- RLS Policies for sync_logs (through api_connections)
CREATE POLICY "Users can view own sync logs" ON sync_logs FOR SELECT
  USING (connection_id IN (SELECT id FROM api_connections WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));
CREATE POLICY "Users can create own sync logs" ON sync_logs FOR INSERT
  WITH CHECK (connection_id IN (SELECT id FROM api_connections WHERE business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())));
