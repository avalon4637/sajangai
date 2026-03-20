-- Data Farm: Industry type standardization, region mapping, and expense benchmarks
-- SPEC-LLM-001 Module 5

-- Industry type standardization
CREATE TABLE IF NOT EXISTS industry_types (
  code text PRIMARY KEY,
  name_ko text NOT NULL,
  parent_code text,
  nts_sector text,
  nts_type text
);

INSERT INTO industry_types (code, name_ko, nts_sector, nts_type) VALUES
  ('korean_restaurant', '한식당', '한식', '음식점'),
  ('cafe', '카페', '커피', '음료점'),
  ('chicken', '치킨점', '치킨', '음식점'),
  ('bunsik', '분식점', '분식', '음식점'),
  ('retail', '소매점', '소매', '소매업'),
  ('chinese_restaurant', '중식당', '중식', '음식점'),
  ('japanese_restaurant', '일식당', '일식', '음식점'),
  ('pizza', '피자점', '피자', '음식점'),
  ('bakery', '베이커리', '제과', '제과점'),
  ('bar', '주점', '주류', '주점'),
  ('convenience', '편의점', '편의점', '소매업'),
  ('beauty', '미용실', '미용', '서비스업'),
  ('other', '기타', NULL, NULL)
ON CONFLICT (code) DO NOTHING;

-- Region standardization
CREATE TABLE IF NOT EXISTS regions (
  code text PRIMARY KEY,
  name_ko text NOT NULL,
  sido text NOT NULL,
  sigungu text NOT NULL
);

-- Anonymized expense benchmarks (monthly batch)
CREATE TABLE IF NOT EXISTS expense_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_code text REFERENCES industry_types(code),
  region_code text REFERENCES regions(code),
  category text NOT NULL,
  sub_category text,
  avg_amount numeric NOT NULL,
  median_amount numeric NOT NULL,
  p25_amount numeric,
  p75_amount numeric,
  sample_count int NOT NULL,
  calculated_month text NOT NULL,
  UNIQUE(industry_code, region_code, category, sub_category, calculated_month)
);

-- Extend businesses table with data farm columns
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS industry_code text REFERENCES industry_types(code);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS region_code text REFERENCES regions(code);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_number text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS area_sqm numeric;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS nts_sector text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS nts_type text;
