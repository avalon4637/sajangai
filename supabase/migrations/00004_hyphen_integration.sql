-- Migration: Hyphen Integration Enhancement
-- SPEC: SPEC-HYPHEN-001 - Hyphen Data Integration Platform
-- Adds encrypted credentials, sync frequency, and delivery reviews table

-- Add new columns to api_connections
ALTER TABLE api_connections
  ADD COLUMN IF NOT EXISTS encrypted_credentials TEXT,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (sync_frequency IN ('daily', 'weekly', 'manual'));

-- Create delivery_reviews table
CREATE TABLE IF NOT EXISTS delivery_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('baemin', 'coupangeats', 'yogiyo')),
  external_id TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT,
  customer_name TEXT,
  order_summary TEXT,
  review_date TIMESTAMPTZ NOT NULL,
  ai_reply TEXT,
  reply_status TEXT DEFAULT 'pending'
    CHECK (reply_status IN ('pending', 'auto_published', 'draft', 'published', 'skipped')),
  sentiment_score REAL,
  keywords TEXT[],
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, platform, external_id)
);

-- Indexes for delivery_reviews
CREATE INDEX IF NOT EXISTS idx_delivery_reviews_business_id
  ON delivery_reviews (business_id);
CREATE INDEX IF NOT EXISTS idx_delivery_reviews_platform
  ON delivery_reviews (platform);
CREATE INDEX IF NOT EXISTS idx_delivery_reviews_review_date
  ON delivery_reviews (review_date DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_reviews_rating
  ON delivery_reviews (rating);
CREATE INDEX IF NOT EXISTS idx_delivery_reviews_reply_status
  ON delivery_reviews (reply_status);

-- RLS for delivery_reviews
ALTER TABLE delivery_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own delivery reviews"
  ON delivery_reviews FOR SELECT
  USING (business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own delivery reviews"
  ON delivery_reviews FOR INSERT
  WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own delivery reviews"
  ON delivery_reviews FOR UPDATE
  USING (business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own delivery reviews"
  ON delivery_reviews FOR DELETE
  USING (business_id IN (
    SELECT id FROM businesses WHERE user_id = auth.uid()
  ));

-- Allow service role to bypass RLS for sync operations
CREATE POLICY "Service role can manage delivery reviews"
  ON delivery_reviews FOR ALL
  USING (auth.role() = 'service_role');
