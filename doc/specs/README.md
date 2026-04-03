# sajang.ai SPEC Index

## Phase Map

```
Phase 0: 안정화 ✅ 완료
Phase 1: 킥 구현 ← SPEC-KICK-001 (Active)
Phase 2: 체험→전환 ← SPEC-ENGAGE-001
Phase 3~4: 성장 엔진 ← SPEC-GROWTH-001
Phase App: 앱화 ← SPEC-APP-001
```

## Active SPECs

| SPEC | Phase | Title | Status |
|------|-------|-------|--------|
| SPEC-KICK-001 | Phase 1 | 인사이트 엔진 + 바이럴 에이전트 | **Done** |
| SPEC-ENGAGE-001 | Phase 2 | 개인화 + 카톡 알림 + 7일 체험 | **Done** |
| SPEC-GROWTH-001 | Phase 3~4 | ROI + 25 시나리오 완성 | **Done** |
| SPEC-APP-001 | Phase App | Capacitor 앱화 | Draft |

## Dependency Graph

```
SPEC-KICK-001 (Phase 1)
  → SPEC-ENGAGE-001 (Phase 2)
    → SPEC-GROWTH-001 (Phase 3~4)
      → SPEC-APP-001 (Phase App)
```

## Completed SPECs (Legacy)

| SPEC | Title | Commit |
|------|-------|--------|
| SPEC-AUTH-001 | Auth + business registration | 84fe86e |
| SPEC-DATA-001 | Revenue/Expense/FixedCost CRUD | d4f4167 |
| SPEC-DASHBOARD-001 | KPI dashboard + charts | 972b109 |
| SPEC-IMPORT-001 | CSV upload + auto-classify | 2300969 |
| SPEC-SIMULATION-001 | What-if simulation UI | 2300969 |
| SPEC-AI-001 | AI business analysis widget | 2300969 |
| SPEC-UX-001 | UI/UX responsive + mobile | 635cfd6 |
| SPEC-TEST-001 | Test coverage 139 tests | 635cfd6 |
| SPEC-RLS-001 | RLS policies 24 rules | 635cfd6 |
| SPEC-INFRA-001 | Hyphen API infrastructure | 635cfd6 |
