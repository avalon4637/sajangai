# SPEC-SERI-001: Implementation Plan

## Overview

Build the Seri AI financial analysis engine that provides real P&L calculations, 14-day cash flow predictions, and cost anomaly detection for Korean small business owners. Seri is the financial analyst agent in the 4-agent AI team.

---

## Milestones

### Primary Goal: Real P&L Calculator (S1)

**Priority: High**

Tasks:
1. Create `src/lib/ai/profit-calculator.ts`
   - Query revenues grouped by source (delivery platforms, card, cash)
   - Extract commission rates from revenue metadata
   - Calculate net profit per channel:
     - Delivery: gross - platform commission - rider fee - advertising
     - Card: gross - processing fee (credit ~2.2%, debit ~1.5%)
     - Dine-in/Takeout: gross (no platform fees)
   - Calculate real profit margin percentage per channel
2. Create P&L prompt template in `src/lib/ai/seri-prompts.ts`
   - Structured financial summary table
   - Channel breakdown with commission details
   - Natural language analysis via Claude
3. Integrate with daily_reports caching

Dependencies: Revenue data with metadata from SPEC-HYPHEN-001

### Secondary Goal: Cash Flow Predictor (S2)

**Priority: High**

Tasks:
1. Create `src/lib/ai/cashflow-predictor.ts`
   - Build settlement schedule engine:
     - Map card issuers to settlement cycles (D+2 to D+30)
     - Calculate expected deposit dates and amounts
   - Build fixed cost calendar:
     - Query `fixed_costs` table for scheduled payments
     - Map to calendar dates (rent due date, salary date, etc.)
   - Project 14-day daily cash balance:
     - Starting balance = current account balance (user input or last known)
     - Daily: + expected deposits - expected expenses
   - Alert logic:
     - Scan projected balances for threshold breach
     - Generate alert at D-7 before projected shortfall
2. Create mitigation suggestion logic
   - Evaluate available options (early settlement, date adjustment)
   - Generate Korean-language recommendations
3. Create cash flow prompt template in `src/lib/ai/seri-prompts.ts`

Dependencies: Card settlement data from SPEC-HYPHEN-001, fixed costs data

### Tertiary Goal: Cost Anomaly Detection (S3)

**Priority: Medium**

Tasks:
1. Create `src/lib/ai/cost-analyzer.ts`
   - Calculate weekly cost ratio: (purchases / sales) * 100
   - Maintain 4-week rolling average
   - Detect deviation >= 3 percentage points
   - Skip detection if < 4 weeks of data
2. Create anomaly diagnosis prompt in `src/lib/ai/seri-prompts.ts`
   - Inject cost ratio history as structured table
   - Inject purchase item breakdown if available
   - Request cause diagnosis from Claude (supplier, waste, sales decline)
3. Integrate with daily_reports caching

Dependencies: At least 4 weeks of expense data

### Final Goal: Seri Engine Orchestrator & Cost Control

**Priority: Medium**

Tasks:
1. Create `src/lib/ai/seri-engine.ts`
   - Orchestrate S1, S2, S3 modules
   - Check daily_reports cache before API calls
   - Track token usage and cost per report
   - Enforce rate limit (max 3 reports per business per day)
2. Create database migration `supabase/migrations/00004_daily_reports.sql`
3. Write comprehensive tests
   - Unit tests for profit calculator with known commission rates
   - Unit tests for cash flow projector with mock settlement data
   - Unit tests for cost analyzer with known deviation scenarios
   - Integration test for full Seri engine pipeline

---

## Technical Approach

### Data Pre-Aggregation

Before sending data to Claude, aggregate raw records into summary tables:

```
Revenue Summary (input to P&L):
| Channel      | Gross Revenue | Commission | Net Revenue | Margin % |
| Baemin       | 5,000,000     | 600,000    | 4,400,000   | 88.0%    |
| Coupang Eats | 3,000,000     | 450,000    | 2,550,000   | 85.0%    |
| Card (dine)  | 8,000,000     | 176,000    | 7,824,000   | 97.8%    |
| Total        | 16,000,000    | 1,226,000  | 14,774,000  | 92.3%    |
```

This reduces token consumption from ~10K (raw rows) to ~500 (summary table).

### Card Settlement Cycle Configuration

```typescript
const SETTLEMENT_CYCLES: Record<string, number> = {
  '삼성카드': 2,   // D+2
  '현대카드': 2,
  'KB국민카드': 3,
  '신한카드': 2,
  '롯데카드': 3,
  '하나카드': 2,
  'BC카드': 3,
  'NH농협카드': 3,
  // Default: D+3
};
```

### Claude API Cost Optimization

1. **Prompt Caching**: System prompt (~2K tokens) cached via Anthropic beta header
2. **Pre-Aggregation**: Reduce input data to summary tables (~500 tokens vs ~10K)
3. **JSON Response**: Use `tool_use` to enforce structured output (no wasted tokens on formatting)
4. **Cache Check**: Query `daily_reports` before any API call
5. **Batch Analysis**: Combine S1+S2+S3 in single API call when all requested

### Korean Localization

All financial reports and alerts are generated in Korean:
- Currency: Korean Won with comma separators (1,000,000원)
- Percentages: Korean style (수익률 88.0%)
- Alert messages: Natural Korean (e.g., "7일 후 잔고 부족이 예상됩니다")
- Channel names: Korean labels (홀매장, 배달, 포장)

---

## Risks and Mitigation

| Risk                                    | Impact | Mitigation                                       |
| --------------------------------------- | ------ | ------------------------------------------------ |
| Commission rate changes by platforms    | Medium | Configurable rate tables, quarterly review       |
| Claude API cost exceeds target          | Medium | Aggressive caching, pre-aggregation, rate limits |
| Insufficient data for accurate forecast | Medium | Display confidence level, require minimum data   |
| Card settlement cycle changes           | Low    | Configurable cycle map, user override option     |
| Hallucinated financial analysis         | High   | Structured data + JSON schema, no freeform text  |

---

## Tags

- SPEC-SERI-001
- Phase: 3
- Domain: AI, Financial Analysis, Cost Management, Cash Flow
