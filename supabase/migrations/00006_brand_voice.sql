-- Migration: Brand Voice Profiles
-- SPEC: SPEC-DAPJANGI-001 - Dapjangi AI Review Management Engine
-- Stores owner's communication style for AI reply generation

CREATE TABLE brand_voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL UNIQUE,
  sample_replies TEXT[] NOT NULL DEFAULT '{}',
  voice_traits JSONB NOT NULL DEFAULT '{}',
  tone TEXT DEFAULT 'friendly',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own voice profile" ON brand_voice_profiles
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- Index for fast lookup by business_id (also covered by UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_brand_voice_business_id
  ON brand_voice_profiles (business_id);
