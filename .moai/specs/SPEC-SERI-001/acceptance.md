# SPEC-SERI-001: Acceptance Criteria

## AC-1: Real P&L Calculation Accuracy

**Given** a business with delivery app revenues and card sales data
**When** Seri generates a P&L report
**Then** delivery app commissions are accurately deducted per platform:
  - Baemin: base commission + advertising fee + rider fee
  - Coupang Eats: order commission rate
  - Yogiyo: commission rate per plan tier
**And** card processing fees are deducted per transaction type:
  - Credit card: ~2.2%
  - Debit card: ~1.5%
  - Zero-rate eligible small business: 0%
**And** the "real remaining money" (진짜 남는 돈) equals gross revenue minus all commissions and fees

---

## AC-2: Channel Profit Breakdown

**Given** a business with mixed revenue sources
**When** Seri generates a P&L report
**Then** real profit margin is displayed per channel in percentage:
  - Dine-in (홀매장): margin %
  - Delivery per platform (배민/쿠팡이츠/요기요): margin %
  - Takeout (포장): margin %
**And** all monetary values are formatted in Korean Won with thousand separators

---

## AC-3: 14-Day Cash Flow Forecast

**Given** a business with card sales and fixed cost data
**When** Seri generates a cash flow forecast
**Then** daily projected cash balance is displayed for the next 14 days
**And** expected card settlement deposits are calculated based on:
  - Approval date + issuer-specific settlement cycle (D+2 to D+30)
  - Settlement amount = approved amount - processing fee
**And** scheduled fixed expenses are subtracted on their due dates:
  - Salary, rent, insurance, taxes, utilities

---

## AC-4: Low Balance Alert

**Given** a cash flow forecast projects balance below the safety threshold
**When** the projected shortfall is 7 or more days away
**Then** the system generates an alert at D-7
**And** the alert includes:
  - Projected shortfall date
  - Projected deficit amount
  - At least one mitigation suggestion in Korean (e.g., "배달앱 선정산 신청", "급여일 조정 검토")

**Given** no safety threshold is configured by the user
**When** the system evaluates cash flow
**Then** a default threshold of 500,000 KRW is used

---

## AC-5: Cost Anomaly Detection

**Given** at least 4 weeks of purchase and sales data exist
**When** the weekly cost ratio deviates by +3 percentage points or more from the 4-week moving average
**Then** an anomaly alert is generated
**And** the alert displays:
  - Current week's cost ratio
  - 4-week moving average
  - Deviation amount in percentage points

**Given** fewer than 4 weeks of data exist
**When** anomaly detection is requested
**Then** the system displays "데이터 수집 중" (Collecting data) instead of running detection

---

## AC-6: Anomaly Cause Diagnosis

**Given** a cost anomaly has been detected
**When** Seri performs cause diagnosis via Claude AI
**Then** the diagnosis identifies one or more probable causes:
  - Supplier price increase (납품가 인상): higher per-unit purchase costs
  - Waste increase (폐기 증가): same purchase volume, lower utilization
  - Sales decline (매출 감소): lower revenue with normal purchase levels
  - Seasonal pattern (계절적 패턴): if historical data exists for comparison
**And** the diagnosis is presented in natural Korean language

---

## AC-7: API Cost Control

**Given** a report for the same business, date, and type already exists in `daily_reports`
**When** the same report is requested again
**Then** the cached report is returned without calling Claude API
**And** no additional API cost is incurred

**Given** a new report is generated via Claude API
**When** the report is complete
**Then** the token usage and cost (USD) are logged in the `daily_reports` table
**And** the cost per report does not exceed $0.05

**Given** a business has already generated 3 reports today
**When** a 4th report is requested
**Then** the system returns the most recent cached reports instead of generating new ones

---

## AC-8: Data Completeness Disclaimer

**Given** incomplete data for analysis (e.g., missing delivery app connection, no card data)
**When** Seri generates a report
**Then** a disclaimer is displayed indicating which data sources are missing
**And** the analysis is labeled as "partial" (부분 분석)

---

## Quality Gates

| Gate                       | Criteria                                               |
| -------------------------- | ------------------------------------------------------ |
| P&L Accuracy               | Commission and fee deductions match known platform rates |
| Channel Breakdown          | Profit margin displayed per channel in %               |
| Forecast Range             | 14-day daily projection with all settlement cycles     |
| Alert Timing               | D-7 alert generated for projected shortfall            |
| Anomaly Threshold          | +3pp deviation from 4-week moving average triggers alert |
| Diagnosis Quality          | Cause identification matches one of 4 known categories |
| API Cost                   | < $0.05 per report                                     |
| Cache Hit Rate             | Duplicate requests served from cache (0 API cost)      |
| Korean Localization        | All financial values in KRW format, messages in Korean |

---

## Verification Methods

- **Unit Tests**: Profit calculator with known commission rates and expected net amounts
- **Unit Tests**: Cash flow predictor with mock settlement schedules and fixed costs
- **Unit Tests**: Cost analyzer with synthetic 5-week data including known anomaly
- **Integration Tests**: Full Seri engine pipeline with mock Claude API responses
- **Cost Tests**: Token counting to verify < $0.05 per report
- **Manual Tests**: Korean language quality review of generated reports

---

## Definition of Done

- [ ] P&L calculator accurately deducts delivery commissions and card fees
- [ ] Channel-wise profit margin (홀/배달/포장) displayed in percentage
- [ ] 14-day cash flow forecast with daily granularity
- [ ] Card settlement deposits calculated per issuer cycle (D+2 to D+30)
- [ ] Fixed cost calendar integrated into cash flow projection
- [ ] D-7 low balance alert with mitigation suggestions
- [ ] Weekly cost ratio anomaly detection with +3pp threshold
- [ ] Claude AI cause diagnosis for detected anomalies
- [ ] Report caching in daily_reports table (no duplicate API calls)
- [ ] Claude API cost < $0.05 per report verified
- [ ] Rate limit: max 3 reports per business per day
- [ ] All reports and alerts in Korean language
- [ ] daily_reports table with RLS policies
- [ ] Incomplete data disclaimer displayed when applicable

---

## Tags

- SPEC-SERI-001
