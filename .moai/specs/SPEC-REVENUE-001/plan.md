# SPEC-REVENUE-001: AI Revenue Growth Engine

> Status: Planned | Priority: High | Phase: 2 (after SERI-002 completion)
> Estimated Effort: 2-3 weeks

---

## 1. Overview

### Problem Statement

Korean small business owners lack data-driven tools to identify and act on specific revenue growth opportunities. Current approach relies on intuition and generic advice rather than analyzing their own sales data, reviews, and market context to produce actionable, ROI-measurable recommendations.

### Goal

Build an AI-powered revenue growth engine that analyzes existing revenue data, review sentiment, and market context to discover specific, actionable revenue growth opportunities with expected ROI -- then automatically connects to the marketing agent (viral) for execution and tracks results.

### Key Differentiator

Not generic business advice. Every recommendation is backed by the owner's actual data with specific numbers, time ranges, and expected outcomes.

---

## 2. Architecture Overview

### Agent Integration

```
SERI (Revenue Analyst)  -->  Revenue Growth Engine  -->  VIRAL (Marketing Agent)
       |                           |                           |
  Revenue Data              Analysis + Insights          Campaign Execution
  Review Data               Opportunity Scoring          ROI Measurement
  Market Context            Recommendation Gen           Auto-Reporting
```

### Module Decomposition

| Module | Responsibility | Priority |
|--------|---------------|----------|
| Revenue Pattern Analyzer | Time-series analysis, underperformance detection | Primary |
| Menu Profitability Engine | Per-item profitability, cross-sell detection | Primary |
| Competitor Positioning | Market comparison, price analysis | Secondary |
| Marketing Bridge | Opportunity-to-campaign handoff to VIRAL agent | Secondary |
| Goal Tracker | Monthly target setting, pace projection | Optional |

---

## 3. Feature Specifications

### 3.1 Revenue Pattern Analysis & Opportunity Discovery

**Purpose:** Identify underperforming time slots, channels, and seasonal patterns from existing revenue data.

**Technical Approach:**

- Time-series decomposition on `revenues` table grouped by day-of-week, hour, channel
- Rolling average comparison (current period vs. 3-month historical average)
- Statistical anomaly detection for significant deviations (>= 30% below average)
- Channel mix analysis comparing delivery platform distribution and fee structures

**Key Outputs:**

- Underperforming time slots with percentage below average
  - Example: "Wednesday 14:00-16:00 revenue is 60% below your historical average -- consider a promotion for this time slot"
- Channel optimization suggestions
  - Example: "70% of revenue comes from Baemin. Diversifying to Coupang Eats could reduce commission fees + increase reach"
- Seasonal trend alerts
  - Example: "Delivery orders down 20% vs. same month last year -- check if new competitors opened nearby"

**Data Dependencies:**

- `revenues` table: channel, category, amount, created_at
- Minimum 30 days of data required for meaningful analysis
- Ideal: 90+ days for seasonal pattern detection

**Algorithm Notes:**

- Use simple moving averages (7-day, 30-day) rather than complex ML models
- Claude AI generates natural language insights from statistical results
- Aggregate at business-level (no cross-business data sharing)

### 3.2 Menu/Product Profitability Analysis

**Purpose:** Calculate true per-item profitability including platform commissions, and identify cross-selling opportunities.

**Technical Approach:**

- Per-item calculation: `net_profit = revenue - cost_of_goods - platform_commission`
- Rank items by: total revenue, total profit, profit margin, sales velocity
- Cross-sell pattern mining: identify frequently co-ordered items using association rules
- Profitability-weighted promotion scoring

**Key Outputs:**

- Profitability ranking table
  - Example: "Menu A: #1 in sales volume but #5 in net profit. Menu B: #5 in sales but #1 in profit -- promote Menu B instead"
- Cross-selling recommendations
  - Example: "40% of Menu A customers also add Side C -- create a set menu for 10% discount"
- Low-margin alerts
  - Example: "Menu D has 5% margin after Baemin commission -- consider price increase or ingredient substitution"

**Data Dependencies:**

- `revenues` table with item-level breakdown (requires category/item_name field)
- `expenses` table for cost-of-goods mapping (food cost per category)
- Platform commission rates (from Hyphen API or manual input)

**Limitations:**

- Item-level cost data may not be available initially; use category-level estimates
- Commission rates vary by platform and contract; allow manual override
- Cross-sell analysis requires order-level item grouping (delivery platform data)

### 3.3 Competitor Positioning Analysis

**Purpose:** Compare the business against nearby competitors in same industry to identify positioning gaps.

**Technical Approach:**

- Source 1: Hyphen API benchmark data (if available -- aggregated industry averages)
- Source 2: Public data APIs (Small Business Statistics from Korean government open data)
- Source 3: Review keyword analysis from `delivery_reviews` table
- Comparison dimensions: revisit rate, average order value, review sentiment, price level

**Key Outputs:**

- Competitive benchmark report
  - Example: "Among 5 nearby cafes, your revisit rate ranks #3. Top cafe's review keywords: 'comfortable seating', 'quiet atmosphere'"
- Price positioning map
  - Example: "Your average menu price is 8,500 KRW vs. area average 7,200 KRW -- premium positioning justified by review sentiment"
- Improvement suggestions based on competitor strengths

**Data Dependencies:**

- Hyphen API: competitor/industry benchmark data (availability TBD)
- Public API: Small business statistics by industry/region (optional enhancement)
- `delivery_reviews` table: sentiment, keywords for own business

**Risk:**

- Competitor data availability is uncertain; design module to work with or without it
- Fallback: use industry-wide averages from public data sources
- Privacy: never share individual business data with other users

### 3.4 Marketing Execution Bridge (VIRAL Agent Integration)

**Purpose:** Automatically convert discovered opportunities into marketing campaigns via the VIRAL agent.

**Technical Approach:**

- Opportunity-to-campaign mapping: each opportunity type has a campaign template
- Automated handoff via `store_context` table (shared store pattern)
- SERI writes opportunity to `store_context` with type `revenue_opportunity`
- VIRAL reads opportunities and generates: target audience, message copy, channel, timing
- Post-campaign ROI measurement: compare revenue before/after campaign period

**Key Outputs:**

- Automated campaign suggestions
  - Example: "Wednesday afternoon promotion" -> VIRAL generates KakaoTalk message copy + target customer segment
- ROI tracking dashboard
  - Example: "Promotion ran Wed 14:00-16:00 for 2 weeks. Revenue in that slot increased 35% (+120,000 KRW)"
- Campaign history with performance metrics

**Integration Points:**

- `store_context` table: SERI writes opportunities, VIRAL reads them
- `agent_events` table: track campaign creation and execution events
- `revenues` table: pre/post campaign revenue comparison

### 3.5 Revenue Goal Setting & Achievement Tracking

**Purpose:** Allow owners to set monthly revenue targets and track progress with AI-powered pace projections.

**Technical Approach:**

- Monthly target stored in `business_settings` or new `revenue_goals` table
- Daily progress calculation from `revenues` table aggregation
- Linear projection: current pace extrapolated to month-end
- AI-powered suggestions when behind pace

**Key Outputs:**

- Progress gauge UI component
  - Example: "Day 18/30: 62% of target achieved (6,200,000 / 10,000,000 KRW)"
- Pace projection
  - Example: "At current pace, you'll reach 92% of target by month-end"
- Catch-up suggestions
  - Example: "Weekend promotion could close the 8% gap -- VIRAL agent has a campaign ready"

**UI Components:**

- Circular progress gauge with current amount / target
- Trend line chart showing daily cumulative revenue vs. target pace
- Action cards linking to VIRAL campaigns when behind pace

---

## 4. Data Model Changes

### New Tables

```sql
-- Revenue goals per business per month
CREATE TABLE revenue_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,  -- '2026-03' format
  target_amount BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, year_month)
);

-- Revenue opportunities discovered by SERI
CREATE TABLE revenue_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  opportunity_type TEXT NOT NULL,  -- 'time_slot', 'menu_promotion', 'channel_mix', 'cross_sell'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_impact_krw BIGINT,  -- estimated monthly revenue increase
  confidence TEXT NOT NULL DEFAULT 'medium',  -- 'high', 'medium', 'low'
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected', 'executed', 'measured'
  campaign_id UUID,  -- link to VIRAL campaign if executed
  measured_impact_krw BIGINT,  -- actual revenue change after execution
  data_snapshot JSONB,  -- statistical data backing the recommendation
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
```

### RLS Policies

- Both tables: business_id-based isolation (same pattern as existing tables)
- Read/write restricted to authenticated business owner

---

## 5. API Design (Server Actions)

| Action | Path | Description |
|--------|------|-------------|
| `analyzeRevenuePatterns` | `src/lib/actions/revenue-analysis.ts` | Trigger time-series analysis for a business |
| `analyzeMenuProfitability` | `src/lib/actions/revenue-analysis.ts` | Calculate per-item profitability |
| `getCompetitorBenchmark` | `src/lib/actions/revenue-analysis.ts` | Fetch competitor comparison data |
| `setRevenueGoal` | `src/lib/actions/revenue-goals.ts` | Create/update monthly revenue target |
| `getGoalProgress` | `src/lib/actions/revenue-goals.ts` | Get current progress vs. target |
| `getOpportunities` | `src/lib/actions/revenue-opportunities.ts` | List discovered opportunities |
| `respondToOpportunity` | `src/lib/actions/revenue-opportunities.ts` | Accept/reject an opportunity |

---

## 6. UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| `RevenueInsightsPanel` | `src/components/analysis/revenue-insights-panel.tsx` | Main insights dashboard |
| `TimeSlotHeatmap` | `src/components/analysis/time-slot-heatmap.tsx` | Revenue by day/hour heatmap |
| `MenuProfitabilityTable` | `src/components/analysis/menu-profitability-table.tsx` | Sortable profit ranking |
| `RevenueGoalGauge` | `src/components/dashboard/revenue-goal-gauge.tsx` | Circular progress widget |
| `OpportunityCards` | `src/components/analysis/opportunity-cards.tsx` | Accept/reject opportunity UI |
| `CampaignROIChart` | `src/components/analysis/campaign-roi-chart.tsx` | Pre/post campaign comparison |

---

## 7. Implementation Milestones

### Primary Goal: Revenue Pattern Analysis

- Implement time-series decomposition on revenues table
- Build underperforming time slot detection
- Create channel mix analysis
- Build RevenueInsightsPanel and TimeSlotHeatmap UI
- Integrate with SERI agent prompts

### Secondary Goal: Menu Profitability

- Implement per-item profitability calculation
- Build cross-sell pattern detection
- Create MenuProfitabilityTable component
- Add profitability insights to SERI agent

### Tertiary Goal: Goal Tracking + Marketing Bridge

- Create revenue_goals and revenue_opportunities tables
- Build goal setting UI and progress gauge
- Implement SERI -> VIRAL opportunity handoff via store_context
- Build ROI measurement (pre/post campaign comparison)

### Optional Goal: Competitor Positioning

- Integrate Hyphen benchmark data (when available)
- Integrate public data APIs for industry averages
- Build competitor comparison UI
- Add competitive insights to SERI agent

---

## 8. Technical Considerations

### Performance

- Revenue pattern analysis should run asynchronously (not blocking UI)
- Cache analysis results with 1-hour TTL (business data doesn't change frequently)
- Heatmap data pre-aggregated at query time, not real-time calculation

### AI Integration

- Claude API (Sonnet) generates natural language insights from statistical results
- Prompt template includes business context, industry type, and data summary
- Response structured as JSON with title, description, estimated_impact, confidence
- Prompt caching applied for repeated analysis patterns

### Data Quality

- Minimum data requirements: 30 days of revenue data for basic analysis
- Graceful degradation: show available insights even with limited data
- Data quality indicators: warn if gaps in revenue recording detected

### Privacy & Security

- All analysis is per-business; no cross-business data aggregation
- Competitor data uses only public/anonymized sources
- RLS policies enforce business-level data isolation
- Opportunity data includes only business owner's own metrics

---

## 9. Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| SPEC-SERI-002 (SERI Agent Core) | Prerequisite | In Progress |
| SPEC-DATA-001 (Revenue/Expense CRUD) | Prerequisite | Complete |
| SPEC-DASHBOARD-001 (KPI Dashboard) | Prerequisite | Complete |
| SPEC-CONNECT-001 (Card Sales Connect) | Enhancement | Defined |
| SPEC-DELIVERY-001 (Delivery Integration) | Enhancement | Defined |
| Hyphen API benchmark data | External | Availability TBD |
| Public small business statistics API | External | Optional |

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Insufficient revenue data for analysis | Medium | High | Graceful degradation; show insights only when data threshold met |
| Item-level cost data unavailable | High | Medium | Use category-level estimates; allow manual cost input |
| Competitor data not available via Hyphen | Medium | Low | Module designed as optional; use industry averages as fallback |
| ROI measurement accuracy | Medium | Medium | Use time-window comparison with statistical significance check |
| Claude API latency for analysis | Low | Medium | Async analysis with caching; pre-compute during off-peak |

---

## 11. Success Metrics

- Owners who use revenue insights have measurably higher engagement (session duration, return rate)
- At least 30% of discovered opportunities are accepted by owners
- Accepted opportunities show positive ROI in follow-up measurement
- Revenue goal feature increases owner retention (monthly subscription renewal)
