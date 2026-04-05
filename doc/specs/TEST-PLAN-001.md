# TEST-PLAN-001: Comprehensive Test Plan for sajang.ai

**Status**: Approved
**Target Coverage**: 80%+ lib/, 60%+ components/
**Framework**: Vitest + @testing-library/react
**Total Test Suites**: 5 (parallelizable)
**Estimated Test Cases**: ~210

---

## Table of Contents

1. [Global Test Infrastructure](#global-test-infrastructure)
2. [Suite 1: KPI & Financial Logic (Unit Tests)](#suite-1-kpi--financial-logic-unit-tests)
3. [Suite 2: API Routes Security & Correctness (Integration Tests)](#suite-2-api-routes-security--correctness-integration-tests)
4. [Suite 3: Data Queries & Server Actions (Integration Tests)](#suite-3-data-queries--server-actions-integration-tests)
5. [Suite 4: Component Rendering (Component Tests)](#suite-4-component-rendering-component-tests)
6. [Suite 5: Page Integration & Navigation (Smoke Tests)](#suite-5-page-integration--navigation-smoke-tests)

---

## Global Test Infrastructure

### Existing Setup

- `vitest.config.ts`: jsdom environment, `@testing-library/jest-dom/vitest` via `src/test/setup.ts`
- Path alias `@/` mapped to `./src`
- 11 existing test files (calculator, simulation, insights, csv, validations, auth pages, roi, scenarios)

### Shared Mock Utilities (to create)

**File**: `src/test/mocks/supabase.ts`

```typescript
// Shared Supabase mock factory used across Suite 2, 3, 4, 5
// Creates a chainable mock that simulates Supabase query builder
export function createMockSupabaseClient(overrides?: Partial<MockSupabaseClient>)
export function mockAuthUser(user: { id: string; email: string } | null)
export function mockQueryResult(data: unknown[], error?: { message: string } | null)
```

**File**: `src/test/mocks/next.ts`

```typescript
// Mock next/navigation, next/headers for component/page tests
export function mockRouter()
export function mockSearchParams()
```

**File**: `src/test/fixtures/business.ts`

```typescript
// Reusable test data based on seed.sql (chicken shop)
export const TEST_BUSINESS_ID = "test-biz-uuid"
export const TEST_USER_ID = "test-user-uuid"
export const TEST_BUSINESS = { id: TEST_BUSINESS_ID, name: "맛있는 치킨집", ... }
```

### Run Commands

```bash
# Run all suites in parallel
npx vitest run

# Run individual suite
npx vitest run src/lib/kpi/ src/lib/simulation/ src/lib/roi/ src/lib/insights/ src/lib/ai/  # Suite 1
npx vitest run src/app/api/                                                                   # Suite 2
npx vitest run src/lib/queries/ src/lib/actions/                                              # Suite 3
npx vitest run src/components/                                                                 # Suite 4
npx vitest run src/app/\(dashboard\)/ src/app/\(legal\)/ src/app/auth/                       # Suite 5
```

---

## Suite 1: KPI & Financial Logic (Unit Tests)

**Owner**: Sub-agent 1
**Focus**: Pure functions, zero external dependencies, no mocking needed
**Priority**: P0 (all tests must pass for deploy)
**Coverage Target**: 95%+ for all files in this suite

### 1.1 Survival Score (5-Factor)

**File**: `src/lib/kpi/survival-score.test.ts`
**Source**: `src/lib/kpi/survival-score.ts`
**Existing tests**: None

```
describe('calculateSurvivalScore')
  describe('zero revenue edge case')
    it('should return total=0, grade=F when totalRevenue is 0')
    it('should return all factor scores as 0 when totalRevenue is 0')

  describe('profitability factor (30pts)')
    it('should score 30 when profitMargin >= 20%')
    it('should score 25 when profitMargin >= 15% and < 20%')
    it('should score 20 when profitMargin >= 10% and < 15%')
    it('should score 15 when profitMargin >= 5% and < 10%')
    it('should score 10 when profitMargin >= 0% and < 5%')
    it('should score 0 when profitMargin < 0%')
    it('should calculate profitMargin as (revenue - expense) / revenue * 100')

  describe('fixedCostStability factor (25pts)')
    it('should score 25 when fixedCostRatio <= 25%')
    it('should score 20 when fixedCostRatio <= 30%')
    it('should score 15 when fixedCostRatio <= 40%')
    it('should score 10 when fixedCostRatio <= 50%')
    it('should score 5 (default) when fixedCostRatio > 50%')

  describe('laborAppropriateness factor (20pts)')
    it('should score 20 when laborRatio <= 20%')
    it('should score 16 when laborRatio <= 25%')
    it('should score 12 when laborRatio <= 30%')
    it('should score 8 when laborRatio <= 35%')
    it('should score 4 (default) when laborRatio > 35%')

  describe('cashLiquidity factor (15pts)')
    it('should score 15 when runway >= 6 months')
    it('should score 12 when runway >= 3 months')
    it('should score 8 when runway >= 2 months')
    it('should score 4 when runway >= 1 month')
    it('should score 0 when runway < 1 month')
    it('should treat runway as 12 when burnRate=0 and cashBalance>0')
    it('should treat runway as 0 when burnRate=0 and cashBalance<=0')

  describe('growth factor (10pts)')
    it('should score 10 when growthRate >= 10%')
    it('should score 8 when growthRate >= 5%')
    it('should score 6 when growthRate >= 0%')
    it('should score 4 when growthRate >= -5%')
    it('should score 2 (default) when growthRate < -5%')
    it('should score 2 (default) when previousMonthRevenue is null')
    it('should score 2 (default) when previousMonthRevenue is 0')

  describe('grade assignment')
    it('should assign grade A for total >= 81')
    it('should assign grade B for total >= 61 and < 81')
    it('should assign grade C for total >= 41 and < 61')
    it('should assign grade D for total >= 21 and < 41')
    it('should assign grade F for total < 21')

  describe('total score')
    it('should cap total at 100')
    it('should round total to 1 decimal place')
    it('should sum all 5 factor scores correctly')

  describe('realistic scenarios')
    it('should score well for healthy chicken shop (seed data scenario)')
    it('should score poorly for struggling shop with high fixed costs')
    it('should handle edge: very high revenue with minimal costs')
```

**Mocking**: None (pure function)
**Assertions**: Exact score values, grade strings, factor detail objects

### 1.2 KPI Calculator (existing, extend)

**File**: `src/lib/kpi/calculator.test.ts` (already 420 lines, extend only if gaps found)
**Source**: `src/lib/kpi/calculator.ts`
**Existing tests**: Comprehensive (basic calcs, zero handling, loss scenarios, weights, edges)

```
describe('calculateKpi - additional coverage')
  it('should handle negative inputs gracefully (negative expense)')
  it('should produce consistent results for same input (idempotent)')
```

**Status**: Mostly complete. Sub-agent should verify existing coverage and add only gaps.

### 1.3 Simulation Engine (existing, extend)

**File**: `src/lib/simulation/engine.test.ts` (extend)
**Source**: `src/lib/simulation/engine.ts`

```
describe('runSimulation')
  describe('employee_change')
    it('should increase labor cost by absolute value when isPercentage=false')
    it('should increase labor cost by percentage when isPercentage=true')
    it('should adjust totalFixedCost accordingly when labor changes')
    it('should not let totalLaborCost go below 0')

  describe('revenue_change')
    it('should increase revenue by absolute value')
    it('should increase revenue by percentage')
    it('should decrease revenue with negative value')
    it('should not let revenue go below 0')

  describe('rent_change')
    it('should increase non-labor fixed cost by absolute value')
    it('should increase non-labor fixed cost by percentage')
    it('should not let totalFixedCost go below totalLaborCost')

  describe('expense_change')
    it('should increase variable expense by absolute value')
    it('should decrease variable expense with negative value')
    it('should not let expense go below 0')

  describe('diff calculations')
    it('should correctly calculate netProfitDiff')
    it('should correctly calculate survivalScoreDiff')
    it('should correctly calculate grossMarginDiff')
    it('should correctly calculate laborRatioDiff')
    it('should correctly calculate fixedCostRatioDiff')
    it('should return zero diffs when simulation has no effect')
```

### 1.4 ROI Calculator (pure logic extraction)

**File**: `src/lib/roi/calculator.test.ts` (extend existing)
**Source**: `src/lib/roi/calculator.ts`

The `calculateMonthlyRoi` is async and uses Supabase. Sub-agent should:
1. Keep existing tests
2. Add tests for the `getNextMonth` helper (extract or test through public API)

```
describe('getNextMonth (tested via calculateMonthlyRoi mock)')
  it('should correctly advance from 2026-01 to 2026-02')
  it('should correctly roll over from 2026-12 to 2027-01')
  it('should handle single-digit months with zero padding')
```

### 1.5 Cashflow Predictor (helper functions)

**File**: `src/lib/ai/cashflow-predictor.test.ts`
**Source**: `src/lib/ai/cashflow-predictor.ts`

The `predictCashFlow` is async. Test pure helper functions:

```
describe('addBusinessDays')
  it('should skip weekends (Saturday and Sunday)')
  it('should add 1 business day from Friday to Monday')
  it('should add 2 business days from Thursday to Monday')
  it('should handle adding 0 days')
  it('should add 5 business days (one full work week)')

describe('getSettlementDelay')
  it('should return 2 for shinhan/신한')
  it('should return 3 for samsung/삼성')
  it('should return 3 for baemin/배민 (delivery)')
  it('should return 4 for yogiyo/요기요')
  it('should return 2 (default) for unknown channels')
  it('should return 2 (default) for null channel')
```

**Note**: These are private functions. Sub-agent should either:
- Export them for testing (preferred) OR
- Test through mock-based integration test of `predictCashFlow`

### 1.6 Profit Calculator (helper functions)

**File**: `src/lib/ai/profit-calculator.test.ts`
**Source**: `src/lib/ai/profit-calculator.ts`

```
describe('getCommissionRate')
  it('should return 0.068 for baemin1/배민1')
  it('should return 0.020 for baemin/배민/배달의민족')
  it('should return 0.098 for coupang/쿠팡')
  it('should return 0.125 for yogiyo/요기요')
  it('should return 0.068 for generic delivery/배달')
  it('should return 0.025 for card/카드')
  it('should return 0 for offline/unknown channels')
  it('should return 0 for null channel')
  it('should be case-insensitive')
  it('should ignore whitespace in channel names')
```

### 1.7 Daily Revenue Analysis (pure function)

**File**: `src/lib/queries/daily-revenue.test.ts`
**Source**: `src/lib/queries/daily-revenue.ts`

```
describe('calculateMonthlyAnalysis')
  it('should sum totalRevenue from all daily data')
  it('should count totalTransactions correctly')
  it('should calculate avgDailyRevenue (total / daysWithRevenue)')
  it('should calculate avgTransactionAmount (total / transactions)')
  it('should produce channelBreakdown sorted by amount descending')
  it('should aggregate channels across multiple days')
  it('should produce dayOfWeekAverage for all 7 days (Mon-Sun order)')
  it('should return 0 averages for days with no revenue')
  it('should handle empty daily data array')
  it('should handle single day of data')
  it('should use Korean day labels (일,월,화,수,목,금,토)')
```

### 1.8 Utility Functions

**File**: `src/lib/utils.test.ts`
**Source**: `src/lib/utils.ts`

```
describe('getLastDayOfMonth')
  it('should return 2026-01-31 for 2026-01')
  it('should return 2026-02-28 for 2026-02 (non-leap)')
  it('should return 2024-02-29 for 2024-02 (leap year)')
  it('should return 2026-04-30 for 2026-04')
  it('should return 2026-12-31 for 2026-12')

describe('validateYearMonth')
  it('should not throw for valid format 2026-04')
  it('should not throw for 2026-01 and 2026-12')
  it('should throw for invalid format 2026-13')
  it('should throw for invalid format 2026-00')
  it('should throw for invalid format 2026-1')
  it('should throw for random string')

describe('filterActiveFixedCosts')
  it('should include costs with no start/end dates')
  it('should include costs that start before month end')
  it('should include costs that end after month start')
  it('should exclude costs that end before month start')
  it('should exclude costs that start after month end')
  it('should return empty array when no costs match')

describe('cn')
  it('should merge Tailwind classes correctly')
  it('should handle conditional classes')
```

### 1.9 Rate Limiter

**File**: `src/lib/api/rate-limit.test.ts`
**Source**: `src/lib/api/rate-limit.ts`

```
describe('checkRateLimit')
  it('should allow first request')
  it('should allow requests up to limit')
  it('should block requests exceeding limit')
  it('should reset after window expires')
  it('should return correct remaining count')
  it('should return correct resetAt timestamp')
  it('should track different keys independently')
```

### 1.10 Encryption

**File**: `src/lib/hyphen/encryption.test.ts`
**Source**: `src/lib/hyphen/encryption.ts`

```
describe('encryptCredentials / decryptCredentials')
  it('should encrypt and decrypt a simple object')
  it('should encrypt and decrypt Korean text values')
  it('should produce different ciphertext for same input (random IV)')
  it('should fail to decrypt with tampered ciphertext')
  it('should fail to decrypt with tampered authTag')
  it('should handle empty credentials object')
  it('should handle credentials with many fields')
```

### 1.11 Insight Scenarios (extend existing)

**File**: `src/lib/insights/scenarios/scenarios.test.ts` (extend)
**Source**: `src/lib/insights/scenarios/*.ts`

```
describe('A1 Revenue Review scenario')
  it('should detect revenue drop > 15%')
  it('should return null when revenue is stable')

describe('A2 Channel Drop scenario')
  it('should detect channel revenue decline')

describe('B1 Channel Fees scenario')
  it('should detect high commission rates')
  it('should return null for reasonable fees')
```

---

## Suite 2: API Routes Security & Correctness (Integration Tests)

**Owner**: Sub-agent 2
**Focus**: Auth checks, input validation, IDOR protection, rate limiting
**Priority**: P0 (security-critical)
**Coverage Target**: 80%+ for all API routes

### Mocking Strategy

```typescript
// Every API route test file needs:
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// For AI routes additionally:
vi.mock("@ai-sdk/anthropic", () => ({ anthropic: vi.fn() }));
vi.mock("ai", () => ({ streamText: vi.fn(), stepCountIs: vi.fn() }));

// For billing routes:
vi.mock("@/lib/billing/subscription", () => ({
  activateSubscription: vi.fn(),
}));
```

### 2.1 Chat Route

**File**: `src/app/api/chat/route.test.ts`
**Source**: `src/app/api/chat/route.ts`

```
describe('POST /api/chat')
  describe('authentication')
    it('should return 401 when user is not authenticated')
    it('should return 401 when getUser returns null')

  describe('rate limiting')
    it('should return 429 when rate limit exceeded')
    it('should include Retry-After header on 429')

  describe('input validation')
    it('should return 400 when message is empty')
    it('should return 400 when message exceeds 1000 characters')
    it('should return 400 when businessId is not a valid UUID')
    it('should accept valid request body')

  describe('business ownership')
    it('should verify user owns the business')
    it('should proceed without profile when businessId not provided')

  describe('response format')
    it('should return streaming response with X-Session-Id header')
    it('should generate sessionId when not provided by client')
    it('should use client-provided sessionId')

  describe('error handling')
    it('should return 500 when ANTHROPIC_API_KEY is missing')
```

### 2.2 AI Route

**File**: `src/app/api/ai/route.test.ts`
**Source**: `src/app/api/ai/route.ts`

```
describe('POST /api/ai')
  describe('authentication')
    it('should return 401 when user is not authenticated')

  describe('rate limiting')
    it('should return 429 when rate limit exceeded')

  describe('input validation')
    it('should return 400 when kpiData is missing')
    it('should return 400 when kpiData has wrong types')
    it('should accept valid kpiData object')

  describe('error handling')
    it('should return 500 when ANTHROPIC_API_KEY is missing')
```

### 2.3 Reviews Reply Route (IDOR Protection)

**File**: `src/app/api/reviews/[id]/reply/route.test.ts`
**Source**: `src/app/api/reviews/[id]/reply/route.ts`

```
describe('PATCH /api/reviews/[id]/reply')
  describe('authentication')
    it('should return 401 when user is not authenticated')

  describe('input validation')
    it('should return 400 when aiReply is empty')
    it('should return 400 when aiReply exceeds 2000 characters')

  describe('IDOR protection')
    it('should return 404 when review does not exist')
    it('should return 403 when user does not own the business')
    it('should allow update when user owns the business')

  describe('successful update')
    it('should update ai_reply and set reply_status to draft')
    it('should return { success: true }')

  describe('error handling')
    it('should return 500 when database update fails')
```

### 2.4 Reviews Publish Route (IDOR Protection)

**File**: `src/app/api/reviews/[id]/publish/route.test.ts`
**Source**: `src/app/api/reviews/[id]/publish/route.ts`

```
describe('POST /api/reviews/[id]/publish')
  describe('authentication')
    it('should return 401 when user is not authenticated')

  describe('IDOR protection')
    it('should return 404 when review does not exist')
    it('should return 403 when user does not own the business')

  describe('business logic')
    it('should return 400 when review has no ai_reply')
    it('should return 400 when review is already published')
    it('should return 400 when review is already auto_published')
    it('should set reply_status to published on success')
    it('should return { success: true }')

  describe('error handling')
    it('should return 500 when database update fails')
```

### 2.5 Insights Act Route

**File**: `src/app/api/insights/act/route.test.ts`
**Source**: `src/app/api/insights/act/route.ts`

```
describe('POST /api/insights/act')
  describe('authentication')
    it('should return 401 when user is not authenticated')

  describe('input validation')
    it('should return 400 when insightId is missing')
    it('should return 400 when actionType is missing')

  describe('ownership verification')
    it('should return 404 when insight does not exist')
    it('should return 403 when business does not belong to user')

  describe('success')
    it('should call updateInsightStatus with acted')
    it('should call createActionResult')
    it('should return { success: true }')

  describe('error handling')
    it('should return 500 when updateInsightStatus throws')
```

### 2.6 Insights Dismiss Route

**File**: `src/app/api/insights/dismiss/route.test.ts`
**Source**: `src/app/api/insights/dismiss/route.ts`

```
describe('POST /api/insights/dismiss')
  describe('authentication')
    it('should return 401 when user is not authenticated')

  describe('ownership verification')
    it('should return 403 when business does not own insight')

  describe('success')
    it('should update insight status to dismissed')
```

### 2.7 Billing Subscribe Route

**File**: `src/app/api/billing/subscribe/route.test.ts`
**Source**: `src/app/api/billing/subscribe/route.ts`

```
describe('POST /api/billing/subscribe')
  describe('authentication')
    it('should return 401 when user is not authenticated')

  describe('input validation')
    it('should return 400 when body is invalid JSON')
    it('should return 400 when billingKey is missing')

  describe('business lookup')
    it('should return 404 when user has no business')

  describe('success')
    it('should call activateSubscription with business ID and billing key')
    it('should return success response')

  describe('error handling')
    it('should return error when activateSubscription fails')
```

### 2.8 Billing Cancel Route

**File**: `src/app/api/billing/cancel/route.test.ts`

```
describe('POST /api/billing/cancel')
  it('should return 401 when user is not authenticated')
  it('should cancel subscription for authenticated user')
```

### 2.9 Billing Status Route

**File**: `src/app/api/billing/status/route.test.ts`

```
describe('GET /api/billing/status')
  it('should return 401 when user is not authenticated')
  it('should return subscription status for authenticated user')
```

### 2.10 Billing Issue Billing Key Route

**File**: `src/app/api/billing/issue-billing-key/route.test.ts`

```
describe('POST /api/billing/issue-billing-key')
  it('should return 401 when user is not authenticated')
  it('should return billing key response')
```

### 2.11 Billing Webhook Route

**File**: `src/app/api/billing/webhook/route.test.ts`

```
describe('POST /api/billing/webhook')
  it('should process valid webhook payload')
  it('should reject invalid signatures')
```

### 2.12 Sync Route

**File**: `src/app/api/sync/route.test.ts`

```
describe('POST /api/sync')
  it('should return 401 when user is not authenticated')
  it('should trigger sync for authenticated user')
```

### 2.13 Classify Route

**File**: `src/app/api/classify/route.test.ts`

```
describe('POST /api/classify')
  it('should return 401 when user is not authenticated')
  it('should classify expense data')
  it('should return 400 for invalid input')
```

### 2.14 Feedback Route

**File**: `src/app/api/feedback/route.test.ts`

```
describe('POST /api/feedback')
  it('should return 401 when user is not authenticated')
  it('should save feedback')
```

### 2.15 Dapjangi Process Route

**File**: `src/app/api/dapjangi/process/route.test.ts`

```
describe('POST /api/dapjangi/process')
  it('should return 401 when user is not authenticated')
  it('should process review and generate AI reply')
  it('should apply rate limiting')
```

### 2.16 Dapjangi Voice Route

**File**: `src/app/api/dapjangi/voice/route.test.ts`

```
describe('POST /api/dapjangi/voice')
  it('should return 401 when user is not authenticated')
  it('should return brand voice settings')
```

### 2.17 Seri Report Route

**File**: `src/app/api/seri/report/route.test.ts`

```
describe('POST /api/seri/report')
  it('should return 401 when user is not authenticated')
  it('should generate financial report')
  it('should apply rate limiting')
```

### 2.18 Marketing Send Route

**File**: `src/app/api/marketing/send/route.test.ts`

```
describe('POST /api/marketing/send')
  it('should return 401 when user is not authenticated')
  it('should send marketing message')
  it('should validate message content')
```

### 2.19 Budgets Route

**File**: `src/app/api/budgets/route.test.ts`

```
describe('/api/budgets')
  it('should return 401 when user is not authenticated')
  it('should return budgets for GET')
  it('should create budget for POST')
```

### 2.20 Loans Route

**File**: `src/app/api/loans/route.test.ts`

```
describe('/api/loans')
  it('should return 401 when user is not authenticated')
  it('should return loans for GET')
```

### 2.21 Profile Preferences Route

**File**: `src/app/api/profile/preferences/route.test.ts`

```
describe('/api/profile/preferences')
  it('should return 401 when user is not authenticated')
  it('should return preferences for GET')
  it('should update preferences for PATCH')
```

### 2.22 Cron Routes

**File**: `src/app/api/cron/sync/route.test.ts`

```
describe('GET /api/cron/sync')
  it('should require cron secret header')
  it('should trigger batch sync')
```

**File**: `src/app/api/cron/daily-briefing/route.test.ts`

```
describe('GET /api/cron/daily-briefing')
  it('should require cron secret header')
  it('should generate daily briefings')
```

### Consistent Error Response Check (P1)

```
describe('All API routes error response consistency')
  it('should always return JSON content type on error')
  it('should include error field in error response body')
  it('should use Korean error messages for user-facing routes')
```

---

## Suite 3: Data Queries & Server Actions (Integration Tests)

**Owner**: Sub-agent 3
**Focus**: Supabase query construction, CRUD logic, data aggregation
**Priority**: P0 (data integrity critical)
**Coverage Target**: 85%+ for queries/, 75%+ for actions/

### Mocking Strategy

```typescript
// All tests mock createClient to return a chainable query builder
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Helper to verify query chain:
function expectQuery(mockClient: MockClient) {
  return {
    from: (table: string) => expect(mockClient.from).toHaveBeenCalledWith(table),
    select: (cols: string) => ...,
    eq: (col: string, val: string) => ...,
    // etc.
  };
}
```

### 3.1 Invoice Queries

**File**: `src/lib/queries/invoice.test.ts`
**Source**: `src/lib/queries/invoice.ts`

```
describe('getInvoices')
  it('should query invoices table with businessId filter')
  it('should apply status filter when provided')
  it('should apply type filter when provided')
  it('should apply both filters together')
  it('should order by issue_date descending')
  it('should return empty array when no results')
  it('should throw with Korean error message on query failure')

describe('createInvoice')
  it('should insert new invoice and return created row')
  it('should throw on insert failure')

describe('markAsPaid')
  it('should update status to paid and set paid_date')
  it('should throw on update failure')

describe('getOutstandingBalance')
  it('should query only pending and overdue invoices')
  it('should calculate totalReceivable from receivable type')
  it('should calculate totalPayable from payable type')
  it('should count overdueCount correctly')
  it('should return zeros when no outstanding invoices')
  it('should throw on query failure')

describe('getOverdueInvoices')
  it('should query pending invoices past due_date')
  it('should order by due_date ascending')
  it('should use today date for comparison')

describe('updateOverdueStatuses')
  it('should update pending invoices past due_date to overdue')
  it('should return count of updated records')
  it('should return 0 when no records to update')
```

### 3.2 Vendor Queries

**File**: `src/lib/queries/vendor.test.ts`
**Source**: `src/lib/queries/vendor.ts`

```
describe('getVendors')
  it('should query vendors filtered by businessId')
  it('should order by name ascending')
  it('should return empty array when no vendors')
  it('should throw on query failure')

describe('createVendor')
  it('should insert and return new vendor')
  it('should throw on insert failure')

describe('updateVendor')
  it('should update vendor by id and return updated row')
  it('should throw on update failure')

describe('deleteVendor')
  it('should delete vendor by id')
  it('should throw on delete failure')

describe('findOrCreateVendor')
  it('should return existing vendor when name matches')
  it('should create new vendor when name not found')
  it('should use exact name match for search')
  it('should throw on search failure')
  it('should throw on create failure')
```

### 3.3 Connection Queries

**File**: `src/lib/queries/connection.test.ts`
**Source**: `src/lib/queries/connection.ts`

```
describe('getConnections')
  it('should query api_connections by businessId')
  it('should order by created_at descending')
  it('should return empty array on error (soft fail)')
  it('should return empty array when no connections')

describe('getConnectionByType')
  it('should query by businessId and connectionType')
  it('should return null when not found')
  it('should return null on error (soft fail)')

describe('getSyncLogs')
  it('should query sync_logs by connectionId')
  it('should limit results to specified count')
  it('should order by started_at descending')
  it('should return empty array on error')

describe('getAllSyncLogs')
  it('should first get connection IDs for business')
  it('should then query sync_logs with IN filter')
  it('should return empty array when no connections exist')
  it('should return empty array on error')
```

### 3.4 Daily Revenue Queries

**File**: `src/lib/queries/daily-revenue.test.ts`
**Source**: `src/lib/queries/daily-revenue.ts`

```
describe('getDailyRevenues')
  it('should query revenues by businessId and date range')
  it('should aggregate multiple rows per date')
  it('should track channel breakdown per day')
  it('should use getLastDayOfMonth for range end')
  it('should return empty array for no data')
  it('should throw on query failure')

describe('getPreviousMonthRevenues')
  it('should calculate correct previous month (2026-04 -> 2026-03)')
  it('should roll over year boundary (2026-01 -> 2025-12)')
  it('should delegate to getDailyRevenues')
```

### 3.5 Revenue Queries

**File**: `src/lib/queries/revenue.test.ts`
**Source**: `src/lib/queries/revenue.ts`

```
describe('getRevenues')
  it('should query revenues by businessId and date range')
  it('should return typed revenue rows')

describe('createRevenue')
  it('should insert new revenue row')

describe('updateRevenue')
  it('should update revenue by id')

describe('deleteRevenue')
  it('should delete revenue by id')
```

### 3.6 Expense Queries

**File**: `src/lib/queries/expense.test.ts`
**Source**: `src/lib/queries/expense.ts`

```
describe('getExpenses')
  it('should query expenses by businessId and date range')

describe('createExpense')
  it('should insert new expense')

describe('updateExpense')
  it('should update expense by id')

describe('deleteExpense')
  it('should delete expense by id')
```

### 3.7 Monthly Summary Queries

**File**: `src/lib/queries/monthly-summary.test.ts`
**Source**: `src/lib/queries/monthly-summary.ts`

```
describe('getMonthlySummary')
  it('should query monthly_summaries by businessId and month')

describe('upsertMonthlySummary')
  it('should upsert monthly summary row')
```

### 3.8 Business Queries

**File**: `src/lib/queries/business.test.ts`
**Source**: `src/lib/queries/business.ts`

```
describe('getCurrentBusinessId')
  it('should return businessId for authenticated user')
  it('should throw when user has no business')
```

### 3.9 Server Actions

**File**: `src/lib/actions/revenue.test.ts`

```
describe('createRevenueAction')
  it('should validate input and insert revenue')
  it('should call revalidatePath for /revenue')

describe('updateRevenueAction')
  it('should update revenue and revalidate')

describe('deleteRevenueAction')
  it('should delete revenue and revalidate')
```

**File**: `src/lib/actions/expense.test.ts`

```
describe('createExpenseAction')
  it('should validate input and insert expense')
  it('should call revalidatePath for /expense')
```

**File**: `src/lib/actions/fixed-cost.test.ts`

```
describe('createFixedCostAction')
  it('should validate and insert fixed cost')
  it('should call revalidatePath for /fixed-costs')
```

**File**: `src/lib/actions/csv-import.test.ts`

```
describe('importCsvAction')
  it('should parse and insert bulk data')
  it('should handle classification')
  it('should validate CSV structure')
```

**File**: `src/lib/actions/kpi-sync.test.ts`

```
describe('syncKpiAction')
  it('should calculate and store KPI for given month')
```

---

## Suite 4: Component Rendering (Component Tests)

**Owner**: Sub-agent 4
**Focus**: React component rendering, user interaction, UI states
**Priority**: P1 (should pass for deploy)
**Coverage Target**: 60%+ for tested components

### Mocking Strategy

```typescript
// All component tests need:
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Recharts: mock to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  // ... etc
}));
```

### 4.1 SurvivalGauge

**File**: `src/components/seri/survival-gauge.test.tsx`
**Source**: `src/components/seri/survival-gauge.tsx`

```
describe('SurvivalGauge')
  describe('empty state')
    it('should render empty state when score is null')
    it('should render empty state when score.total is 0')
    it('should show "데이터가 부족합니다" message')

  describe('score display')
    it('should render total score as integer')
    it('should render "점" suffix after score')
    it('should render grade badge (A등급, B등급, etc.)')

  describe('grade colors')
    it('should use blue theme for grade A')
    it('should use green theme for grade B')
    it('should use yellow theme for grade C')
    it('should use orange theme for grade D')
    it('should use red theme for grade F')

  describe('delta indicator')
    it('should show TrendingUp icon when delta is positive')
    it('should show TrendingDown icon when delta is negative')
    it('should show "전월 대비 +N점" text for positive delta')
    it('should show "전월 대비 -N점" text for negative delta')
    it('should not render delta when previousScore is null')

  describe('factor bars')
    it('should render 5 factor bars (수익성, 고정비안정, 인건비적정, 현금유동성, 성장성)')
    it('should display score/max for each factor')
```

### 4.2 CashflowForecast

**File**: `src/components/seri/cashflow-forecast.test.tsx`
**Source**: `src/components/seri/cashflow-forecast.tsx`

```
describe('CashflowForecast')
  it('should render projection chart')
  it('should display alertDays count')
  it('should show warning badge when overallRisk is danger')
  it('should show caution badge when overallRisk is caution')
  it('should show safe state when overallRisk is safe')
  it('should render summary totals (income/expense)')
  it('should render empty state when no projections')
```

### 4.3 CostBreakdown

**File**: `src/components/seri/cost-breakdown.test.tsx`
**Source**: `src/components/seri/cost-breakdown.tsx`

```
describe('CostBreakdown')
  it('should render cost categories')
  it('should calculate percentages correctly')
  it('should sort categories by amount descending')
  it('should handle drilldown click interaction')
  it('should render empty state when no costs')
```

### 4.4 PnlSummaryCards

**File**: `src/components/seri/pnl-summary-cards.test.tsx`
**Source**: `src/components/seri/pnl-summary-cards.tsx`

```
describe('PnlSummaryCards')
  it('should render 4 summary cards')
  it('should display gross revenue')
  it('should display net revenue')
  it('should display total costs')
  it('should display net profit')
  it('should format amounts in Korean style (만/억)')
  it('should show positive profit in green')
  it('should show negative profit in red')
```

### 4.5 ReviewQueue

**File**: `src/components/dapjangi/review-queue.test.tsx`
**Source**: `src/components/dapjangi/review-queue.tsx`

```
describe('ReviewQueue')
  it('should render list of reviews')
  it('should show review rating (stars)')
  it('should show review platform badge')
  it('should show reply_status badge')
  it('should highlight selected review')
  it('should call onSelect when review is clicked')
  it('should render empty state when no reviews')
  it('should show review content preview (truncated)')
```

### 4.6 ReviewDetailPanel

**File**: `src/components/dapjangi/review-detail-panel.test.tsx`
**Source**: `src/components/dapjangi/review-detail-panel.tsx`

```
describe('ReviewDetailPanel')
  it('should render full review content')
  it('should render AI reply in editable textarea')
  it('should show edit and publish buttons')
  it('should render empty state when no review selected')
  it('should show customer name and date')
  it('should show platform and rating')
```

### 4.7 CustomerRiskList

**File**: `src/components/viral/customer-risk-list.test.tsx`
**Source**: `src/components/viral/customer-risk-list.tsx`

```
describe('CustomerRiskList')
  it('should render list of at-risk customers')
  it('should show risk level indicator')
  it('should call onSelect when customer is clicked')
  it('should highlight selected customer')
  it('should render empty state')
```

### 4.8 MessagePreviewPanel

**File**: `src/components/viral/message-preview-panel.test.tsx`
**Source**: `src/components/viral/message-preview-panel.tsx`

```
describe('MessagePreviewPanel')
  it('should render message preview')
  it('should show send button')
  it('should render tabs for different channels')
  it('should render empty state when no customer selected')
```

### 4.9 ChatMessage

**File**: `src/components/jeongjang/chat-message.test.tsx`
**Source**: `src/components/jeongjang/chat-message.tsx`

```
describe('ChatMessage')
  describe('message types')
    it('should render briefing type with agent info')
    it('should render alert type with severity indicator')
    it('should render insight type with action buttons')
    it('should render text type as plain message')

  describe('agent identification')
    it('should show 점장 emoji and name for jeongjang agent')
    it('should show 세리 emoji and name for seri agent')
    it('should show 답장이 emoji and name for dapjangi agent')
    it('should show 바이럴 emoji and name for viral agent')

  describe('KPI block')
    it('should render KPI items when provided')
    it('should show delta with correct color (green for positive)')
    it('should show delta with correct color (red for negative)')

  describe('action buttons')
    it('should render action buttons when provided')
    it('should use correct icon for each action variant')
```

### 4.10 InsightCard

**File**: `src/components/insights/insight-card.test.tsx`
**Source**: `src/components/insights/insight-card.tsx`

```
describe('InsightCard')
  it('should render detection title')
  it('should render severity badge')
  it('should render cause summary')
  it('should render solution recommendation')
  it('should render action button when provided')
  it('should apply correct color for critical severity')
  it('should apply correct color for warning severity')
  it('should apply correct color for info severity')
  it('should apply correct color for opportunity severity')
```

### 4.11 InsightFeed

**File**: `src/components/insights/insight-feed.test.tsx`
**Source**: `src/components/insights/insight-feed.tsx`

```
describe('InsightFeed')
  it('should render list of insight cards')
  it('should render empty state when no insights')
  it('should sort by severity (critical first)')
```

### 4.12 ROI Dashboard

**File**: `src/components/billing/roi-dashboard.test.tsx`
**Source**: `src/components/billing/roi-dashboard.tsx`

```
describe('RoiDashboard')
  it('should render ROI multiple prominently')
  it('should render breakdown categories')
  it('should render subscription cost')
  it('should render total value')
```

### 4.13 Trial Banner

**File**: `src/components/billing/trial-banner.test.tsx`
**Source**: `src/components/billing/trial-banner.tsx`

```
describe('TrialBanner')
  it('should render remaining trial days')
  it('should render CTA button')
  it('should not render when trial is expired')
```

---

## Suite 5: Page Integration & Navigation (Smoke Tests)

**Owner**: Sub-agent 5
**Focus**: Pages import and render without crash, sidebar nav correctness
**Priority**: P1 (should pass) / P2 for nav checks
**Coverage Target**: 100% of pages render, 60% coverage

### Mocking Strategy

```typescript
// Global mocks needed for ALL page tests:
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabaseServerClient),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockSupabaseBrowserClient),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: () => ({ get: vi.fn(), set: vi.fn() }),
  headers: () => new Headers(),
}));

// Mock all Server Components as Client Components for testing
// or use dynamic import with mocked modules
```

### 5.1 Dashboard Pages Smoke Tests

**File**: `src/app/(dashboard)/smoke.test.tsx`

```
describe('Dashboard page smoke tests')
  it('should render /dashboard page without error')
  it('should render /revenue page without error')
  it('should render /expense page without error')
  it('should render /fixed-costs page without error')
  it('should render /import page without error')
  it('should render /analysis page without error')
  it('should render /analysis/upload page without error')
  it('should render /review page without error')
  it('should render /chat page without error')
  it('should render /billing page without error')
  it('should render /marketing page without error')
  it('should render /transactions page without error')
  it('should render /transactions/upload page without error')
  it('should render /invoices page without error')
  it('should render /vendors page without error')
  it('should render /settings page without error')
  it('should render /settings/connections page without error')
  it('should render /settings/budget page without error')
  it('should render /settings/loans page without error')
```

### 5.2 Auth Pages Smoke Tests

**File**: `src/app/auth/smoke.test.tsx`

```
describe('Auth page smoke tests')
  it('should render /auth/login page without error')
  it('should render /auth/signup page without error')
  it('should render /auth/onboarding page without error')
  it('should render /auth/onboarding/preferences page without error')
```

### 5.3 Legal Pages Smoke Tests

**File**: `src/app/(legal)/smoke.test.tsx`

```
describe('Legal page smoke tests')
  it('should render /terms page without error')
  it('should render /privacy page without error')
  it('should render /refund-policy page without error')
```

### 5.4 Landing Page Smoke Test

**File**: `src/app/landing.smoke.test.tsx`

```
describe('Landing page smoke test')
  it('should render / (root) page without error')
```

### 5.5 Not Found Page

**File**: `src/app/not-found.test.tsx`

```
describe('NotFound page')
  it('should render 404 page without error')
  it('should display not found message')
```

### 5.6 Layout Tests

**File**: `src/app/(dashboard)/layout.test.tsx`

```
describe('Dashboard layout')
  it('should render sidebar')
  it('should render mobile header')
  it('should render children slot')
```

### 5.7 Navigation Verification

**File**: `src/app/(dashboard)/navigation.test.tsx`

```
describe('Sidebar navigation')
  it('should include dashboard link')
  it('should include revenue link')
  it('should include expense link')
  it('should include fixed-costs link')
  it('should include analysis link')
  it('should include review link')
  it('should include chat link')
  it('should include billing link')
  it('should include settings link')
  it('should include marketing link')
```

### 5.8 Page Headings Verification (P2)

**File**: `src/app/(dashboard)/headings.test.tsx`

```
describe('Page headings')
  it('/dashboard should display dashboard heading')
  it('/revenue should display revenue heading')
  it('/expense should display expense heading')
  it('/fixed-costs should display fixed costs heading')
  it('/analysis should display analysis heading')
  it('/review should display review heading')
  it('/chat should display chat heading')
```

---

## Priority Summary

| Priority | Description | Suite | Count |
|----------|-------------|-------|-------|
| P0 | Must pass for deploy | Suite 1 (all), Suite 2 (auth + IDOR), Suite 3 (CRUD) | ~120 |
| P1 | Should pass | Suite 2 (remaining), Suite 4, Suite 5 (smoke) | ~70 |
| P2 | Nice to have | Suite 5 (headings, nav) | ~20 |

## Coverage Targets

| Area | Target | Rationale |
|------|--------|-----------|
| `src/lib/kpi/` | 95% | Core business logic, zero tolerance for bugs |
| `src/lib/simulation/` | 95% | Financial simulation, must be accurate |
| `src/lib/insights/` | 85% | Insight engine, needs comprehensive scenarios |
| `src/lib/queries/` | 80% | Data layer, verify query construction |
| `src/lib/actions/` | 75% | Server actions, verify side effects |
| `src/app/api/` | 80% | Security critical, auth + IDOR + validation |
| `src/components/` | 60% | UI states, user interactions |
| `src/app/**/page.tsx` | 50% | Smoke test level, import + render |

## Execution Notes

1. **All 5 suites are independent** and can run in parallel without conflicts
2. **No real DB needed** - all suites use mocked Supabase client
3. **No real API calls** - AI SDK and external services are mocked
4. **Test data uses Korean** - matching production data patterns (chicken shop scenario)
5. **Existing tests preserved** - new tests extend, never replace existing test files
6. **Private function testing** - for cashflow/profit helpers, export them or test through public API
