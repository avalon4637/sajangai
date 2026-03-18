# SPEC-COST-001: AI Cost Reduction Engine

> Status: Planned | Priority: High | Phase: 3 (after SPEC-REVENUE-001)
> Estimated Effort: 3-4 weeks

---

## 1. Overview

### Problem Statement

Korean small business owners often have "cost leaks" -- unnecessary recurring charges, above-average spending in specific categories, duplicate payments, and missed bulk-purchase savings. These leaks compound over time but are invisible without systematic analysis. Most owners lack the time or tools to compare their costs against industry benchmarks or track recurring waste.

### Goal

Build an AI-powered cost reduction engine that automatically detects cost leaks, benchmarks spending against industry averages, generates specific reduction recommendations with expected savings, and tracks the actual impact of accepted recommendations over time.

### Business Model Implications

- **Retention driver:** Owners who save money through the tool stay subscribed to the 9,900 KRW/month service
- **Future revenue stream:** Partner/affiliate network with suppliers creates commission-based income for sajang.ai
- **Data asset:** Anonymized, aggregated cost data across users builds proprietary industry benchmark dataset

---

## 2. Architecture Overview

### Agent Integration

```
SERI (Financial Analyst)  -->  Cost Reduction Engine  -->  Owner Dashboard
       |                            |                          |
  Expense Data               Leak Detection              Accept/Reject UI
  Fixed Cost Data            Benchmarking                Savings Tracker
  Industry Data              Recommendation Gen          Annual Report
```

### Module Decomposition

| Module | Responsibility | Priority |
|--------|---------------|----------|
| Cost Leak Detector | Anomaly detection, duplicate detection, unused subscription detection | Primary |
| Industry Benchmarker | Category-level cost ratio comparison vs. industry averages | Primary |
| Reduction Recommender | AI-generated specific cost reduction suggestions | Primary |
| Savings Tracker | Accept/reject flow, actual savings measurement | Secondary |
| Partner Network | Affiliate supplier connections, commission model | Future |

---

## 3. Feature Specifications

### 3.1 Automated Cost Leak Detection

**Purpose:** Automatically identify unnecessary spending, anomalous cost increases, duplicate payments, and unused recurring charges.

**Detection Algorithms:**

1. **Category Anomaly Detection**
   - Compare each expense category's current month total vs. rolling 3-month average
   - Alert threshold: >= 30% increase from average
   - Example: "Supplies cost this month: 450,000 KRW (45% above your 3-month average of 310,000 KRW)"

2. **Recurring Charge Detection**
   - Pattern match: same merchant + same amount + monthly frequency
   - Cross-reference with usage data (if available) to identify unused subscriptions
   - Example: "Monthly charge of 49,000 KRW to ServiceX detected -- no usage records found in last 3 months"

3. **Duplicate Payment Detection**
   - Same merchant + same amount + same date (or within 2 business days)
   - Example: "Two payments of 230,000 KRW to Supplier A on 3/15 -- possible duplicate. Verify with supplier."

4. **Small Recurring Leak Aggregation**
   - Aggregate small recurring expenses and project annual cost
   - Example: "Weekly snack purchases: 15,000 KRW x 52 weeks = 780,000 KRW/year -- bulk purchasing could save 40%"

**Technical Approach:**

- Run detection algorithms as async background job (triggered daily or on-demand)
- Store detected leaks in `cost_leaks` table with type, severity, and estimated savings
- Claude AI generates human-readable descriptions from raw detection results
- Deduplicate alerts: don't re-alert for same leak within 30 days

**Data Dependencies:**

- `expenses` table: category, amount, merchant_name, created_at
- `fixed_costs` table: category, amount, billing_cycle
- Minimum 60 days of expense data for meaningful pattern detection

### 3.2 Industry Benchmark Comparison

**Purpose:** Compare the business's cost structure against industry averages to identify above-average spending categories.

**Technical Approach:**

- Source 1: Public data -- Korean Small Business Statistics (SMBA/public API)
- Source 2: Hyphen API benchmark data (if available)
- Source 3: Internal anonymized aggregates (future -- when sufficient user base)
- Compare cost ratios: (category_cost / total_revenue) vs. industry average ratio

**Key Outputs:**

- Category-by-category benchmark table
  - Example: "Food cost ratio: Your business 35% vs. Industry average 30% -- 5%p gap = ~500,000 KRW/month savings potential"
- Labor cost analysis
  - Example: "Labor ratio: Your business 28% vs. Industry average 25% -- consider peak-hour staffing optimization"
- Utility and overhead comparison
  - Example: "Utility costs: Your business 4.2% vs. Industry average 3.8% -- within normal range"

**Benchmark Categories:**

| Category | Industry Average Source | Comparison Method |
|----------|----------------------|-------------------|
| Food/ingredient cost | SMBA statistics + Hyphen | % of revenue |
| Labor cost | SMBA statistics | % of revenue |
| Rent | Regional real estate data | Absolute + % of revenue |
| Platform commissions | Hyphen delivery data | % of delivery revenue |
| Utilities | SMBA statistics | % of revenue |
| Supplies/consumables | SMBA statistics | % of revenue |

**Limitations:**

- Industry averages are approximations; variation is significant by region and business size
- Initial launch may use hardcoded benchmark data from public reports
- Benchmark accuracy improves as sajang.ai user base grows (anonymized aggregation)

### 3.3 Specific Cost Reduction Recommendations

**Purpose:** Generate actionable, prioritized cost reduction suggestions ranked by potential savings amount.

**Technical Approach:**

- Claude AI generates recommendations based on:
  - Detected leaks from 3.1
  - Benchmark gaps from 3.2
  - Business context (industry type, size, location)
- Each recommendation includes: action, estimated monthly savings, difficulty level, trade-offs

**Recommendation Categories:**

1. **Supplier Consolidation**
   - Example: "Currently purchasing from 3 suppliers. Consolidating to 1 primary supplier could unlock 5-10% volume discount"
   - Difficulty: Medium | Estimated savings: 50,000-100,000 KRW/month

2. **Billing Cycle Optimization**
   - Example: "CCTV service: 29,000 KRW/month. Annual billing option: 20% discount = 70,000 KRW/year savings"
   - Difficulty: Low | Estimated savings: 5,800 KRW/month

3. **Platform Fee Optimization**
   - Example: "Baemin One commission: 6.8%. Switching high-volume items to store delivery: 2% commission (rider cost offset needed)"
   - Difficulty: High | Estimated savings: varies

4. **Subscription Audit**
   - Example: "3 unused subscriptions detected totaling 127,000 KRW/month. Cancel to save 1,524,000 KRW/year"
   - Difficulty: Low | Estimated savings: 127,000 KRW/month

5. **Bulk Purchase Opportunities**
   - Example: "Paper supplies: weekly purchase of 25,000 KRW. Monthly bulk order from wholesale: 60,000 KRW (40% savings)"
   - Difficulty: Low | Estimated savings: 40,000 KRW/month

**Priority Ranking:**

- Sort by estimated monthly savings (highest first)
- Secondary sort by difficulty (lowest first)
- Highlight "quick wins" -- high savings + low difficulty

### 3.4 Savings Tracking & Execution

**Purpose:** Let owners accept/reject recommendations and track actual savings over time.

**User Flow:**

1. Owner views recommendation cards with estimated savings
2. Owner taps "Accept" or "Reject" (with optional reason)
3. Accepted recommendations tracked in `cost_actions` table
4. Monthly comparison: actual spending in that category vs. pre-action baseline
5. Cumulative savings dashboard shows total impact

**Key Outputs:**

- Action tracking UI
  - Example: "3 recommendations accepted last month. Actual savings: 470,000 KRW (vs. estimated 520,000 KRW)"
- Annual savings projection
  - Example: "If current savings rate continues: 5,640,000 KRW saved this year"
- Savings history chart (monthly cumulative)

**Measurement Methodology:**

- Baseline: 3-month average spending in category before action
- Measurement period: 30 days after action taken
- Statistical significance: flag if savings < 50% of estimate (recommendation may need revision)
- Exclude seasonal variations by comparing year-over-year when possible

### 3.5 Partner Network (Future Feature)

**Purpose:** Connect business owners with vetted suppliers offering better prices through sajang.ai partnership.

**Business Model:**

```
Supplier  --[lower price]--> Business Owner (saves money)
Supplier  --[commission]---> sajang.ai (new revenue stream)
Owner     --[stays subscribed]--> sajang.ai (retention)
```

**Planned Features:**

- Partner supplier directory by category (ingredients, packaging, equipment)
- Price comparison: current supplier vs. sajang.ai partner price
- One-click inquiry/order through partner link
- Commission tracking for sajang.ai revenue

**Implementation Notes:**

- This is a future revenue diversification feature
- Requires business development to onboard supplier partners
- Technical implementation: partner catalog table, referral tracking, commission calculation
- Privacy: never share individual business spending data with partners

---

## 4. Data Model Changes

### New Tables

```sql
-- Detected cost leaks
CREATE TABLE cost_leaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  leak_type TEXT NOT NULL,  -- 'anomaly', 'duplicate', 'unused_subscription', 'recurring_waste'
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_monthly_savings BIGINT,
  severity TEXT NOT NULL DEFAULT 'medium',  -- 'high', 'medium', 'low'
  status TEXT NOT NULL DEFAULT 'active',  -- 'active', 'dismissed', 'resolved'
  data_snapshot JSONB,  -- raw data supporting the detection
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT no_duplicate_active_leak UNIQUE (business_id, leak_type, category, status)
);

-- Cost reduction recommendations
CREATE TABLE cost_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  leak_id UUID REFERENCES cost_leaks(id),  -- optional link to detected leak
  recommendation_type TEXT NOT NULL,  -- 'supplier_consolidation', 'billing_optimization', 'platform_fee', 'subscription_audit', 'bulk_purchase'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_steps TEXT[] NOT NULL,  -- ordered list of steps to take
  estimated_monthly_savings BIGINT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',  -- 'low', 'medium', 'high'
  trade_offs TEXT,  -- what owner gives up
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected', 'completed'
  accepted_at TIMESTAMPTZ,
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Savings tracking for accepted recommendations
CREATE TABLE cost_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES cost_recommendations(id),
  measurement_month TEXT NOT NULL,  -- '2026-03' format
  baseline_amount BIGINT NOT NULL,  -- 3-month avg before action
  actual_amount BIGINT NOT NULL,  -- actual spending this month
  savings_amount BIGINT GENERATED ALWAYS AS (baseline_amount - actual_amount) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(recommendation_id, measurement_month)
);

-- Industry benchmarks (admin-managed reference data)
CREATE TABLE industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_code TEXT NOT NULL,  -- Korean standard industry classification
  industry_name TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'food_cost', 'labor', 'rent', 'utilities', 'supplies', 'platform_fees'
  avg_ratio NUMERIC(5,4) NOT NULL,  -- e.g., 0.3000 = 30%
  source TEXT NOT NULL,  -- 'SMBA_2025', 'Hyphen_API', 'internal_aggregate'
  year INTEGER NOT NULL,
  region TEXT,  -- optional regional breakdown
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(industry_code, category, source, year, region)
);
```

### RLS Policies

- `cost_leaks`, `cost_recommendations`, `cost_savings`: business_id-based isolation
- `industry_benchmarks`: read-only for all authenticated users (reference data)

---

## 5. API Design (Server Actions)

| Action | Path | Description |
|--------|------|-------------|
| `detectCostLeaks` | `src/lib/actions/cost-analysis.ts` | Run leak detection algorithms for a business |
| `getLeaks` | `src/lib/actions/cost-analysis.ts` | List active cost leaks |
| `dismissLeak` | `src/lib/actions/cost-analysis.ts` | Dismiss a detected leak |
| `getBenchmarkComparison` | `src/lib/actions/cost-benchmark.ts` | Get industry benchmark comparison |
| `getRecommendations` | `src/lib/actions/cost-recommendations.ts` | List cost reduction recommendations |
| `respondToRecommendation` | `src/lib/actions/cost-recommendations.ts` | Accept/reject a recommendation |
| `getSavingsSummary` | `src/lib/actions/cost-savings.ts` | Get cumulative savings dashboard data |
| `measureSavings` | `src/lib/actions/cost-savings.ts` | Calculate actual savings for a recommendation |

---

## 6. UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| `CostLeakAlerts` | `src/components/analysis/cost-leak-alerts.tsx` | Active leak notification cards |
| `BenchmarkComparisonChart` | `src/components/analysis/benchmark-comparison-chart.tsx` | Radar or bar chart vs. industry avg |
| `RecommendationCards` | `src/components/analysis/recommendation-cards.tsx` | Accept/reject UI with savings estimate |
| `SavingsDashboard` | `src/components/analysis/savings-dashboard.tsx` | Cumulative savings tracker |
| `SavingsHistoryChart` | `src/components/analysis/savings-history-chart.tsx` | Monthly savings trend (Recharts) |
| `CostCategoryBreakdown` | `src/components/analysis/cost-category-breakdown.tsx` | Pie/donut chart with benchmark overlay |
| `QuickWinsBadge` | `src/components/analysis/quick-wins-badge.tsx` | Highlight high-impact low-effort items |

---

## 7. Implementation Milestones

### Primary Goal: Cost Leak Detection

- Implement category anomaly detection algorithm
- Implement duplicate payment detection
- Implement recurring charge detection with usage cross-reference
- Build CostLeakAlerts UI component
- Integrate detection with SERI agent prompts
- Create cost_leaks table and RLS policies

### Secondary Goal: Industry Benchmarking + Recommendations

- Create industry_benchmarks table with initial data from public sources
- Implement category-level cost ratio comparison
- Build BenchmarkComparisonChart component
- Implement Claude AI recommendation generation
- Build RecommendationCards with accept/reject flow
- Create cost_recommendations table

### Tertiary Goal: Savings Tracking

- Create cost_savings table with generated column
- Implement baseline calculation (3-month pre-action average)
- Build monthly savings measurement job
- Create SavingsDashboard and SavingsHistoryChart
- Build annual savings projection

### Optional Goal: Partner Network Foundation

- Design partner catalog data model
- Build basic partner directory UI
- Implement referral tracking
- Commission calculation logic (admin-facing)

---

## 8. Technical Considerations

### Performance

- Leak detection runs as background job, not blocking UI
- Cache benchmark data with 24-hour TTL (industry averages change slowly)
- Savings calculation runs monthly as scheduled job
- Pre-aggregate category totals for fast comparison queries

### AI Integration

- Claude AI (Sonnet) generates:
  - Natural language leak descriptions from raw anomaly data
  - Specific reduction recommendations with actionable steps
  - Trade-off analysis for each recommendation
- Prompt template includes: business type, current cost structure, detected leaks, benchmark gaps
- Structured JSON output for consistent UI rendering
- Prompt caching for repeated analysis patterns

### Data Quality

- Minimum 60 days of expense data for leak detection
- Minimum 90 days for reliable benchmark comparison
- Graceful degradation: show partial insights with data sufficiency indicators
- Data completeness score: warn if expense recording appears inconsistent

### Privacy & Security

- All analysis is per-business; no cross-business data visible
- Industry benchmarks are anonymized aggregates only
- RLS policies enforce strict business-level isolation
- Partner network never exposes individual business spending to suppliers
- Leak detection data encrypted at rest (standard Supabase encryption)

---

## 9. Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| SPEC-REVENUE-001 (Revenue Growth Engine) | Soft dependency (shared analysis page) | Planned |
| SPEC-SERI-002 (SERI Agent Core) | Prerequisite | In Progress |
| SPEC-DATA-001 (Revenue/Expense CRUD) | Prerequisite | Complete |
| SPEC-DASHBOARD-001 (KPI Dashboard) | Prerequisite | Complete |
| Korean SMBA statistics data | External | Available (public API) |
| Hyphen benchmark data | External | Availability TBD |

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Insufficient expense data for analysis | Medium | High | Show data sufficiency indicator; require 60-day minimum |
| Industry benchmark data inaccuracy | Medium | Medium | Use multiple sources; display confidence level; allow manual override |
| False positive leak detection | Medium | Medium | Tunable thresholds; dismiss functionality; learn from dismissals |
| Savings measurement inaccuracy | Medium | Low | Use statistical comparison with confidence intervals; flag uncertain results |
| Duplicate detection false positives | Low | Medium | Require same merchant + same amount + close date; show as "verify" not "confirmed" |
| Partner network business development | High | Low | Defer to future phase; core features work without partners |

---

## 11. Success Metrics

- **Engagement:** 50%+ of active users view cost analysis at least once per month
- **Detection accuracy:** False positive rate < 20% (measured by dismiss rate)
- **Adoption:** 40%+ of recommendations accepted by owners
- **Actual savings:** Average accepted recommendation delivers >= 60% of estimated savings
- **Retention impact:** Users who accept recommendations have 20%+ higher renewal rate
- **Revenue (future):** Partner network generates supplemental revenue within 6 months of launch
