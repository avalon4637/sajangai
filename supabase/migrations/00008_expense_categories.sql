-- ============================================================================
-- SPEC-SERI-002: Enhanced Bookkeeping - Database Layer
-- ============================================================================
-- Tables:
--   1. expense_categories  - 매입 9대 분류 + 소분류
--   2. merchant_mappings   - 가맹점 -> 카테고리 학습 매핑
--   3. labor_records       - 인건비 관리
--   4. invoices            - 미수금/미지급금
--   5. vendors             - 거래처 관리
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. expense_categories
-- ----------------------------------------------------------------------------

CREATE TABLE expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  major_category text NOT NULL,
  sub_category text NOT NULL,
  display_order integer DEFAULT 0,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, major_category, sub_category)
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expense_categories"
  ON expense_categories FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- 2. merchant_mappings
-- ----------------------------------------------------------------------------

CREATE TABLE merchant_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  merchant_name_pattern text NOT NULL,
  major_category text NOT NULL,
  sub_category text,
  confidence real DEFAULT 1.0,
  usage_count integer DEFAULT 1,
  created_by text DEFAULT 'user' CHECK (created_by IN ('user', 'ai')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, merchant_name_pattern)
);

CREATE INDEX idx_merchant_mappings_business_pattern
  ON merchant_mappings(business_id, merchant_name_pattern);

ALTER TABLE merchant_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own merchant_mappings"
  ON merchant_mappings FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- 3. labor_records
-- ----------------------------------------------------------------------------

CREATE TABLE labor_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  employee_name text NOT NULL,
  payment_date date NOT NULL,
  gross_amount integer NOT NULL,
  deductions integer NOT NULL DEFAULT 0,
  net_amount integer GENERATED ALWAYS AS (gross_amount - deductions) STORED,
  memo text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_labor_records_business_date
  ON labor_records(business_id, payment_date);

ALTER TABLE labor_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own labor_records"
  ON labor_records FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- 4. invoices
-- ----------------------------------------------------------------------------

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('receivable', 'payable')),
  counterparty text NOT NULL,
  amount integer NOT NULL,
  issue_date date NOT NULL,
  due_date date,
  paid_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  memo text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_invoices_business_status
  ON invoices(business_id, status);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices"
  ON invoices FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. vendors
-- ----------------------------------------------------------------------------

CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text,
  contact_name text,
  phone text,
  business_number text,
  memo text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, name)
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own vendors"
  ON vendors FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- Seed default 9 major categories as a reference function
-- Call this from application layer via ensureDefaultCategories()
-- ----------------------------------------------------------------------------
-- Default categories (9대 분류):
--   고정비용, 세금, 인건비, 식자재, 소모품, 운영비, 마케팅, 대표교육비, 수수료
