-- Phase 2.6 — Multi-business billing support
-- Adds a "billed_business_count" field to subscriptions so the billing layer
-- can charge: base (29,700) + extra (9,900) per additional business.
--
-- Pricing model (WBS):
--   1 business → 29,700원/월
--   2 businesses → 29,700 + 9,900 = 39,600원/월
--   3 businesses → 29,700 + 19,800 = 49,500원/월
--   ...

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billed_business_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS base_price_krw INTEGER NOT NULL DEFAULT 29700;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS extra_business_price_krw INTEGER NOT NULL DEFAULT 9900;

COMMENT ON COLUMN subscriptions.billed_business_count IS
  'Phase 2.6: Number of businesses counted for billing. 1 = base plan.';
COMMENT ON COLUMN subscriptions.base_price_krw IS
  'Phase 2.6: Base monthly price for 1 business (29,700 default).';
COMMENT ON COLUMN subscriptions.extra_business_price_krw IS
  'Phase 2.6: Additional monthly price per extra business beyond the first (9,900 default).';

-- Helper view for quick admin queries
CREATE OR REPLACE VIEW subscription_prices AS
SELECT
  s.id,
  s.business_id,
  s.status,
  s.plan,
  s.billed_business_count,
  s.base_price_krw,
  s.extra_business_price_krw,
  (s.base_price_krw + GREATEST(s.billed_business_count - 1, 0) * s.extra_business_price_krw) AS total_price_krw
FROM subscriptions s;
