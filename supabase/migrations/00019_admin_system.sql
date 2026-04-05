-- SPEC-ADMIN-001 M1: Admin infrastructure
-- Add role column to user_profiles + is_active to businesses + admin RLS policies

-- ============================================================
-- 1. Add role column to user_profiles
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin'));

-- ============================================================
-- 2. Add is_active + deactivated_at to businesses
-- ============================================================

ALTER TABLE businesses
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN deactivated_at TIMESTAMPTZ;

CREATE INDEX idx_businesses_is_active ON businesses(is_active);

-- ============================================================
-- 3. Set initial admin (avalon55@nate.com)
-- ============================================================

UPDATE user_profiles
SET role = 'admin'
WHERE business_id IN (
  SELECT b.id FROM businesses b
  JOIN auth.users u ON u.id = b.user_id
  WHERE u.email = 'avalon55@nate.com'
);

-- ============================================================
-- 4. Helper function: check if current user is admin
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN businesses b ON b.id = up.business_id
    WHERE b.user_id = auth.uid()
      AND up.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- 5. Admin RLS policies: read all data
-- ============================================================

-- businesses: admin can see all
CREATE POLICY "Admin can view all businesses" ON businesses
  FOR SELECT USING (is_admin());

-- businesses: admin can update (for deactivation)
CREATE POLICY "Admin can update all businesses" ON businesses
  FOR UPDATE USING (is_admin());

-- subscriptions: admin can see all
CREATE POLICY "Admin can view all subscriptions" ON subscriptions
  FOR SELECT USING (is_admin());

-- subscriptions: admin can update (status changes)
CREATE POLICY "Admin can update all subscriptions" ON subscriptions
  FOR UPDATE USING (is_admin());

-- user_profiles: admin can see all
CREATE POLICY "Admin can view all profiles" ON user_profiles
  FOR SELECT USING (is_admin());

-- payments: admin can see all
CREATE POLICY "Admin can view all payments" ON payments
  FOR SELECT USING (is_admin());

-- ============================================================
-- 6. Restrict deactivated businesses from normal user access
-- ============================================================

-- Drop and recreate the main businesses SELECT policy to include is_active check
DROP POLICY IF EXISTS "Users can view own businesses" ON businesses;
CREATE POLICY "Users can view own active businesses" ON businesses
  FOR SELECT USING (
    (user_id = auth.uid() AND is_active = true)
    OR is_admin()
  );
