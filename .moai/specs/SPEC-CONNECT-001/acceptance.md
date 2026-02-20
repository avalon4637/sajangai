---
id: SPEC-CONNECT-001
type: acceptance
version: "1.0.0"
---

# SPEC-CONNECT-001 수락 기준: 카드매출 자동 연계

---

## AC-01: 계정 연결

```gherkin
Scenario: 카드매출 연계 설정
  Given /dashboard/settings/connections 페이지에 접속한다
  When 여신금융협회 ID/PW를 입력하고 "연결" 버튼을 클릭한다
  Then 계정 유효성이 검증된다
  And 연결 상태가 "정상"으로 표시된다

Scenario: 잘못된 인증정보
  Given 연계 설정 페이지에 있다
  When 잘못된 ID/PW를 입력한다
  Then "인증에 실패했습니다. ID와 비밀번호를 확인해주세요" 오류가 표시된다
```

## AC-02: 수동 동기화

```gherkin
Scenario: 카드매출 동기화
  Given 카드매출 연계가 정상 연결되어 있다
  When "동기화" 버튼을 클릭하고 "최근 1개월"을 선택한다
  Then 카드매출 데이터가 조회된다
  And revenues 테이블에 새 데이터가 저장된다
  And "50건 동기화 완료" 결과가 표시된다
  And 해당 월의 KPI가 재계산된다

Scenario: 중복 데이터 처리
  Given 이미 동기화된 데이터가 있다
  When 동일 기간으로 동기화를 다시 실행한다
  Then 중복 데이터는 건너뛰고 새 데이터만 추가된다
  And "3건 추가, 47건 건너뜀" 결과가 표시된다
```

## AC-03: 보안

```gherkin
Scenario: 인증정보 암호화
  Given 사용자가 API 계정을 연결했다
  Then 인증정보는 AES-256으로 암호화되어 저장된다
  And DB에서 직접 조회해도 원문을 알 수 없다

Scenario: RLS 데이터 격리
  Given 사용자 A와 사용자 B가 각각 계정을 연결했다
  Then 사용자 A는 자신의 연결 정보만 볼 수 있다
  And 사용자 B의 연결 정보에 접근할 수 없다
```

<!-- TAG: SPEC-CONNECT-001 -->
