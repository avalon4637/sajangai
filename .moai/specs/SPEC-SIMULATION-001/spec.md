---
id: SPEC-SIMULATION-001
version: "1.0.0"
status: draft
created: "2026-02-20"
priority: P0
depends_on:
  - SPEC-DASHBOARD-001
---

# SPEC-SIMULATION-001: What-if 시뮬레이션 UI

## 개요

소상공인이 경영 의사결정 전 "만약 ~하면?" 시나리오를 시뮬레이션하여 KPI 변화를 미리 예측할 수 있는 UI. 기존 `src/lib/simulation/engine.ts`의 runSimulation() 함수를 활용하여 4가지 시나리오 유형을 제공한다.

## 범위

- `/dashboard/simulation` 페이지
- 4가지 시나리오 카드 (직원 증감, 매출 변동, 임대료 변동, 매입 변동)
- 시뮬레이션 파라미터 입력 (절대값/비율 선택)
- 변경 전/후 KPI 비교 대시보드
- 생존점수 변화 시각화

## 범위 제외

- 시뮬레이션 결과 저장/이력 관리
- 복합 시나리오 (동시에 여러 요소 변경)

---

## Requirements (EARS)

### REQ-01: 시나리오 선택

**Ubiquitous:**
- 시스템은 4가지 시나리오를 카드 형태로 표시해야 한다:
  - 직원 변동 (employee_change): "직원을 고용/감원하면?"
  - 매출 변동 (revenue_change): "매출이 변하면?"
  - 임대료 변동 (rent_change): "임대료가 변하면?"
  - 매입 변동 (expense_change): "재료비가 변하면?"

### REQ-02: 파라미터 입력

**Event-Driven:**
- WHEN 사용자가 시나리오를 선택하면 THEN 시스템은 해당 시나리오의 입력 폼을 표시해야 한다.

**Ubiquitous:**
- 시스템은 변동값을 원(절대값) 또는 %(비율)로 입력할 수 있도록 해야 한다.
- 시스템은 양수(증가)와 음수(감소) 모두 허용해야 한다.

### REQ-03: 시뮬레이션 실행

**Event-Driven:**
- WHEN 사용자가 "시뮬레이션 실행" 버튼을 클릭하면 THEN 시스템은 현재 월의 KPI를 기준으로 runSimulation()을 실행해야 한다.

### REQ-04: 결과 비교 표시

**Ubiquitous:**
- 시스템은 변경 전/후 KPI를 나란히 비교하여 표시해야 한다.
- 비교 항목: 순이익, 생존점수, 매출총이익률, 인건비 비율, 고정비 비율
- 각 항목의 변화량(+/-)과 변화율(%)을 표시해야 한다.
- 개선된 지표는 초록색, 악화된 지표는 빨간색으로 표시해야 한다.

### REQ-05: 생존점수 시각화

**Ubiquitous:**
- 시스템은 변경 전/후 생존점수를 시각적으로 비교 (게이지 차트 또는 바 차트)해야 한다.

### REQ-06: 프리셋 시나리오

**Ubiquitous:**
- 시스템은 자주 사용하는 시나리오 프리셋을 제공해야 한다:
  - "알바 1명 추가 (월 200만원)"
  - "매출 10% 증가"
  - "임대료 50만원 인상"

---

## 기존 인프라

- `src/lib/simulation/engine.ts`: runSimulation(), SimulationType, SimulationParams, SimulationResult
- `src/lib/kpi/calculator.ts`: calculateKpi(), KpiInput, KpiResult
- `src/lib/queries/monthly-summary.ts`: getMonthlyKpi()

<!-- TAG: SPEC-SIMULATION-001 -->
