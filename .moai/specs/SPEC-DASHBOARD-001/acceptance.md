---
id: SPEC-DASHBOARD-001
type: acceptance
version: "1.0.0"
---

# SPEC-DASHBOARD-001 수락 기준: KPI 대시보드 시스템

---

## AC-01: KPI 요약 카드

### Scenario: 현재 월 KPI 요약 표시

```gherkin
Given 사용자가 2026년 2월에 다음 데이터를 입력했다:
  | 항목 | 금액 |
  | 총매출 | 10,000,000원 |
  | 변동비 | 4,000,000원 |
  | 고정비 | 3,000,000원 |
  | 인건비 | 2,000,000원 |
When 사용자가 /dashboard 페이지에 접속한다
Then 다음 KPI 카드가 표시된다:
  | 카드 | 값 |
  | 총매출 | 10,000,000원 |
  | 총비용 | 7,000,000원 |
  | 순이익 | 3,000,000원 |
  | 생존점수 | 계산된 점수 |
And 각 카드에 전월 대비 증감률(%)이 표시된다
```

### Scenario: 전월 데이터가 없는 경우

```gherkin
Given 2026년 1월 데이터가 monthly_summaries에 없다
And 2026년 2월 데이터는 존재한다
When 2026년 2월 대시보드를 본다
Then KPI 카드에 2월 값이 표시된다
And 증감률은 표시되지 않는다 (비교 데이터 없음)
```

### Scenario: 데이터가 없는 경우 (Empty State)

```gherkin
Given 선택된 월의 monthly_summaries 데이터가 없다
When 대시보드에 접속한다
Then 모든 KPI 값이 0으로 표시된다
And "아직 입력된 데이터가 없습니다" 메시지가 표시된다
And 데이터 입력 페이지 바로가기 링크가 제공된다
```

### Scenario: 순이익 양수/음수 색상

```gherkin
Given 순이익이 3,000,000원 (양수)이다
When 대시보드에 접속한다
Then 순이익 카드는 초록색 계열로 표시된다

Given 순이익이 -500,000원 (음수)이다
When 대시보드에 접속한다
Then 순이익 카드는 빨간색 계열로 표시된다
```

---

## AC-02: 생존점수 위젯

### Scenario: 생존점수 시각화 및 구성 요소 분해

```gherkin
Given 현재 월 KPI가 다음과 같다:
  | 지표 | 값 |
  | grossMargin | 60% |
  | laborRatio | 20% |
  | fixedCostRatio | 30% |
  | netProfit | 3,000,000원 |
  | survivalScore | 82.5 |
When 대시보드에 접속한다
Then 게이지 차트에 82.5가 표시된다
And "우수" 상태가 파란색으로 표시된다
And 4개 구성 요소의 점수 분해가 표시된다:
  | 구성 요소 | 최대 점수 | 획득 점수 |
  | 순이익 | 30 | 계산값 |
  | 매출총이익률 | 25 | 25 (>=60%) |
  | 인건비 비율 | 20 | 20 (<=20%) |
  | 고정비 비율 | 25 | 25 (<=30%) |
```

### Scenario: 생존점수 색상 구간

```gherkin
Given 생존점수가 25점이다
When 대시보드에 접속한다
Then "위험" 상태가 빨간색으로 표시된다

Given 생존점수가 45점이다
When 대시보드에 접속한다
Then "주의" 상태가 노란색으로 표시된다

Given 생존점수가 72점이다
When 대시보드에 접속한다
Then "양호" 상태가 초록색으로 표시된다

Given 생존점수가 90점이다
When 대시보드에 접속한다
Then "우수" 상태가 파란색으로 표시된다
```

---

## AC-03: 매출/비용 비교 차트

### Scenario: 매출 추이 차트 표시

```gherkin
Given 최근 6개월 동안 monthly_summaries에 데이터가 있다:
  | year_month | total_revenue |
  | 2025-09 | 8,000,000 |
  | 2025-10 | 8,500,000 |
  | 2025-11 | 9,000,000 |
  | 2025-12 | 10,000,000 |
  | 2026-01 | 9,500,000 |
  | 2026-02 | 10,000,000 |
When 대시보드에 접속한다
Then LineChart에 6개 데이터 포인트가 표시된다
And X축에 월, Y축에 매출액이 표시된다
```

### Scenario: 매출/비용 비교 차트

```gherkin
Given 3개월간 매출 및 비용 데이터가 있다
When 대시보드에 접속한다
Then BarChart에 매출(파랑)과 비용(빨강) 막대가 나란히 표시된다
And 범례가 표시된다
```

### Scenario: 차트 기간 전환

```gherkin
Given 12개월간 데이터가 있다
When 기간 선택에서 "12개월"을 선택한다
Then 차트가 12개월 데이터로 갱신된다
```

### Scenario: 차트 데이터 부족

```gherkin
Given 1개월 데이터만 있다
When 추이 차트를 본다
Then "추이를 확인하려면 최소 2개월 이상의 데이터가 필요합니다" 메시지가 표시된다
```

---

## AC-04: KPI 추이 차트

### Scenario: KPI 비율 추이 표시

```gherkin
Given 최근 6개월의 monthly_summaries 데이터가 있다
When 대시보드에 접속한다
Then 멀티라인 차트에 다음 4개 지표가 표시된다:
  | 지표 | 색상 |
  | 매출총이익률 | 구분 가능한 색상 |
  | 인건비 비율 | 구분 가능한 색상 |
  | 고정비 비율 | 구분 가능한 색상 |
  | 생존점수 | 구분 가능한 색상 |
And 범례가 표시된다
And 툴팁으로 각 지표의 값을 확인할 수 있다
```

---

## AC-05: 비용 구조 분석

### Scenario: 비용 구조 파이차트

```gherkin
Given 선택된 월의 비용이 다음과 같다:
  | 구분 | 금액 |
  | 변동비 | 4,000,000원 |
  | 고정비 | 3,000,000원 (인건비 2,000,000원 + 기타 1,000,000원) |
When 대시보드에 접속한다
Then PieChart에 다음 비율이 표시된다:
  | 항목 | 비율 |
  | 변동비 | 57% |
  | 고정비 | 43% |
And 금액과 비율이 함께 표시된다
```

---

## AC-06: 매출 채널 분석

### Scenario: 채널별 매출 분석

```gherkin
Given 선택된 월의 매출이 다음과 같다:
  | 채널 | 금액 |
  | 카드 | 6,000,000원 |
  | 현금 | 2,000,000원 |
  | 지역화폐 | 2,000,000원 |
When 대시보드에 접속한다
Then 채널별 매출 비중이 차트 또는 테이블로 표시된다:
  | 채널 | 비율 |
  | 카드 | 60% |
  | 현금 | 20% |
  | 지역화폐 | 20% |
```

---

## AC-07: 월 선택기

### Scenario: 월 변경 시 대시보드 갱신

```gherkin
Given 2026년 2월 대시보드를 보고 있다
When MonthPicker에서 2026년 1월을 선택한다
Then URL이 /dashboard?month=2026-01로 변경된다
And 모든 KPI 카드, 차트, 분석이 2026년 1월 데이터로 갱신된다
```

---

## AC-08: 반응형 디자인

### Scenario: 모바일 레이아웃

```gherkin
Given 화면 너비가 375px이다
When 대시보드에 접속한다
Then KPI 카드가 1열로 세로 배치된다
And 차트가 전체 너비로 표시된다
And 스크롤로 모든 위젯에 접근 가능하다
```

### Scenario: 데스크톱 레이아웃

```gherkin
Given 화면 너비가 1440px이다
When 대시보드에 접속한다
Then KPI 카드가 4열로 배치된다
And 차트가 2열 그리드로 배치된다
```

---

## AC-09: 빠른 실행 링크

### Scenario: 데이터 입력 바로가기

```gherkin
Given 대시보드에 접속해 있다
When "매출 등록" 링크를 클릭한다
Then /dashboard/revenue 페이지로 이동한다

When "비용 등록" 링크를 클릭한다
Then /dashboard/expense 페이지로 이동한다

When "고정비 관리" 링크를 클릭한다
Then /dashboard/fixed-costs 페이지로 이동한다
```

---

## AC-10: 보안

### Scenario: 인증되지 않은 접근 차단

```gherkin
Given 사용자가 로그인하지 않았다
When /dashboard에 접속한다
Then /auth/login으로 리디렉션된다
```

### Scenario: 타인 데이터 격리

```gherkin
Given 사용자 A의 사업장 데이터만 있다
When 사용자 A가 대시보드에 접속한다
Then 사용자 A의 KPI만 표시된다
And 다른 사용자의 데이터는 절대 표시되지 않는다 (RLS 보장)
```

<!-- TAG: SPEC-DASHBOARD-001 -->
