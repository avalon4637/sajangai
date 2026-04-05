# SPEC-SERI-001: Seri Page Financial Enhancement -- Survival Score + Cashflow + Cost Drilldown

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-SERI-001 |
| Title | Seri Page Financial Enhancement: Survival Score Gauge + Cashflow Real Data + Cost Drilldown |
| Phase | Post-Phase 4 (Enhancement) |
| Priority | High (user retention feature) |
| Dependencies | SPEC-UI-003 (completed), monthly_summaries, expenses, revenues, expense_categories tables |
| Status | Planned |

## Problem Statement

The Seri (/analysis) page was recently redesigned with P&L cards, green theme, cost breakdown, and AI narrative panel. However three critical financial visibility gaps remain:

1. **Survival Score has no UI** -- The scoring logic exists in `src/lib/insights/scenarios/` (d1-cash-depletion, d2-breakeven) and a `SurvivalScoreWidget` exists in the dashboard, but the Seri analysis page itself has no dedicated gauge showing the business health score with factor-level detail.
2. **Cashflow forecast uses mock data** -- `src/components/seri/cashflow-forecast.tsx` calculates projections from a hardcoded `dailyAvg * 0.28` net margin estimate instead of actual financial records.
3. **Cost breakdown is static** -- `src/components/seri/cost-breakdown.tsx` shows 4 hardcoded categories with fixed ratios instead of real expense data with drilldown capability.

---

## Environment

- **Framework**: Next.js 16 (React 19, App Router, Server Components)
- **Database**: Supabase (PostgreSQL) with RLS
- **UI**: shadcn/ui (new-york), Tailwind CSS 4.x, Recharts
- **Agent Color**: Seri green theme (#10B981)
- **Existing Tables**: `revenues`, `expenses`, `fixed_costs`, `monthly_summaries`, `expense_categories`, `labor_records`
- **Existing Types**: `MonthlyAnalysisSummary` (src/lib/queries/daily-revenue.ts), `SurvivalScoreBreakdown` (src/types/dashboard.ts)

## Assumptions

- A1: The `monthly_summaries` table contains `gross_margin` and `net_profit` fields that can be used for score calculation.
- A2: The `expense_categories` table (migration 00008) with `major_category` / `sub_category` hierarchy is available and seeded with default 9 major categories.
- A3: The `expenses` table has a `category` field that maps to `expense_categories.major_category`.
- A4: The existing `calculateSurvivalScoreBreakdown()` in `src/types/dashboard.ts` can be reused or adapted for the Seri page gauge.
- A5: Users have at least 1 month of financial data for meaningful score calculation; graceful fallback for insufficient data.

---

## Requirements

### Feature 1: Survival Score Gauge UI

**R1.1** (Ubiquitous)
The system shall display a survival score (0-100) as a half-circle SVG gauge on the Seri analysis page hero area.

**R1.2** (Event-Driven)
WHEN the analysis page loads with the selected month's data, THEN the system shall calculate and render the survival score using the 5-factor formula:
- Profitability (30 pts): profitMargin >= 20% -> 30, >= 15% -> 25, >= 10% -> 20, >= 5% -> 15, >= 0 -> 10, else 0
- Fixed Cost Stability (25 pts): fixedCostRatio <= 25% -> 25, <= 30% -> 20, <= 40% -> 15, <= 50% -> 10, else 5
- Labor Appropriateness (20 pts): laborRatio <= 20% -> 20, <= 25% -> 16, <= 30% -> 12, <= 35% -> 8, else 4
- Cash Liquidity (15 pts): cashRunway >= 6mo -> 15, >= 3 -> 12, >= 2 -> 8, >= 1 -> 4, else 0
- Growth (10 pts): revenueGrowth >= 10% -> 10, >= 5% -> 8, >= 0 -> 6, >= -5% -> 4, else 2

**R1.3** (Event-Driven)
WHEN the score is calculated, THEN the system shall display a letter grade badge: A (81-100), B (61-80), C (41-60), D (21-40), F (0-20).

**R1.4** (Event-Driven)
WHEN both current and previous month data exist, THEN the system shall show a delta indicator displaying the point difference from the previous month.

**R1.5** (Event-Driven)
WHEN the gauge renders, THEN 5 horizontal factor bars shall appear below the gauge showing each factor's individual score and label.

**R1.6** (State-Driven)
IF the user has less than 1 month of revenue data, THEN the system shall display an empty state message instead of the gauge.

### Feature 2: Cashflow Forecast Real Data Connection

**R2.1** (Ubiquitous)
The cashflow forecast component shall calculate projections from real financial data instead of mock estimates.

**R2.2** (Event-Driven)
WHEN the analysis page server component loads, THEN it shall query the last 3 months of revenues and expenses to calculate:
- Current estimated cash position (cumulative revenue - cumulative expenses)
- Monthly burn rate (3-month expense average)
- Monthly income (3-month revenue average)
- Net monthly cashflow (income - burn)

**R2.3** (Ubiquitous)
The system shall display 3 forecast scenarios for 30/60/90 day horizons:
- Baseline: current trend continues (net cashflow * months)
- Pessimistic: revenue reduced by 10%
- Optimistic: revenue increased by 10%

**R2.4** (State-Driven)
IF the baseline 3-month (90-day) projection results in a negative cash position, THEN the system shall display a warning badge with alert text.

**R2.5** (State-Driven)
IF fewer than 2 months of historical data exist, THEN the forecast shall use available data with a reduced confidence notice.

### Feature 3: Cost Drilldown Ranking

**R3.1** (Ubiquitous)
The cost breakdown component shall display real expense data grouped by major categories from the `expense_categories` table.

**R3.2** (Event-Driven)
WHEN the cost breakdown loads, THEN the system shall show major categories (up to 9): fixed costs, labor, ingredients, consumables, operations, marketing, commissions, taxes, representative education.

**R3.3** (Event-Driven)
WHEN the user clicks a major category row, THEN the view shall drill down to show sub-category items within that major category.

**R3.4** (Ubiquitous)
Each cost item (major or sub) shall display: amount, percentage of total expense, a progress bar, and a delta value compared to the previous month.

**R3.5** (Event-Driven)
WHEN the user clicks the back/collapse control in drilldown view, THEN the system shall return to the major category overview.

**R3.6** (State-Driven)
IF no expenses exist for the selected month, THEN the component shall display an empty state with a prompt to add expenses.

### Unwanted Behavior

**R-U1** The system shall NOT hardcode cost category ratios; all data must come from the database.

**R-U2** The system shall NOT display the cashflow forecast with mock multipliers (`dailyAvg * 0.28`).

**R-U3** The system shall NOT make additional client-side API calls for data that can be fetched in the server component.

---

## Exclusions (What NOT to Build)

- Shall NOT support multi-month trend charts for survival score (reason: separate future SPEC for historical scoring)
- Shall NOT implement score notifications or alerts to external channels (reason: belongs to insight engine SPEC-KICK-001)
- Shall NOT build expense entry/editing within the drilldown view (reason: expense CRUD is handled by existing data entry pages)
- Shall NOT implement PDF export of the survival report (reason: out of scope, future enhancement)
- Will NOT be optimized for real-time data streaming (reason: monthly batch data is sufficient for analysis page)

---

## Architecture

### New Files

```
src/components/seri/survival-gauge.tsx          # SVG half-circle gauge with factor bars
src/lib/kpi/survival-score.ts                   # Pure calculation: inputs -> SurvivalScore result
```

### Modified Files

```
src/components/seri/cashflow-forecast.tsx        # Replace mock data with real CashflowData props
src/components/seri/cost-breakdown.tsx           # Replace hardcoded categories with DB data + drilldown
src/app/(dashboard)/analysis/page.tsx            # Add server-side data fetching (expenses, summaries)
src/app/(dashboard)/analysis/page-client.tsx     # Integrate survival gauge, pass new data props
```

### Data Flow

```
Server Component (page.tsx)
  |-- fetch revenues (last 3 months)
  |-- fetch expenses (current + previous month, grouped by category)
  |-- fetch monthly_summaries (current + previous)
  |-- fetch expense_categories (for hierarchy)
  |-- calculate survival score (via survival-score.ts)
  |-- calculate cashflow projections
  v
Client Component (page-client.tsx)
  |-- <SurvivalGauge score={...} breakdown={...} delta={...} />
  |-- <CashflowForecast data={cashflowData} />
  |-- <CostBreakdown expenses={expenses} categories={categories} prevExpenses={prevExpenses} />
```

### Type Definitions

```typescript
// src/lib/kpi/survival-score.ts
interface SurvivalScoreInput {
  totalRevenue: number;
  totalExpense: number;
  fixedCosts: number;
  laborCosts: number;
  cashBalance: number;
  monthlyBurnRate: number;
  previousMonthRevenue: number | null;
}

interface SurvivalScoreResult {
  total: number;                      // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  factors: {
    profitability: { score: number; max: 30; ratio: number };
    fixedCostStability: { score: number; max: 25; ratio: number };
    laborAppropriateness: { score: number; max: 20; ratio: number };
    cashLiquidity: { score: number; max: 15; runway: number };
    growth: { score: number; max: 10; growthRate: number };
  };
}

// Cashflow forecast data passed from server
interface CashflowData {
  currentCash: number;
  monthlyIncome: number;
  monthlyBurn: number;
  netMonthlyCashflow: number;
  scenarios: {
    baseline: { day30: number; day60: number; day90: number };
    pessimistic: { day30: number; day60: number; day90: number };
    optimistic: { day30: number; day60: number; day90: number };
  };
  isNegativeAt90Days: boolean;
  dataMonths: number;  // how many months of real data used
}

// Cost breakdown data passed from server
interface CostCategoryData {
  majorCategory: string;
  totalAmount: number;
  percentage: number;
  delta: number | null;        // vs previous month (percentage change)
  subCategories: {
    name: string;
    amount: number;
    percentage: number;
    delta: number | null;
  }[];
}
```

---

## Milestones

### M1: Survival Score Gauge (Primary Goal)

| Task | Description |
|------|-------------|
| M1.1 | Create `src/lib/kpi/survival-score.ts` with pure calculation function |
| M1.2 | Create `src/components/seri/survival-gauge.tsx` with SVG half-circle gauge |
| M1.3 | Add factor bar visualization (5 horizontal bars below gauge) |
| M1.4 | Add grade badge (A/B/C/D/F) and delta indicator |
| M1.5 | Integrate into page-client.tsx hero area |
| M1.6 | Add server-side data fetching for monthly_summaries in page.tsx |

### M2: Cashflow Forecast Real Data (Secondary Goal)

| Task | Description |
|------|-------------|
| M2.1 | Add 3-month revenue/expense fetching to page.tsx server component |
| M2.2 | Implement cashflow calculation logic (burn rate, income avg, projections) |
| M2.3 | Refactor CashflowForecast component to accept CashflowData props |
| M2.4 | Add 3-scenario display (baseline, pessimistic, optimistic) |
| M2.5 | Add negative balance warning badge |
| M2.6 | Handle insufficient data graceful fallback |

### M3: Cost Drilldown Ranking (Final Goal)

| Task | Description |
|------|-------------|
| M3.1 | Add expense category + expense data fetching to page.tsx |
| M3.2 | Refactor CostBreakdown to accept real expense data props |
| M3.3 | Implement major category ranking view with real amounts |
| M3.4 | Add click-to-drilldown interaction for sub-categories |
| M3.5 | Add previous month delta comparison per category |
| M3.6 | Handle empty state when no expenses exist |

### Implementation Order

M1 -> M2 -> M3 (sequential; each milestone adds data fetching to the shared server component)

---

## Acceptance Criteria

### Feature 1: Survival Score Gauge

```gherkin
Scenario: Display survival score gauge with full data
  Given the user has revenue, expense, and fixed cost records for the current month
  And the user has previous month data for comparison
  When the analysis page loads
  Then a half-circle SVG gauge displays the survival score (0-100)
  And a letter grade badge (A/B/C/D/F) appears next to the score
  And 5 factor bars show individual scores for profitability, fixed cost, labor, cash, growth
  And a delta indicator shows the point change from the previous month

Scenario: Score calculation matches formula
  Given totalRevenue = 10,000,000 and totalExpense = 7,500,000 (profitMargin 25%)
  And fixedCosts = 2,000,000 (fixedCostRatio 20%)
  And laborCosts = 1,500,000 (laborRatio 15%)
  And cashRunway = 4 months
  And revenueGrowth = 8%
  When the survival score is calculated
  Then profitability = 30, fixedCostStability = 25, laborAppropriateness = 20, cashLiquidity = 12, growth = 8
  And total score = 95, grade = A

Scenario: Insufficient data fallback
  Given the user has no revenue data for the selected month
  When the analysis page loads
  Then the survival gauge area shows an empty state message
  And no score or grade is displayed
```

### Feature 2: Cashflow Forecast

```gherkin
Scenario: Display cashflow forecast with real data
  Given the user has 3 months of revenue and expense history
  When the analysis page loads
  Then the cashflow forecast shows 30/60/90 day projections
  And 3 scenarios appear: baseline, pessimistic (-10%), optimistic (+10%)
  And the data source is the last 3 months average, not hardcoded values

Scenario: Negative cash warning
  Given the user's monthly expenses exceed monthly revenues
  And the baseline 90-day projection results in negative cash
  When the analysis page loads
  Then a warning badge appears on the cashflow forecast card
  And the 90-day pessimistic row is highlighted in red

Scenario: Limited historical data
  Given the user has only 1 month of financial history
  When the cashflow forecast renders
  Then projections use the single month's data
  And a notice reads "1 month of data available -- accuracy improves with more history"
```

### Feature 3: Cost Drilldown

```gherkin
Scenario: Major category ranking from real data
  Given the user has expenses categorized into labor, ingredients, and rent
  When the cost breakdown component loads
  Then each category shows real summed amounts from the expenses table
  And percentage of total expense is calculated from actual totals
  And categories are sorted by amount descending

Scenario: Drilldown to sub-categories
  Given the cost breakdown shows major categories
  When the user clicks on "ingredients" major category
  Then the view expands to show sub-categories within ingredients
  And each sub-category shows amount, percentage, and delta vs previous month

Scenario: Previous month comparison
  Given the user has expense data for both current and previous months
  When the cost breakdown renders
  Then each category shows a delta indicator (increase/decrease percentage)
  And positive deltas show in red, negative deltas show in green

Scenario: No expense data
  Given the user has no expenses for the selected month
  When the cost breakdown component loads
  Then an empty state message appears with guidance to add expenses
```

---

## Testing Strategy

- **Unit**: `survival-score.ts` -- test all score boundary conditions with table-driven tests
- **Unit**: Cashflow calculation logic -- test 3-scenario projection math
- **Component**: SurvivalGauge -- render with various scores, verify SVG arc, grade badge, factor bars
- **Component**: CashflowForecast -- render with CashflowData, verify scenario rows, warning badge
- **Component**: CostBreakdown -- render with real data, verify drilldown click behavior
- **Integration**: Server component data flow -- verify page.tsx fetches and passes correct props

## Success Metrics

| Metric | Target |
|--------|--------|
| Survival score renders | Score visible on /analysis page |
| Cashflow uses real data | No hardcoded multipliers remain |
| Cost drilldown works | Click major -> sub-categories expand |
| Score calculation accuracy | Unit tests pass for all boundary values |
| Empty state handling | Graceful fallback for all 3 features |
| Page load performance | No additional network requests from client |
