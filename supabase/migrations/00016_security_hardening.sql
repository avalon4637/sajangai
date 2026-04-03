-- SPEC-HARDEN-001 M1: Security fixes
-- Fix overly permissive INSERT policies and missing RLS

-- ============================================================
-- 1. Fix insight_events INSERT policy (was WITH CHECK (true))
-- ============================================================

DROP POLICY IF EXISTS "System can insert insights" ON insight_events;
CREATE POLICY "Server can insert insights" ON insight_events
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    OR current_setting('role') = 'service_role'
  );

-- Add DELETE policy for cleanup
CREATE POLICY "Users can delete own insights" ON insight_events
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- ============================================================
-- 2. Fix action_results INSERT policy (was WITH CHECK (true))
-- ============================================================

DROP POLICY IF EXISTS "System can insert action results" ON action_results;
CREATE POLICY "Server can insert action results" ON action_results
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
    OR current_setting('role') = 'service_role'
  );

-- ============================================================
-- 3. ai_feedback RLS (was completely missing)
-- ============================================================

ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_feedback_own_business" ON ai_feedback
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

-- ============================================================
-- 4. Reference tables RLS (read-only for authenticated users)
-- ============================================================

ALTER TABLE industry_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "industry_types_read" ON industry_types
  FOR SELECT USING (true);

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "regions_read" ON regions
  FOR SELECT USING (true);

ALTER TABLE expense_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_benchmarks_read" ON expense_benchmarks
  FOR SELECT USING (true);
