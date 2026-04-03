-- SPEC-FINANCE-001 M1: Loans, Budgets, Cashflow tables
-- Source: doc/template_excel/financial-agent-spec.md sections 5.4, 7.4, 8.2

-- ============================================================
-- 1. Loans (대출관리) - spec section 7.4
-- ============================================================

CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  institution TEXT,                       -- 금융기관
  loan_name TEXT NOT NULL,               -- 대출명
  purpose TEXT,                          -- 대출목적
  principal NUMERIC(15,0) NOT NULL,      -- 대출원금
  interest_rate NUMERIC(5,3),            -- 금리 (%)
  payment_day INT,                       -- 납입일 (1~31)
  monthly_payment NUMERIC(15,0),         -- 월 납입금
  rate_type TEXT CHECK (rate_type IN ('fixed', 'variable')),
  loan_period TEXT,                      -- 대출기간
  repayment_type TEXT,                   -- 상환조건 (원리금균등, 원금균등, 만기일시)
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE loan_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  repayment_date DATE NOT NULL,
  principal_paid NUMERIC(15,0) DEFAULT 0,  -- 상환원금
  interest_paid NUMERIC(15,0) DEFAULT 0,   -- 이자
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_loans_business ON loans(business_id);
CREATE INDEX idx_loan_repayments_loan ON loan_repayments(loan_id, repayment_date);

-- Loan balance view
CREATE OR REPLACE VIEW v_loan_balance AS
SELECT
  l.id,
  l.business_id,
  l.loan_name,
  l.institution,
  l.principal,
  l.interest_rate,
  l.monthly_payment,
  l.is_active,
  l.principal - COALESCE(SUM(r.principal_paid), 0) AS remaining_principal,
  COALESCE(SUM(r.interest_paid), 0) AS total_interest_paid,
  COALESCE(SUM(r.principal_paid), 0) AS total_principal_paid,
  COUNT(r.id) AS repayment_count
FROM loans l
LEFT JOIN loan_repayments r ON r.loan_id = l.id
GROUP BY l.id;

-- RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loans_own_business" ON loans
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "loan_repayments_own_business" ON loan_repayments
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ============================================================
-- 2. Budgets (예산관리) - spec section 8.2
-- ============================================================

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  category TEXT NOT NULL,                -- 대분류 (매출, 고정비용, 인건비 등)
  target_amount NUMERIC(15,0) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, year, month, category)
);

CREATE INDEX idx_budgets_business ON budgets(business_id, year, month);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_own_business" ON budgets
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

-- ============================================================
-- 3. Cashflow Entries (입출금 내역) - spec section 5.4
-- ============================================================

CREATE TABLE cashflow_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT,
  debit NUMERIC(15,0) DEFAULT 0,         -- 출금
  credit NUMERIC(15,0) DEFAULT 0,        -- 입금
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'revenue', 'other_income', 'expense', 'other_expense',
    'reserve_set', 'reserve_release'
  )),
  tag TEXT,                              -- 현금영수증필, 세금계산서필 등
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cashflow_business ON cashflow_entries(business_id, date);

ALTER TABLE cashflow_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cashflow_own_business" ON cashflow_entries
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
