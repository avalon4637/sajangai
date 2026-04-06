-- Review reply tracking enhancement
-- Adds replied_at timestamp for tracking when owner marked a review as replied

-- Add replied_at column (nullable, set when user marks review as replied)
ALTER TABLE delivery_reviews
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- Index for filtering unreplied reviews efficiently
CREATE INDEX IF NOT EXISTS idx_delivery_reviews_replied_at
  ON delivery_reviews (business_id, replied_at)
  WHERE replied_at IS NULL;
