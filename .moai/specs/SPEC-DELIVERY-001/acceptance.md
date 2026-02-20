---
id: SPEC-DELIVERY-001
type: acceptance
version: "1.0.0"
---

# SPEC-DELIVERY-001 수락 기준: 배달앱 매출 자동 연계

---

## AC-01: 배달앱 계정 연결

```gherkin
Scenario: 배달의민족 연결
  Given /dashboard/settings/connections 페이지에 접속한다
  When 배달의민족 계정 정보를 입력하고 "연결"을 클릭한다
  Then 연결 상태가 "정상"으로 표시된다
  And "배달의민족" 아이콘이 활성화된다

Scenario: 다중 배달앱 연결
  Given 배민이 연결되어 있다
  When 추가로 쿠팡이츠 계정을 연결한다
  Then 배민과 쿠팡이츠 모두 "정상" 상태로 표시된다
```

## AC-02: 매출 데이터 동기화

```gherkin
Scenario: 배달 매출 동기화
  Given 배달의민족이 연결되어 있다
  When "동기화" 버튼을 클릭한다
  Then 배민 매출 데이터가 revenues 테이블에 저장된다:
    | 필드 | 값 |
    | channel | "배민" |
    | category | "배달" |
  And 배달 수수료가 expenses 테이블에 저장된다:
    | 필드 | 값 |
    | type | "variable" |
    | category | "배달수수료" |
  And KPI가 재계산된다
```

## AC-03: 배달앱 분석

```gherkin
Scenario: 배달앱별 매출 비중
  Given 배민, 쿠팡이츠의 매출 데이터가 있다:
    | 앱 | 매출 | 수수료 |
    | 배민 | 500만원 | 34만원 |
    | 쿠팡이츠 | 300만원 | 29.4만원 |
  When 대시보드에서 배달 분석 위젯을 본다
  Then 배달앱별 매출 비중이 표시된다:
    | 앱 | 비중 | 수수료율 | 순매출 |
    | 배민 | 62.5% | 6.8% | 466만원 |
    | 쿠팡이츠 | 37.5% | 9.8% | 270.6만원 |
```

## AC-04: 보안

```gherkin
Scenario: 배달앱 인증정보 보안
  Given 사용자가 배달앱 계정을 연결했다
  Then 인증정보는 암호화되어 저장된다
  And RLS 정책으로 다른 사용자의 연결 정보에 접근할 수 없다
```

<!-- TAG: SPEC-DELIVERY-001 -->
