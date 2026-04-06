-- Migration: Naver Place Integration
-- SPEC: SPEC-NAVER-001 - Naver Place review crawling
-- Adds naver_place_id to businesses and extends delivery_reviews for naver_place platform

-- Add Naver Place columns to businesses table
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS naver_place_id TEXT,
  ADD COLUMN IF NOT EXISTS naver_last_synced_at TIMESTAMPTZ;

-- Extend platform CHECK constraint on delivery_reviews to include naver_place
-- Drop old constraint and recreate with naver_place included
ALTER TABLE delivery_reviews DROP CONSTRAINT IF EXISTS delivery_reviews_platform_check;
ALTER TABLE delivery_reviews
  ADD CONSTRAINT delivery_reviews_platform_check
  CHECK (platform IN ('baemin', 'coupangeats', 'yogiyo', 'naver_place'));

-- Index for Naver Place reviews lookup
CREATE INDEX IF NOT EXISTS idx_delivery_reviews_naver_external
  ON delivery_reviews (business_id, external_id)
  WHERE platform = 'naver_place';
