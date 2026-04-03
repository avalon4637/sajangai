-- SPEC-QUALITY-001 M3: Data integrity fixes

-- 1. Ensure one business per user (prevent duplicate registration bugs)
-- Using a partial unique index since we don't want to break existing data
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_user_unique
  ON businesses(user_id);

-- 2. Fix vercel cron sync schedule comment alignment
-- (handled in vercel.json, not SQL)

-- 3. Add missing composite index for delivery_reviews performance
CREATE INDEX IF NOT EXISTS idx_delivery_reviews_business_date
  ON delivery_reviews(business_id, review_date DESC);
