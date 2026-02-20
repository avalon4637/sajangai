---
id: SPEC-IMPORT-001
type: acceptance
version: "1.0.0"
---

# SPEC-IMPORT-001 수락 기준: CSV 데이터 임포트 시스템

---

## AC-01: CSV 파일 업로드

```gherkin
Scenario: 유효한 CSV 파일 업로드
  Given /dashboard/import 페이지에 접속해 있다
  When 카드매출 CSV 파일(100행, 500KB)을 드래그 앤 드롭한다
  Then 파일이 업로드되고 파싱이 시작된다
  And 미리보기 테이블이 표시된다

Scenario: 잘못된 파일 형식
  Given /dashboard/import 페이지에 접속해 있다
  When .xlsx 파일을 업로드한다
  Then "CSV 파일만 업로드 가능합니다" 오류가 표시된다

Scenario: 파일 크기 초과
  Given /dashboard/import 페이지에 접속해 있다
  When 6MB CSV 파일을 업로드한다
  Then "파일 크기가 너무 큽니다 (최대 5MB)" 오류가 표시된다
```

## AC-02: 파싱 미리보기

```gherkin
Scenario: 정상 파싱 결과
  Given 카드매출 CSV가 업로드되었다
  When 파싱이 완료된다
  Then 날짜, 채널, 카테고리, 금액, 유형, 메모 컬럼이 표시된다
  And "100건 중 95건 파싱 성공" 요약이 표시된다

Scenario: 자동 채널 분류
  Given CSV에 "신한카드"가 포함된 행이 있다
  When 파싱이 완료된다
  Then 해당 행의 채널이 "카드"로 자동 분류된다

Scenario: 사용자 수정
  Given 미리보기 테이블이 표시되어 있다
  When 채널을 "기타"에서 "현금"으로 변경한다
  Then 변경 사항이 반영된다
```

## AC-03: 일괄 임포트

```gherkin
Scenario: 임포트 실행
  Given 95건의 유효한 파싱 결과가 있다
  When "임포트" 버튼을 클릭한다
  Then 95건이 revenues/expenses 테이블에 저장된다
  And 해당 월의 KPI가 자동 재계산된다
  And "95건 임포트 완료" 결과가 표시된다

Scenario: 중복 데이터 경고
  Given 동일 날짜/금액/채널의 데이터가 이미 존재한다
  When 임포트를 시도한다
  Then "3건의 중복 데이터가 감지되었습니다" 경고가 표시된다
```

<!-- TAG: SPEC-IMPORT-001 -->
