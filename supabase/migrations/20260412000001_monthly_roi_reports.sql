-- Phase 2.3 — Monthly ROI Report
-- Persistent cache of calculateMonthlyRoi() output. One row per
-- (business, year_month). Written by the roi-report cron (runs on the 1st
-- of each month) and by the admin-operations 'generate_monthly_roi' action.

CREATE TABLE IF NOT EXISTS monthly_roi_reports (
  id BIGSERIAL PRIMARY KEY,

  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,  -- 'YYYY-MM'

  -- Breakdown components (KRW)
  fee_savings BIGINT NOT NULL DEFAULT 0,
  anomaly_prevention BIGINT NOT NULL DEFAULT 0,
  cost_savings BIGINT NOT NULL DEFAULT 0,
  customer_retention BIGINT NOT NULL DEFAULT 0,
  time_savings BIGINT NOT NULL DEFAULT 0,

  total_value BIGINT NOT NULL DEFAULT 0,
  subscription_cost BIGINT NOT NULL DEFAULT 29700,
  roi_multiple INTEGER NOT NULL DEFAULT 0,

  -- Optional AI-generated narrative summary
  narrative TEXT,

  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (business_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_roi_reports_business
  ON monthly_roi_reports (business_id, year_month DESC);

COMMENT ON TABLE monthly_roi_reports IS
  'Monthly ROI report cache. One row per business per month. Phase 2.3.';

-- RLS
ALTER TABLE monthly_roi_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_roi_reports_owner_read"
  ON monthly_roi_reports
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "monthly_roi_reports_admin_read"
  ON monthly_roi_reports
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_monthly_roi_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_monthly_roi_reports_updated_at ON monthly_roi_reports;
CREATE TRIGGER trg_monthly_roi_reports_updated_at
  BEFORE UPDATE ON monthly_roi_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_roi_reports_updated_at();
