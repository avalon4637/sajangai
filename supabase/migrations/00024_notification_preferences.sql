-- Add notification_preferences JSONB column to user_profiles
-- Stores per-user AlimTalk/SMS notification toggle and quiet hours settings
-- Default: all notifications enabled, quiet hours 22:00-08:00

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{
    "dailyReport": true,
    "reviewAlert": true,
    "anomalyAlert": true,
    "weeklyReport": true,
    "insightAlert": true,
    "subscriptionAlert": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00"
  }'::jsonb;

-- Partial index for users who disabled all notifications (useful for batch send queries)
CREATE INDEX IF NOT EXISTS idx_user_profiles_notif_prefs
  ON user_profiles USING GIN (notification_preferences);

COMMENT ON COLUMN user_profiles.notification_preferences IS
  'JSONB: per-notification-type toggles and quiet hours. See NotificationPreferences TS type.';
