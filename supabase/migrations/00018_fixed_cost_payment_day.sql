-- Add payment_day column to fixed_costs table
-- 0 = last day of month (default), 1-31 = specific day
ALTER TABLE fixed_costs
  ADD COLUMN IF NOT EXISTS payment_day smallint NOT NULL DEFAULT 0
  CHECK (payment_day >= 0 AND payment_day <= 31);

COMMENT ON COLUMN fixed_costs.payment_day IS 'Day of month when this cost is due. 0 means last day of month.';
