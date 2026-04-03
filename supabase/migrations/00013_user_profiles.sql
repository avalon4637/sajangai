-- User profiles: personalization preferences for AAAS engine
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  -- Onboarding 3 questions
  communication_style TEXT NOT NULL DEFAULT 'concise'
    CHECK (communication_style IN ('concise', 'detailed', 'conversational')),
  focus_area TEXT NOT NULL DEFAULT 'all'
    CHECK (focus_area IN ('revenue', 'review', 'cost', 'all')),
  notification_time TEXT NOT NULL DEFAULT 'morning'
    CHECK (notification_time IN ('morning', 'evening', 'both')),
  -- Notification preferences
  active_hours_start INTEGER NOT NULL DEFAULT 7,   -- 07:00
  active_hours_end INTEGER NOT NULL DEFAULT 22,    -- 22:00
  -- Onboarding completion
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_business ON user_profiles(business_id);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
  );
