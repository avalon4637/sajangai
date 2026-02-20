---
id: SPEC-AI-001
type: acceptance
version: "1.0.0"
---

# SPEC-AI-001 수락 기준: AI 경영 분석 인사이트

---

## AC-01: AI 분석 요청

```gherkin
Scenario: 분석 시작
  Given 대시보드에 현재 월 KPI 데이터가 있다
  When "AI 분석 시작" 버튼을 클릭한다
  Then 로딩 인디케이터가 표시된다
  And Claude의 분석 결과가 실시간으로 스트리밍된다

Scenario: 데이터 없는 경우
  Given 현재 월 KPI 데이터가 없다
  When AI 분석 위젯을 본다
  Then "데이터를 먼저 입력해주세요" 메시지가 표시된다
  And "AI 분석 시작" 버튼이 비활성화된다
```

## AC-02: 스트리밍 응답

```gherkin
Scenario: 실시간 스트리밍
  Given AI 분석이 시작되었다
  When 응답이 스트리밍된다
  Then 텍스트가 실시간으로 표시된다
  And 마크다운 형식이 렌더링된다

Scenario: 분석 완료
  Given 스트리밍이 완료되었다
  Then 로딩 인디케이터가 사라진다
  And "다시 분석" 버튼이 표시된다

Scenario: API 오류
  Given API 호출 중 오류가 발생했다
  Then "분석 중 오류가 발생했습니다" 메시지가 표시된다
  And "다시 시도" 버튼이 표시된다
```

## AC-03: 분석 내용 품질

```gherkin
Scenario: 분석 내용 구성
  Given KPI 데이터가 제공되었다
  When 분석이 완료된다
  Then 다음 내용이 포함된다:
    | 항목 | 설명 |
    | 경영 현황 요약 | 현재 상태 해석 |
    | 리스크 경고 | 주의 필요 영역 |
    | 개선 제안 | 실행 가능한 액션 1~2개 |
```

<!-- TAG: SPEC-AI-001 -->
