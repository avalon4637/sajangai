-- Phase 2.2 — Card settlement cache
-- Stores card deposit rows fetched from Hyphen /in0007000769.
-- Used by the monthly ROI report (Phase 2.3) and upcoming cashflow widget
-- to project "돈이 언제 얼마나 들어오는지".

CREATE TABLE IF NOT EXISTS card_settlements (
  id BIGSERIAL PRIMARY KEY,

  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  card_company TEXT NOT NULL,         -- e.g. '신한카드', '삼성카드'

  -- Dates in YYYY-MM-DD
  pay_date DATE,                      -- Actual deposit date (null until settled)
  pay_scheduled_date DATE NOT NULL,   -- Expected deposit date

  -- Amounts (KRW)
  sales_amount BIGINT NOT NULL DEFAULT 0,
  pay_amount BIGINT NOT NULL DEFAULT 0,
  fee_total BIGINT NOT NULL DEFAULT 0,

  transaction_count INTEGER NOT NULL DEFAULT 0,

  -- Status: 'pending' = scheduled, 'settled' = paid, 'cancelled' = reversed
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'settled', 'cancelled')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dedup on (business, card_company, pay_scheduled_date, sales_amount)
CREATE UNIQUE INDEX IF NOT EXISTS idx_card_settlements_dedup
  ON card_settlements (business_id, card_company, pay_scheduled_date, sales_amount);

-- Dashboard queries: next 30 days upcoming deposits
CREATE INDEX IF NOT EXISTS idx_card_settlements_upcoming
  ON card_settlements (business_id, pay_scheduled_date)
  WHERE status = 'pending';

COMMENT ON TABLE card_settlements IS
  'Card deposit cache from Hyphen /in0007000769. Populated by syncCardSettlements().';

-- RLS: business owners can read their own
ALTER TABLE card_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "card_settlements_owner_read"
  ON card_settlements
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "card_settlements_admin_read"
  ON card_settlements
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_card_settlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_card_settlements_updated_at ON card_settlements;
CREATE TRIGGER trg_card_settlements_updated_at
  BEFORE UPDATE ON card_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_card_settlements_updated_at();
