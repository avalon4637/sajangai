# SPEC-KICK-001: 킥 구현 — Insight Engine + Viral Agent

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-KICK-001 |
| Title | 킥 구현: 인사이트 엔진 MVP + 바이럴 에이전트 |
| Phase | Phase 1 |
| Priority | P0 |
| WBS Ref | F3.1~F3.3, F2.5 |
| Status | Active |

## Problem Statement

sajang.ai는 현재 데이터를 수집/표시하는 "체중계" 수준. 핵심 차별점인 **"감지→원인→해결→실행"** 파이프라인과 4번째 에이전트(바이럴)가 빠져있다.

---

## Milestones

### M1: Insight Engine Core + Data Model
- Insight scenario plugin architecture
- InsightResult type system (detection/cause/solution/action)
- insight_events + action_results DB migration + RLS
- Insight engine (scenario registry, execution, dedup)

### M2: First 5 Scenarios (A1~A3, B1~B2)
- A1: 매출 급락 + 리뷰 연관 (cross-analyzer 재사용)
- A2: 특정 채널만 하락
- A3: 요일별 편차 과다 (dayOfWeek patterns 재사용)
- B1: 채널 수수료 최적화
- B2: 고정비 이상 증가 (cost-analyzer 재사용)

### M3: Insight Card UI + Dashboard Integration
- InsightCard component (severity color, action button, dismiss)
- InsightFeed (sorted by severity/recency, max 3 + 더보기)
- Dashboard integration (KPI cards 아래, 차트 위)
- Sidebar badge (인사이트 N건)

### M4: Action Execution Framework
- Action router: reply_reviews → /review, send_message → /marketing, view_detail → /analysis, run_simulation → /analysis
- Status tracking: new → seen → acted/dismissed
- action_results row creation

### M5: Viral Agent
- viral-engine.ts + viral-prompts.ts
- Churn detection (2주+ 미주문 단골)
- Re-engagement message generation (Claude + brand voice)
- Marketing page UI (/marketing)
- Jeongjang morning routine integration

---

## Data Model

```sql
-- insight_events
CREATE TABLE insight_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  detection JSONB NOT NULL,
  cause JSONB NOT NULL,
  solution JSONB NOT NULL,
  action JSONB,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  acted_at TIMESTAMPTZ,
  CONSTRAINT valid_severity CHECK (severity IN ('critical','warning','info','opportunity')),
  CONSTRAINT valid_status CHECK (status IN ('new','seen','acted','dismissed','expired'))
);

CREATE INDEX idx_insight_business ON insight_events(business_id, status, created_at DESC);
CREATE UNIQUE INDEX idx_insight_active ON insight_events(business_id, scenario_id) WHERE status IN ('new','seen');

-- action_results (ROI tracking foundation)
CREATE TABLE action_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_event_id UUID NOT NULL REFERENCES insight_events(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  result_data JSONB,
  measured_effect JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Type System

```typescript
interface InsightResult {
  scenarioId: string;
  category: "revenue" | "cost" | "review" | "strategy";
  severity: "critical" | "warning" | "info" | "opportunity";
  detection: { title: string; metric: string; comparedTo: string };
  cause: { summary: string; signals: string[]; confidence: number };
  solution: { recommendation: string; expectedEffect: string; estimatedValue?: number };
  action?: { type: InsightActionType; label: string; payload: Record<string, unknown> };
}

type InsightActionType = "reply_reviews" | "send_message" | "view_detail" | "run_simulation";

interface InsightScenario {
  id: string;
  name: string;
  category: InsightResult["category"];
  evaluate(ctx: ScenarioContext): Promise<InsightResult | null>;
}
```

## Architecture

### New Files
```
src/lib/insights/
├── types.ts                    # InsightResult, InsightScenario interfaces
├── engine.ts                   # Runs all scenarios, dedup, store
├── queries.ts                  # DB CRUD for insight_events
├── action-router.ts            # Maps action types to handlers
└── scenarios/
    ├── a1-revenue-review.ts
    ├── a2-channel-drop.ts
    ├── a3-day-variance.ts
    ├── b1-channel-fees.ts
    └── b2-fixed-cost-spike.ts

src/lib/ai/
├── viral-engine.ts             # Viral agent engine
└── viral-prompts.ts            # Viral agent prompts

src/components/insights/
├── insight-card.tsx
├── insight-feed.tsx
└── insight-badge.tsx

supabase/migrations/
└── 00012_insight_events.sql
```

### Modified Files
```
src/app/(dashboard)/dashboard/page.tsx   # Add InsightFeed
src/app/(dashboard)/layout.tsx           # Add InsightBadge to sidebar
src/app/(dashboard)/marketing/page.tsx   # Viral agent UI
src/lib/ai/jeongjang-engine.ts           # Hook insight engine + viral
```

### Reused Existing Code
| Module | Reuse |
|--------|-------|
| cross-analyzer.ts | A1 (review×revenue), A3 (dayOfWeek) |
| cost-analyzer.ts | B2 (cost anomaly) |
| proactive-diagnosis.ts | A1 cause enrichment |
| brand-voice.ts | M5 viral message tone |
| sender.ts | M5 message sending |

## Implementation Order

M1 → M2 → M3 → M4 → M5 (sequential, each builds on previous)

## Testing Strategy

- Unit: Each scenario (mock data → verify InsightResult)
- Unit: Engine (registry, execution, dedup logic)
- Component: InsightCard (render, click, dismiss)
- Integration: Engine → DB → UI round trip

## Success Metrics

| Metric | Target |
|--------|--------|
| Engine speed | < 5s per business |
| Active scenarios | 5/5 |
| UI | Insight cards visible on dashboard |
| Viral agent | Churn list + message generation working |
