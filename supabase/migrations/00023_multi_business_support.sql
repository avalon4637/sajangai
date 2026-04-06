-- SPEC-MULTI-BIZ-001: Enable multi-business support
-- Remove unique constraint on subscriptions.business_id to allow per-business subscriptions
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_business_id_key;

-- Add index for efficient lookup (replaces unique index)
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON subscriptions(business_id);
