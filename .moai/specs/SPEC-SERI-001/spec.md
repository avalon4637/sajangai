# SPEC-SERI-001: Seri AI Financial Analysis Engine

## Metadata

| Field       | Value                                  |
| ----------- | -------------------------------------- |
| SPEC ID     | SPEC-SERI-001                          |
| Title       | Seri AI Financial Analysis Engine      |
| Created     | 2026-03-18                             |
| Status      | Planned                                |
| Priority    | High                                   |
| Lifecycle   | spec-anchored                          |
| Related     | SPEC-HYPHEN-001, SPEC-AI-001           |

---

## Environment

- **Platform**: Next.js 16 (App Router), React 19, Supabase
- **AI Engine**: Claude Sonnet API via `ANTHROPIC_API_KEY`
- **Data Sources**: `revenues`, `expenses`, `fixed_costs`, `monthly_summaries`, `delivery_reviews` tables
- **Agent System**: Seri (seri) is one of 4 AI agents - the financial analyst
- **Cost Target**: < $0.05 per report via prompt caching and structured data injection
- **Existing Infrastructure**: `src/lib/agents/` engine, `src/lib/ai/` directory

---

## Assumptions

- A1: Revenue and expense data in the database is accurate and up-to-date (synced via SPEC-HYPHEN-001).
- A2: Claude Sonnet API supports structured prompt injection with financial data tables.
- A3: Delivery app commission rates are available in revenue metadata (from Hyphen sync).
- A4: Card settlement schedules (D+2 to D+30) per issuer are deterministic and can be pre-configured.
- A5: Fixed costs (rent, salary, insurance, taxes) are entered by the user and stored in `fixed_costs` table.
- A6: The 4-week moving average is a sufficient baseline for cost anomaly detection.

---

## Requirements

### S1: Real P&L Calculator

#### Ubiquitous Requirements

- **[U1]** The system shall always calculate net profit after deducting all platform commissions and card processing fees.
- **[U2]** The system shall display monetary values in Korean Won (KRW) format with thousand separators.

#### Event-Driven Requirements

- **[E1]** **When** Seri generates a P&L report, **then** the system shall reverse-calculate delivery app commissions per platform:
  - Baemin: base commission + advertising fee + rider fee
  - Coupang Eats: order commission rate
  - Yogiyo: commission rate per plan tier
- **[E2]** **When** Seri generates a P&L report, **then** the system shall deduct card processing fees per transaction type (credit: ~2.2%, debit: ~1.5%, zero-rate for small businesses).
- **[E3]** **When** the P&L report is generated, **then** the system shall break down real profit margin by channel: dine-in (hol), delivery (baemin/coupang/yogiyo), takeout (pojang).

#### State-Driven Requirements

- **[S1-1]** **If** the business has delivery app connections, **then** the P&L calculator shall include commission deductions from delivery revenue.
- **[S1-2]** **If** the business has only card sales data, **then** the P&L calculator shall use card-only fee deductions.

### S2: Cash Flow Predictor

#### Event-Driven Requirements

- **[E4]** **When** Seri generates a cash flow forecast, **then** the system shall project daily cash balance for the next 14 days.
- **[E5]** **When** generating the forecast, **then** the system shall calculate expected card settlement deposits based on:
  - Approval date + issuer-specific settlement cycle (D+2 to D+30)
  - Settlement amount = approved amount - processing fee
- **[E6]** **When** generating the forecast, **then** the system shall subtract scheduled fixed expenses:
  - Salary (payment date from `fixed_costs`)
  - Rent (payment date from `fixed_costs`)
  - Insurance, taxes, utilities (scheduled dates)
- **[E7]** **When** the projected cash balance drops below a configurable safety threshold, **then** the system shall generate an alert at D-7.
- **[E8]** **When** a low-balance alert is generated, **then** the system shall suggest mitigations:
  - Delivery app early settlement (baemin/coupang advance payment)
  - Salary payment date adjustment
  - Expense deferral recommendations

#### State-Driven Requirements

- **[S2-1]** **If** no safety threshold is configured, **then** the system shall use a default threshold of 500,000 KRW.

### S3: Cost Anomaly Detection

#### Event-Driven Requirements

- **[E9]** **When** the weekly analysis runs, **then** the system shall calculate the cost ratio: `(weekly purchases / weekly sales) * 100`.
- **[E10]** **When** the current week's cost ratio deviates by +3 percentage points from the 4-week moving average, **then** the system shall generate an anomaly alert.
- **[E11]** **When** an anomaly is detected, **then** the Seri engine shall diagnose the probable cause using Claude AI:
  - Supplier price increase (higher purchase unit costs)
  - Waste increase (same purchases, lower sales volume)
  - Sales decline (lower sales with normal purchases)
  - Seasonal pattern (compare with same period last year if data exists)

#### State-Driven Requirements

- **[S3-1]** **If** fewer than 4 weeks of data exist, **then** the system shall skip anomaly detection and display a "Collecting data" message.

### Cross-Cutting Requirements

#### Ubiquitous Requirements

- **[U3]** The system shall cache analysis results in the `daily_reports` table to avoid redundant API calls.
- **[U4]** The system shall limit Claude API cost to under $0.05 per report through prompt caching and structured data injection.

#### Unwanted Behavior Requirements

- **[X1]** The system shall **not** call Claude API if a cached report for the same date and report type already exists.
- **[X2]** The system shall **not** display financial analysis based on incomplete data without a clear disclaimer.

---

## Specifications

### File Changes

| Action   | File Path                                              | Description                                |
| -------- | ------------------------------------------------------ | ------------------------------------------ |
| Create   | `src/lib/ai/seri-engine.ts`                            | Seri analysis engine (orchestrator)        |
| Create   | `src/lib/ai/seri-prompts.ts`                           | Prompt templates for each analysis type    |
| Create   | `src/lib/ai/cost-analyzer.ts`                          | Cost ratio tracking & anomaly detection    |
| Create   | `src/lib/ai/cashflow-predictor.ts`                     | Cash flow projection logic                 |
| Create   | `src/lib/ai/profit-calculator.ts`                      | Real P&L after all fees                    |
| Create   | `supabase/migrations/00004_daily_reports.sql`          | Daily reports table migration              |

### Database Changes

**Migration: `supabase/migrations/00004_daily_reports.sql`**

```sql
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('pnl', 'cashflow', 'anomaly')),
  content JSONB NOT NULL,
  model_version TEXT DEFAULT 'claude-sonnet',
  token_usage INTEGER,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (business_id, report_date, report_type)
);

-- RLS for daily_reports
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports"
  ON daily_reports FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

CREATE POLICY "System can insert reports"
  ON daily_reports FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
```

### Seri Engine Architecture

```
SeriEngine (Orchestrator)
  |
  +-- ProfitCalculator (S1)
  |     - Fetch revenues with metadata
  |     - Calculate commission by platform
  |     - Calculate card processing fees
  |     - Output: channel-wise real profit margin
  |
  +-- CashflowPredictor (S2)
  |     - Fetch pending card settlements
  |     - Fetch scheduled fixed costs
  |     - Project 14-day daily balance
  |     - Alert on threshold breach at D-7
  |     - Output: daily forecast + alerts + mitigations
  |
  +-- CostAnalyzer (S3)
        - Calculate weekly cost ratio
        - Compute 4-week moving average
        - Detect deviation >= 3pp
        - Call Claude for cause diagnosis
        - Output: anomaly alert + diagnosis
```

### Prompt Engineering Strategy

- **Structured Data Injection**: Financial data formatted as markdown tables in system prompt
- **Template Variables**: `{{period}}`, `{{revenues}}`, `{{expenses}}`, `{{cost_ratio_history}}`
- **Response Format**: JSON schema enforcement via Claude tool_use
- **Token Optimization**: Pre-aggregate data before injection (reduce 10K rows to summary tables)
- **Prompt Caching**: Use Anthropic prompt caching for the system prompt (reduces cost by ~90% on cache hits)

### Cost Control

```
Per Report Cost Breakdown:
  - System prompt (cached): ~$0.001
  - User data injection: ~$0.01-0.02 (depends on data volume)
  - Claude response: ~$0.01-0.02
  - Total: ~$0.02-0.05 per report

Cost Controls:
  - Cache check before API call (daily_reports table)
  - Data pre-aggregation to minimize input tokens
  - Prompt caching for system instructions
  - Rate limit: max 3 reports per business per day
```

---

## Traceability

| Requirement | Test Scenario               | Acceptance Criteria       |
| ----------- | --------------------------- | ------------------------- |
| E1/E2       | AC-1: P&L calculation       | acceptance.md#AC-1        |
| E3          | AC-2: Channel breakdown     | acceptance.md#AC-2        |
| E4/E5/E6    | AC-3: Cash flow forecast    | acceptance.md#AC-3        |
| E7/E8       | AC-4: Low balance alert     | acceptance.md#AC-4        |
| E9/E10      | AC-5: Cost anomaly detect   | acceptance.md#AC-5        |
| E11         | AC-6: Cause diagnosis       | acceptance.md#AC-6        |
| U4/X1       | AC-7: Cost control          | acceptance.md#AC-7        |
