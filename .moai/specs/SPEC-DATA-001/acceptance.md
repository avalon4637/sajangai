---
id: SPEC-DATA-001
type: acceptance
version: "1.0.0"
---

# SPEC-DATA-001 인수 기준: 매출/비용 데이터 입력 시스템

## 테스트 시나리오

### Scenario 1: 매출 데이터 생성

```gherkin
Feature: 매출 데이터 입력

  Scenario: 유효한 매출 데이터를 성공적으로 저장한다
    Given 사용자가 로그인하고 사업장이 등록된 상태이다
    And 사용자가 "/dashboard/revenue" 페이지에 접속한다
    When 사용자가 날짜에 "2026-02-15"를 선택한다
    And 금액에 "1500000"을 입력한다
    And 채널에 "배달의민족"을 입력한다
    And 카테고리에 "배달 매출"을 입력한다
    And "저장" 버튼을 클릭한다
    Then revenues 테이블에 새 레코드가 삽입된다
    And 매출 목록에 방금 입력한 데이터가 표시된다
    And 금액이 "1,500,000원" 형식으로 포맷팅되어 표시된다
    And 2026년 2월의 monthly_summaries가 자동 재계산된다

  Scenario: 필수 필드 누락 시 검증 에러를 표시한다
    Given 사용자가 "/dashboard/revenue" 페이지에 접속한다
    When 사용자가 날짜를 선택하지 않고 "저장" 버튼을 클릭한다
    Then 날짜 필드에 인라인 에러 메시지가 표시된다
    And revenues 테이블에 레코드가 삽입되지 않는다

  Scenario: 금액이 0 이하일 때 검증 에러를 표시한다
    Given 사용자가 "/dashboard/revenue" 페이지에 접속한다
    When 사용자가 금액에 "0"을 입력한다
    And "저장" 버튼을 클릭한다
    Then "금액은 1원 이상이어야 합니다" 에러 메시지가 표시된다

  Scenario: 미래 날짜 입력 시 검증 에러를 표시한다
    Given 오늘 날짜가 "2026-02-19"이다
    When 사용자가 날짜에 "2026-03-01"을 선택한다
    And "저장" 버튼을 클릭한다
    Then "미래 날짜는 입력할 수 없습니다" 에러 메시지가 표시된다
```

### Scenario 2: 매출 데이터 수정 및 삭제

```gherkin
Feature: 매출 데이터 수정 및 삭제

  Scenario: 기존 매출 데이터를 수정한다
    Given 사용자가 "/dashboard/revenue" 페이지에 접속한다
    And 매출 목록에 "2026-02-15 / 1,500,000원 / 배달의민족" 레코드가 존재한다
    When 사용자가 해당 레코드의 "수정" 버튼을 클릭한다
    Then 입력 폼이 해당 레코드의 데이터로 채워진 수정 모드로 전환된다
    When 사용자가 금액을 "2000000"으로 변경한다
    And "저장" 버튼을 클릭한다
    Then revenues 테이블의 해당 레코드가 업데이트된다
    And 매출 목록에 "2,000,000원"으로 갱신되어 표시된다
    And 해당 월의 monthly_summaries가 자동 재계산된다

  Scenario: 매출 데이터를 삭제한다
    Given 매출 목록에 레코드가 1건 존재한다
    When 사용자가 해당 레코드의 "삭제" 버튼을 클릭한다
    Then "정말 삭제하시겠습니까?" 확인 다이얼로그가 표시된다
    When 사용자가 "삭제" 확인 버튼을 클릭한다
    Then revenues 테이블에서 해당 레코드가 삭제된다
    And 매출 목록이 갱신되어 빈 상태 메시지가 표시된다
    And 해당 월의 monthly_summaries가 자동 재계산된다

  Scenario: 삭제 확인에서 취소한다
    Given 매출 목록에 레코드가 존재한다
    When 사용자가 "삭제" 버튼을 클릭한다
    And 확인 다이얼로그에서 "취소" 버튼을 클릭한다
    Then 레코드가 삭제되지 않고 유지된다
```

### Scenario 3: 비용 데이터 관리

```gherkin
Feature: 비용 데이터 입력 및 관리

  Scenario: 변동비를 입력한다
    Given 사용자가 "/dashboard/expense" 페이지에 접속한다
    When 사용자가 날짜에 "2026-02-10"을 선택한다
    And 유형에서 "변동비"를 선택한다
    And 카테고리에 "식재료"를 입력한다
    And 금액에 "500000"을 입력한다
    And "저장" 버튼을 클릭한다
    Then expenses 테이블에 type="variable" 레코드가 삽입된다
    And 비용 목록에 "변동비" 뱃지와 함께 표시된다
    And 해당 월의 monthly_summaries가 자동 재계산된다

  Scenario: 고정비를 입력한다
    Given 사용자가 "/dashboard/expense" 페이지에 접속한다
    When 사용자가 유형에서 "고정비"를 선택한다
    Then 카테고리 필드의 플레이스홀더가 "임대료, 관리비 등"으로 변경된다
    When 사용자가 카테고리에 "매장 관리비"를 입력한다
    And 금액에 "200000"을 입력한다
    And "저장" 버튼을 클릭한다
    Then expenses 테이블에 type="fixed" 레코드가 삽입된다

  Scenario: 카테고리 미입력 시 에러를 표시한다
    Given 사용자가 "/dashboard/expense" 페이지에 접속한다
    When 카테고리를 입력하지 않고 "저장" 버튼을 클릭한다
    Then "카테고리를 입력해주세요" 에러 메시지가 표시된다
```

### Scenario 4: 고정비 관리

```gherkin
Feature: 고정비 등록 및 관리

  Scenario: 인건비 고정비를 등록한다
    Given 사용자가 "/dashboard/fixed-costs" 페이지에 접속한다
    When 사용자가 카테고리에 "직원 급여"를 입력한다
    And 금액에 "2500000"을 입력한다
    And "인건비" 체크박스를 선택한다
    And "저장" 버튼을 클릭한다
    Then fixed_costs 테이블에 is_labor=true 레코드가 삽입된다
    And 고정비 목록에 "인건비" 뱃지와 함께 표시된다
    And 인건비 합계에 2,500,000원이 반영된다

  Scenario: 비인건비 고정비를 등록한다
    Given 사용자가 "/dashboard/fixed-costs" 페이지에 접속한다
    When 사용자가 카테고리에 "임대료"를 입력한다
    And 금액에 "1000000"을 입력한다
    And "인건비" 체크박스를 선택하지 않는다
    And "저장" 버튼을 클릭한다
    Then fixed_costs 테이블에 is_labor=false 레코드가 삽입된다
    And 고정비 합계에 1,000,000원이 반영된다
    And 인건비 합계에는 반영되지 않는다

  Scenario: 고정비 삭제 후 KPI 재계산
    Given 고정비 목록에 "직원 급여 / 2,500,000원 / 인건비" 레코드가 존재한다
    When 사용자가 해당 레코드를 삭제한다
    Then 해당 레코드가 고정비 목록에서 제거된다
    And 인건비 합계가 감소한다
    And 관련 월의 monthly_summaries가 자동 재계산된다
```

### Scenario 5: 월별 필터링

```gherkin
Feature: 월별 데이터 필터링

  Scenario: 특정 월의 매출만 조회한다
    Given 매출 데이터가 2026년 1월과 2월에 각각 존재한다
    And 사용자가 "/dashboard/revenue" 페이지에 접속한다
    When 사용자가 월 필터를 "2026-01"로 변경한다
    Then 매출 목록에 2026년 1월 데이터만 표시된다
    And URL 쿼리 파라미터가 "?month=2026-01"로 변경된다

  Scenario: 현재 월이 기본 필터로 적용된다
    Given 현재 날짜가 2026년 2월이다
    When 사용자가 "/dashboard/revenue" 페이지에 접속한다
    Then 2026년 2월 매출 데이터가 기본으로 표시된다
```

### Scenario 6: KPI 자동 재계산 정합성

```gherkin
Feature: 월별 KPI 자동 재계산

  Scenario: 매출과 비용 데이터를 기반으로 KPI를 계산한다
    Given 2026년 2월에 매출이 총 5,000,000원이다
    And 2026년 2월에 변동비가 총 2,000,000원이다
    And 고정비가 총 1,500,000원이다 (그중 인건비 800,000원)
    When 매출 또는 비용 데이터가 변경된다
    Then monthly_summaries의 2026-02 레코드가 다음과 같이 갱신된다:
      | 필드              | 값         |
      | total_revenue     | 5000000    |
      | total_expense     | 2000000    |
      | total_fixed_cost  | 1500000    |
      | total_labor_cost  | 800000     |
      | gross_profit      | 3000000    |
      | net_profit        | 1500000    |
      | gross_margin      | 60.00      |
      | labor_ratio       | 16.00      |
      | fixed_cost_ratio  | 30.00      |
    And survival_score가 0~100 범위 내 값으로 계산된다
```

### Scenario 7: Server Action 에러 처리

```gherkin
Feature: Server Action 에러 핸들링

  Scenario: 네트워크 에러 시 사용자에게 한국어 에러 메시지를 표시한다
    Given 사용자가 매출 입력 폼에 유효한 데이터를 입력한다
    When Supabase 연결에 실패한다
    Then "저장에 실패했습니다. 다시 시도해주세요" 에러 메시지가 표시된다
    And 입력한 데이터가 폼에 유지된다

  Scenario: 인증 만료 시 로그인 페이지로 리다이렉트한다
    Given 사용자의 세션이 만료된 상태이다
    When 사용자가 데이터를 저장하려고 시도한다
    Then 시스템은 "/auth/login" 페이지로 리다이렉트한다
```

---

## Quality Gate (품질 게이트)

### 기능 요구사항 체크리스트

- [ ] 매출 데이터 CRUD (생성/조회/수정/삭제)
- [ ] 비용 데이터 CRUD (생성/조회/수정/삭제)
- [ ] 고정비 데이터 CRUD (생성/조회/수정/삭제)
- [ ] 월별 필터링 동작
- [ ] KPI 자동 재계산 동작
- [ ] 사이드바 네비게이션 3개 메뉴 추가
- [ ] 폼 검증 (Zod 스키마) 동작
- [ ] 삭제 확인 다이얼로그 동작
- [ ] 빈 상태 UI 표시
- [ ] 금액 천 단위 콤마 포맷팅

### 비기능 요구사항 체크리스트

- [ ] 모든 UI 텍스트가 한국어
- [ ] TypeScript strict 모드 에러 없음
- [ ] ESLint 경고/에러 없음
- [ ] Server Action에서만 데이터 변이 (클라이언트 직접 변이 금지)
- [ ] RLS 정책으로 데이터 격리 보장
- [ ] 응답 시간: 목록 조회 1초 이내, CRUD 작업 2초 이내

### 테스트 커버리지

- [ ] Zod 스키마 단위 테스트 (data-entry.test.ts)
- [ ] Server Action 단위 테스트 (actions/*.test.ts)
- [ ] KPI 재계산 로직 테스트 (kpi-sync.test.ts)
- [ ] 쿼리 함수 테스트 (queries/*.test.ts)
- [ ] 목표 커버리지: lib/ 디렉토리 85% 이상

### Definition of Done

1. 모든 Scenario의 Given-When-Then이 수동 또는 자동 테스트를 통해 검증됨
2. TypeScript 빌드(`pnpm build`) 성공
3. ESLint(`pnpm lint`) 경고 없음
4. Vitest 테스트(`pnpm test`) 전체 통과
5. 3개 페이지(매출/비용/고정비)에서 CRUD가 정상 동작함
6. KPI 재계산이 데이터 변경 시 자동으로 수행됨
7. 사이드바에서 3개 페이지 간 네비게이션이 정상 동작함

<!-- TAG: SPEC-DATA-001 -->
