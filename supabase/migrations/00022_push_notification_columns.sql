-- Add push notification columns for Capacitor mobile app
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS push_platform TEXT CHECK (push_platform IN ('android', 'ios', 'web'));
