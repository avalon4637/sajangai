---
id: SPEC-DASHBOARD-001
version: "1.0.0"
status: approved
created: "2026-02-19"
updated: "2026-02-19"
author: MoAI
priority: P0
---

## HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-19 | MoAI | Initial SPEC creation |

---

# SPEC-DASHBOARD-001: KPI 대시보드 시스템

## 개요

sajang.ai의 핵심 대시보드 페이지를 구현한다. 사용자가 입력한 매출/비용/고정비 데이터를 기반으로 자동 계산된 KPI(monthly_summaries)를 시각적으로 표현하고, 경영 상태를 한눈에 파악할 수 있는 대시보드를 구축한다.

## 범위

- `/dashboard` 페이지의 KPI 시각화 위젯 구현
- Recharts 기반 차트 컴포넌트 (LineChart, BarChart, PieChart)
- 생존점수 게이지 위젯
- 매출/비용 추이 및 비용 구조 분석
- 매출 채널/카테고리 분석
- 반응형 레이아웃 (모바일 우선)
- 빈 데이터 상태 처리 (Empty State)

## 범위 제외

- 데이터 입력/수정/삭제 기능 (SPEC-DATA-001에서 구현 완료)
- What-if 시뮬레이션 UI (SPEC-SIMULATION-XXX에서 구현 예정)
- AI 경영 분석 (SPEC-AI-XXX에서 구현 예정)
- CSV 업로드 기능 (SPEC-CSV-XXX에서 구현 예정)

---

## Environment (환경)

### 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js App Router | 16.1.6 |
| UI | React | 19.2.3 |
| 언어 | TypeScript strict | 5.x |
| DB | Supabase PostgreSQL (RLS) | 16.x |
| 차트 | Recharts | 3.7.0 |
| UI 컴포넌트 | shadcn/ui (new-york) | latest |
| CSS | Tailwind CSS | 4.x |
| 아이콘 | Lucide React | latest |

### 기존 인프라

- `src/app/(dashboard)/layout.tsx`: 인증 검증 + 사이드바 레이아웃
- `src/app/(dashboard)/sidebar.tsx`: 사이드바 네비게이션
- `src/app/(dashboard)/dashboard/page.tsx`: 현재 빈 상태
- `src/lib/kpi/calculator.ts`: KPI 계산 엔진 (calculateKpi 순수 함수)
- `src/lib/actions/kpi-sync.ts`: recalculateMonthlyKpi (데이터 CRUD 시 자동 호출)
- `src/lib/queries/business.ts`: getCurrentBusinessId()
- `src/components/data-entry/month-picker.tsx`: MonthPicker 컴포넌트
- `src/types/data-entry.ts`: MonthlySummary 타입
- monthly_summaries 테이블: UNIQUE(business_id, year_month)

### 제약 사항

- 모든 UI 텍스트는 한국어
- 새로운 npm 패키지 설치 없음 (Recharts 이미 설치됨)
- Server Component에서 데이터 페칭, Client Component에서 차트 렌더링 분리
- 모바일 우선 반응형 디자인

---

## Assumptions (가정)

| 번호 | 가정 | 신뢰도 | 검증 방법 |
|------|------|--------|-----------|
| A-01 | SPEC-AUTH-001, SPEC-DATA-001이 완료되어 인증, 데이터 입력이 정상 작동한다 | High | 기존 커밋 확인 |
| A-02 | monthly_summaries 테이블에 데이터 존재 (사용자가 최소 1건 이상 입력) | Medium | Empty State 처리 |
| A-03 | 사용자당 하나의 사업장만 존재 (MVP 단계) | High | businesses 테이블 조회 |
| A-04 | 차트 데이터는 최근 6~12개월 범위면 충분하다 | High | 소상공인 경영 분석 관행 |
| A-05 | Recharts는 "use client" 환경에서만 동작한다 | High | Recharts 공식 문서 |

---

## Requirements (요구사항)

### REQ-01: KPI 요약 카드

**Ubiquitous:**
- 시스템은 항상 `/dashboard` 페이지 상단에 총매출, 총비용, 순이익, 생존점수 4개의 KPI 요약 카드를 표시해야 한다.
- 시스템은 항상 각 카드에 해당 월의 금액과 전월 대비 증감률(%)을 함께 표시해야 한다.

**Event-Driven:**
- WHEN 사용자가 월 선택기(MonthPicker)에서 월을 변경하면 THEN 시스템은 선택된 월의 KPI 데이터로 요약 카드를 갱신해야 한다.

**State-Driven:**
- IF 선택된 월의 monthly_summaries 데이터가 없으면 THEN 시스템은 모든 KPI 값을 0으로 표시하고 "아직 입력된 데이터가 없습니다" 안내 메시지를 표시해야 한다.
- IF 전월 데이터가 없으면 THEN 시스템은 증감률을 표시하지 않아야 한다.
- IF 순이익이 양수이면 THEN 초록색으로, 음수이면 빨간색으로 표시해야 한다.

### REQ-02: 생존점수 위젯

**Ubiquitous:**
- 시스템은 항상 생존점수(0~100)를 시각적 게이지/원형 차트로 표현해야 한다.
- 시스템은 항상 생존점수의 4개 구성 요소(순이익 30점, 매출총이익률 25점, 인건비 비율 20점, 고정비 비율 25점)를 분해하여 표시해야 한다.

**State-Driven:**
- IF 생존점수가 0~30이면 THEN "위험" 상태를 빨간색으로 표시해야 한다.
- IF 생존점수가 31~60이면 THEN "주의" 상태를 노란색으로 표시해야 한다.
- IF 생존점수가 61~80이면 THEN "양호" 상태를 초록색으로 표시해야 한다.
- IF 생존점수가 81~100이면 THEN "우수" 상태를 파란색으로 표시해야 한다.

### REQ-03: 매출/비용 비교 차트

**Ubiquitous:**
- 시스템은 항상 최근 6개월의 매출 추이를 Recharts LineChart로 표시해야 한다.
- 시스템은 항상 월별 매출 vs 비용을 Recharts BarChart로 비교 표시해야 한다.

**Event-Driven:**
- WHEN 사용자가 차트 기간을 6개월에서 12개월로 변경하면 THEN 시스템은 해당 기간의 데이터로 차트를 갱신해야 한다.

**State-Driven:**
- IF 차트 데이터가 2개월 미만이면 THEN "추이를 확인하려면 최소 2개월 이상의 데이터가 필요합니다" 메시지를 표시해야 한다.

### REQ-04: KPI 추이 차트

**Ubiquitous:**
- 시스템은 항상 최근 6개월의 핵심 비율 지표(매출총이익률, 인건비 비율, 고정비 비율)를 Recharts 멀티라인 차트로 표시해야 한다.
- 시스템은 항상 생존점수 추이를 함께 표시해야 한다.

### REQ-05: 비용 구조 분석

**Ubiquitous:**
- 시스템은 항상 선택된 월의 비용 구조(변동비 vs 고정비)를 Recharts PieChart로 표시해야 한다.

**Optional:**
- 가능하면 고정비 내에서 인건비와 기타 고정비의 비율을 추가로 표시한다.

### REQ-06: 매출 채널/카테고리 분석

**Event-Driven:**
- WHEN 대시보드가 로드되면 THEN 시스템은 선택된 월의 매출을 채널별(카드/현금/지역화폐)로 집계하여 차트 또는 테이블로 표시해야 한다.

**Optional:**
- 가능하면 카테고리별(매장/배달앱/테이크아웃) 매출 비중을 추가로 표시한다.

### REQ-07: 빠른 실행 링크

**Ubiquitous:**
- 시스템은 항상 대시보드에서 데이터 입력 페이지(매출 등록, 비용 등록, 고정비 관리)로 이동할 수 있는 바로가기 링크를 제공해야 한다.

**Unwanted:**
- 시스템은 인증되지 않은 사용자가 대시보드에 접근하는 것을 허용하지 않아야 한다.
- 시스템은 다른 사용자의 사업장 KPI 데이터를 표시하지 않아야 한다.

<!-- TAG: SPEC-DASHBOARD-001 -->
