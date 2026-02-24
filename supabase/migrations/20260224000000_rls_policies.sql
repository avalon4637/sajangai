-- ============================================================================
-- SPEC-RLS-001: Row Level Security Policies for sajang.ai
-- ============================================================================
-- This migration replaces the existing broad FOR ALL policies with granular
-- per-operation policies (SELECT, INSERT, UPDATE, DELETE) for each table.
-- This provides better security auditing, compliance visibility, and the
-- ability to apply different conditions per operation if needed.
--
-- Pattern:
--   businesses: auth.uid() = user_id (direct ownership)
--   child tables: business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
--
-- Idempotent: Uses DROP POLICY IF EXISTS before CREATE POLICY.
-- ============================================================================

-- ============================================================================
-- Phase 1: Enable RLS on all tables (idempotent - safe to re-run)
-- ============================================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Phase 2: Drop existing broad FOR ALL policies from initial migration
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can manage own revenues" ON revenues;
DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can manage own fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can manage own monthly_summaries" ON monthly_summaries;
DROP POLICY IF EXISTS "Users can manage own csv_uploads" ON csv_uploads;

-- Also drop the granular policies in case this migration is re-run
DROP POLICY IF EXISTS "businesses_select_own" ON businesses;
DROP POLICY IF EXISTS "businesses_insert_own" ON businesses;
DROP POLICY IF EXISTS "businesses_update_own" ON businesses;
DROP POLICY IF EXISTS "businesses_delete_own" ON businesses;

DROP POLICY IF EXISTS "revenues_select_own" ON revenues;
DROP POLICY IF EXISTS "revenues_insert_own" ON revenues;
DROP POLICY IF EXISTS "revenues_update_own" ON revenues;
DROP POLICY IF EXISTS "revenues_delete_own" ON revenues;

DROP POLICY IF EXISTS "expenses_select_own" ON expenses;
DROP POLICY IF EXISTS "expenses_insert_own" ON expenses;
DROP POLICY IF EXISTS "expenses_update_own" ON expenses;
DROP POLICY IF EXISTS "expenses_delete_own" ON expenses;

DROP POLICY IF EXISTS "fixed_costs_select_own" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_insert_own" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_update_own" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_delete_own" ON fixed_costs;

DROP POLICY IF EXISTS "monthly_summaries_select_own" ON monthly_summaries;
DROP POLICY IF EXISTS "monthly_summaries_insert_own" ON monthly_summaries;
DROP POLICY IF EXISTS "monthly_summaries_update_own" ON monthly_summaries;
DROP POLICY IF EXISTS "monthly_summaries_delete_own" ON monthly_summaries;

DROP POLICY IF EXISTS "csv_uploads_select_own" ON csv_uploads;
DROP POLICY IF EXISTS "csv_uploads_insert_own" ON csv_uploads;
DROP POLICY IF EXISTS "csv_uploads_update_own" ON csv_uploads;
DROP POLICY IF EXISTS "csv_uploads_delete_own" ON csv_uploads;

-- ============================================================================
-- Phase 3: Create granular per-operation policies
-- ============================================================================

-- --------------------------------------------------------------------------
-- businesses: Direct user_id ownership check
-- --------------------------------------------------------------------------

-- Users can only view their own businesses
CREATE POLICY "businesses_select_own"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create businesses linked to their own auth.uid()
CREATE POLICY "businesses_insert_own"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own businesses
CREATE POLICY "businesses_update_own"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own businesses
CREATE POLICY "businesses_delete_own"
  ON businesses FOR DELETE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- revenues: Indirect ownership via business_id -> businesses.user_id
-- --------------------------------------------------------------------------

CREATE POLICY "revenues_select_own"
  ON revenues FOR SELECT
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "revenues_insert_own"
  ON revenues FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "revenues_update_own"
  ON revenues FOR UPDATE
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "revenues_delete_own"
  ON revenues FOR DELETE
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- --------------------------------------------------------------------------
-- expenses: Indirect ownership via business_id -> businesses.user_id
-- --------------------------------------------------------------------------

CREATE POLICY "expenses_select_own"
  ON expenses FOR SELECT
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "expenses_insert_own"
  ON expenses FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "expenses_update_own"
  ON expenses FOR UPDATE
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "expenses_delete_own"
  ON expenses FOR DELETE
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- --------------------------------------------------------------------------
-- fixed_costs: Indirect ownership via business_id -> businesses.user_id
-- --------------------------------------------------------------------------

CREATE POLICY "fixed_costs_select_own"
  ON fixed_costs FOR SELECT
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "fixed_costs_insert_own"
  ON fixed_costs FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "fixed_costs_update_own"
  ON fixed_costs FOR UPDATE
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "fixed_costs_delete_own"
  ON fixed_costs FOR DELETE
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- --------------------------------------------------------------------------
-- monthly_summaries: Indirect ownership via business_id -> businesses.user_id
-- --------------------------------------------------------------------------

CREATE POLICY "monthly_summaries_select_own"
  ON monthly_summaries FOR SELECT
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "monthly_summaries_insert_own"
  ON monthly_summaries FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "monthly_summaries_update_own"
  ON monthly_summaries FOR UPDATE
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "monthly_summaries_delete_own"
  ON monthly_summaries FOR DELETE
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- --------------------------------------------------------------------------
-- csv_uploads: Indirect ownership via business_id -> businesses.user_id
-- --------------------------------------------------------------------------

CREATE POLICY "csv_uploads_select_own"
  ON csv_uploads FOR SELECT
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "csv_uploads_insert_own"
  ON csv_uploads FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "csv_uploads_update_own"
  ON csv_uploads FOR UPDATE
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "csv_uploads_delete_own"
  ON csv_uploads FOR DELETE
  USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Verification queries (run these after applying the migration)
-- ============================================================================

-- Check RLS is enabled on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- List all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, cmd;

-- Expected: 4 policies per table (select, insert, update, delete) = 24 total
-- SELECT tablename, count(*) as policy_count
-- FROM pg_policies WHERE schemaname = 'public'
-- GROUP BY tablename ORDER BY tablename;
