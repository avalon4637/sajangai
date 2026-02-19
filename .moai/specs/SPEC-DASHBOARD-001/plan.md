---
id: SPEC-DASHBOARD-001
type: plan
version: "1.0.0"
---

# SPEC-DASHBOARD-001 구현 계획: KPI 대시보드 시스템

## 개요

sajang.ai의 핵심 대시보드 페이지를 구현한다. 현재 빈 상태인 `/dashboard` 페이지를 KPI 요약 카드, 생존점수 게이지, 매출/비용 추이 차트, 비용 구조 분석, 매출 채널 분석 등으로 채워 사용자가 경영 상태를 한눈에 파악할 수 있도록 한다.

---

## 마일스톤

### Primary Goal: KPI 요약 + 생존점수 위젯

**범위:** 대시보드 쿼리 함수, KPI 요약 카드, 생존점수 위젯, Empty State, 월 선택기

**구현 항목:**

1. **대시보드 쿼리 함수** (`src/lib/queries/monthly-summary.ts`)
   - `getMonthlyKpi(businessId, yearMonth)`: 특정 월의 monthly_summaries 조회
   - `getMonthlyTrend(businessId, months)`: 최근 N개월 트렌드 데이터 조회
   - `getRevenueByChannel(businessId, yearMonth)`: 채널별 매출 집계
   - `getExpenseBreakdown(businessId, yearMonth)`: 비용 구조 집계

2. **대시보드 타입 정의** (`src/types/dashboard.ts`)
   - DashboardKpi: 월별 KPI + 전월 대비 증감 데이터
   - MonthlyTrend: 트렌드 차트용 데이터 배열
   - ExpenseBreakdown: 비용 구조 분석 데이터
   - RevenueChannelData: 채널/카테고리별 매출 데이터
   - SurvivalScoreBreakdown: 생존점수 구성 요소 분해

3. **대시보드 페이지 리팩토링** (`src/app/(dashboard)/dashboard/page.tsx`)
   - Server Component에서 모든 데이터 페칭
   - 인증 + 사업장 ID 확인
   - MonthPicker 기반 월 선택 (searchParams)
   - Client Component에 props 전달

4. **KPI 요약 카드** (`src/components/dashboard/kpi-summary-cards.tsx`)
   - 4개 카드: 총매출, 총비용, 순이익, 생존점수
   - 전월 대비 증감률 표시 (화살표 + 퍼센트)
   - 색상 코딩 (양수: 초록, 음수: 빨강)
   - shadcn/ui Card 컴포넌트 활용

5. **생존점수 위젯** (`src/components/dashboard/survival-score-widget.tsx`)
   - Recharts RadialBarChart 또는 CSS 기반 원형 프로그레스
   - 점수대별 색상: 위험(0-30, 빨강), 주의(31-60, 노랑), 양호(61-80, 초록), 우수(81-100, 파랑)
   - 4개 구성 요소 점수 분해 표시
   - 생존점수 분해 계산 함수 (calculator.ts의 로직 참조)

6. **빈 데이터 상태** (`src/components/dashboard/dashboard-empty-state.tsx`)
   - "아직 입력된 데이터가 없습니다" 메시지
   - 데이터 입력 페이지 바로가기 링크
   - 안내 아이콘 및 설명

**완료 기준:**
- KPI 카드 4개 정상 렌더링
- 생존점수 게이지 위젯 정상 동작
- 전월 대비 증감률 정상 계산
- Empty State 정상 표시
- 모바일 반응형 레이아웃

### Secondary Goal: 차트 시각화

**범위:** Recharts 기반 매출/비용/KPI 추이 차트, 기간 선택기

**구현 항목:**

7. **매출 추이 차트** (`src/components/dashboard/revenue-trend-chart.tsx`)
   - Recharts LineChart: 최근 6개월 매출 추이
   - ResponsiveContainer로 반응형 처리
   - 툴팁: 월, 매출액 표시
   - 한국어 금액 포맷 (만원 단위)

8. **매출/비용 비교 차트** (`src/components/dashboard/revenue-expense-chart.tsx`)
   - Recharts BarChart: 월별 매출(파랑) vs 비용(빨강) 비교
   - 그룹화된 막대
   - 범례 표시

9. **KPI 추이 차트** (`src/components/dashboard/kpi-trend-chart.tsx`)
   - Recharts 멀티라인 차트
   - 매출총이익률, 인건비 비율, 고정비 비율, 생존점수
   - 각 지표별 색상 구분
   - 기간 선택: 6개월 / 12개월 전환 (Tabs)

**완료 기준:**
- LineChart 매출 추이 정상 렌더링
- BarChart 매출/비용 비교 정상 렌더링
- 멀티라인 KPI 추이 정상 렌더링
- 기간 전환 동작
- 데이터 2개월 미만 시 안내 메시지

### Tertiary Goal: 세부 분석 + 빠른 실행

**범위:** 비용 구조 PieChart, 매출 채널 분석, 빠른 실행 링크, 전체 레이아웃 최적화

**구현 항목:**

10. **비용 구조 차트** (`src/components/dashboard/expense-breakdown-chart.tsx`)
    - Recharts PieChart: 변동비 vs 고정비 비율
    - 고정비 내 인건비/기타 구분 (중첩 도넛 또는 범례)
    - 금액 및 비율 표시

11. **매출 채널 분석** (`src/components/dashboard/revenue-channel-breakdown.tsx`)
    - 채널별(카드/현금/지역화폐) 매출 비중 차트 또는 테이블
    - 카테고리별(매장/배달앱/테이크아웃) 매출 분석

12. **빠른 실행 링크** (`src/components/dashboard/quick-actions.tsx`)
    - 매출 등록, 비용 등록, 고정비 관리 바로가기
    - 아이콘 + 설명 텍스트
    - shadcn/ui Card 활용

**완료 기준:**
- PieChart 비용 구조 정상 렌더링
- 채널별 매출 분석 정상 표시
- 빠른 실행 링크 네비게이션 동작
- 전체 반응형 레이아웃 (모바일/태블릿/데스크톱)

---

## 기술 접근 방식

### 데이터 페칭 아키텍처

```
[Server Component: dashboard/page.tsx]
  |-- getCurrentBusinessId()
  |-- getMonthlyKpi(businessId, selectedMonth)
  |-- getMonthlyTrend(businessId, 6 or 12)
  |-- getRevenueByChannel(businessId, selectedMonth)
  |-- getExpenseBreakdown(businessId, selectedMonth)
  |
  v
[Client Components (use client)]
  |-- <MonthPicker basePath="/dashboard" />
  |-- <KpiSummaryCards data={...} prevData={...} />
  |-- <SurvivalScoreWidget score={...} breakdown={...} />
  |-- <RevenueTrendChart data={trendData} />
  |-- <RevenueExpenseChart data={trendData} />
  |-- <KpiTrendChart data={trendData} />
  |-- <ExpenseBreakdownChart data={expenseBreakdown} />
  |-- <RevenueChannelBreakdown data={channelData} />
  |-- <QuickActions />
```

### 컴포넌트 전략

- Server Component에서 모든 데이터를 페칭하여 props로 전달
- "use client"는 Recharts 차트 컴포넌트에만 적용
- shadcn/ui Card로 각 위젯 래핑
- 탭으로 차트 그룹핑 가능 (개요/추이/분석)

### 반응형 레이아웃

- 모바일 (< md): 1열, 위에서 아래로 스크롤
- 태블릿 (md): 2열 그리드
- 데스크톱 (lg): KPI 카드 4열, 차트 2열

### 생존점수 분해 계산

calculator.ts의 기존 로직을 참조하여 4개 구성 요소별 점수를 개별 계산:
- 순이익 점수 (max 30): profitRatio 기반
- 매출총이익률 점수 (max 25): grossMargin 임계값 기반
- 인건비 비율 점수 (max 20): laborRatio 임계값 기반
- 고정비 비율 점수 (max 25): fixedCostRatio 임계값 기반

### 금액 포맷팅

한국어 환경에 맞는 금액 표시:
- 1,000,000원 → "100만원" 또는 "1,000,000원"
- Intl.NumberFormat('ko-KR') 활용

---

## 파일 구조

```
src/
├── app/(dashboard)/dashboard/
│   └── page.tsx                          # [수정] 서버 컴포넌트 - 데이터 페칭 + 레이아웃
├── components/dashboard/
│   ├── kpi-summary-cards.tsx             # [신규] 4개 KPI 요약 카드
│   ├── survival-score-widget.tsx         # [신규] 생존점수 게이지 + 분해
│   ├── revenue-trend-chart.tsx           # [신규] 매출 추이 LineChart
│   ├── revenue-expense-chart.tsx         # [신규] 매출/비용 비교 BarChart
│   ├── kpi-trend-chart.tsx               # [신규] KPI 비율 추이 MultiLine
│   ├── expense-breakdown-chart.tsx       # [신규] 비용 구조 PieChart
│   ├── revenue-channel-breakdown.tsx     # [신규] 매출 채널 분석
│   ├── quick-actions.tsx                 # [신규] 빠른 실행 링크
│   └── dashboard-empty-state.tsx         # [신규] 데이터 없음 상태
├── lib/queries/
│   └── monthly-summary.ts               # [신규] 대시보드 쿼리 함수
└── types/
    └── dashboard.ts                      # [신규] 대시보드 타입 정의
```

**수정 파일 1개, 신규 파일 11개**

---

## 리스크 분석

| 리스크 | 영향도 | 발생확률 | 대응 방안 |
|--------|--------|----------|-----------|
| 데이터 없는 사용자의 빈 대시보드 UX | High | High | DashboardEmptyState 컴포넌트로 데이터 입력 유도 |
| Recharts SSR 호환성 | Medium | Low | "use client" 지시어로 클라이언트 전용 렌더링 |
| 12개월 트렌드 쿼리 성능 | Medium | Low | monthly_summaries의 UNIQUE 인덱스 활용 |
| 모바일 차트 가독성 | High | Medium | ResponsiveContainer + 모바일 전용 레이아웃 |
| 생존점수 게이지 커스텀 구현 | Medium | Medium | Recharts RadialBarChart 또는 CSS 원형 프로그레스 |

---

## 전문가 상담 권장

이 SPEC은 다음 도메인에 대한 전문가 상담을 권장합니다:

- **expert-frontend**: Recharts 차트 구현, 반응형 레이아웃, 생존점수 게이지 위젯
- **expert-backend**: 대시보드 전용 쿼리 함수 최적화 (다중 월 집계, 채널별 매출 집계)

---

## 의존성

### 선행 조건

- SPEC-AUTH-001 구현 완료 (인증, 사업장 등록, 대시보드 레이아웃)
- SPEC-DATA-001 구현 완료 (매출/비용/고정비 입력, KPI 자동 재계산)

### 후속 SPEC 연계

- SPEC-SIMULATION-XXX: What-if 시뮬레이션 UI (대시보드에 시뮬레이션 패널 추가)
- SPEC-AI-XXX: AI 경영 분석 (대시보드에 AI 인사이트 패널 추가)
- SPEC-CSV-XXX: CSV 업로드 시스템 (대시보드에 CSV 업로드 바로가기 추가)

<!-- TAG: SPEC-DASHBOARD-001 -->
