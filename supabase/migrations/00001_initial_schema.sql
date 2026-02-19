-- sajang.ai 초기 데이터베이스 스키마
-- Supabase PostgreSQL

-- 사업장 테이블
CREATE TABLE businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_type text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_businesses_user_id ON businesses(user_id);

-- 매출 테이블
CREATE TABLE revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date date NOT NULL,
  channel text,
  category text,
  amount numeric(12,0) NOT NULL,
  memo text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_revenues_business_date ON revenues(business_id, date);

-- 지출 테이블 (매입 + 변동비)
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('fixed', 'variable')),
  category text NOT NULL,
  amount numeric(12,0) NOT NULL,
  memo text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_expenses_business_date ON expenses(business_id, date);

-- 고정비 테이블 (월별 반복 비용)
CREATE TABLE fixed_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric(12,0) NOT NULL,
  is_labor boolean DEFAULT false,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fixed_costs_business ON fixed_costs(business_id);

-- 월별 요약 테이블 (계산된 KPI 캐시)
CREATE TABLE monthly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  year_month text NOT NULL,
  total_revenue numeric(12,0) DEFAULT 0,
  total_expense numeric(12,0) DEFAULT 0,
  total_fixed_cost numeric(12,0) DEFAULT 0,
  total_labor_cost numeric(12,0) DEFAULT 0,
  gross_profit numeric(12,0) DEFAULT 0,
  net_profit numeric(12,0) DEFAULT 0,
  gross_margin numeric(5,2) DEFAULT 0,
  labor_ratio numeric(5,2) DEFAULT 0,
  fixed_cost_ratio numeric(5,2) DEFAULT 0,
  survival_score numeric(5,1) DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, year_month)
);

CREATE INDEX idx_monthly_summaries_business_month ON monthly_summaries(business_id, year_month);

-- CSV 업로드 이력
CREATE TABLE csv_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  file_name text,
  file_path text,
  row_count integer,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;

-- businesses: 본인 데이터만 접근
CREATE POLICY "Users can manage own businesses"
  ON businesses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- revenues: 본인 사업장 데이터만 접근
CREATE POLICY "Users can manage own revenues"
  ON revenues FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- expenses: 본인 사업장 데이터만 접근
CREATE POLICY "Users can manage own expenses"
  ON expenses FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- fixed_costs: 본인 사업장 데이터만 접근
CREATE POLICY "Users can manage own fixed_costs"
  ON fixed_costs FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- monthly_summaries: 본인 사업장 데이터만 접근
CREATE POLICY "Users can manage own monthly_summaries"
  ON monthly_summaries FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- csv_uploads: 본인 사업장 데이터만 접근
CREATE POLICY "Users can manage own csv_uploads"
  ON csv_uploads FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
