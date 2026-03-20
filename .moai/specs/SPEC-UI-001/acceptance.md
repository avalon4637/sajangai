---
id: SPEC-UI-001
type: acceptance
version: "1.0.0"
status: draft
created: "2026-03-20"
updated: "2026-03-20"
tags: [ui, chat, review, landing, streaming, shadcn]
---

# SPEC-UI-001: Acceptance Criteria

## 1. 점장 Q&A 채팅 UI

### AC-01: 채팅 페이지 접근 및 인증

```gherkin
Scenario: 인증된 사용자가 채팅 페이지에 접근한다
  Given 사용자가 로그인한 상태이다
  And 사업체가 등록되어 있다
  When 사용자가 "/chat" 경로로 이동한다
  Then 채팅 인터페이스가 표시된다
  And 메시지 입력창이 활성화되어 있다
  And 환영 메시지 또는 빈 채팅 화면이 표시된다

Scenario: 미인증 사용자가 채팅 페이지에 접근한다
  Given 사용자가 로그인하지 않은 상태이다
  When 사용자가 "/chat" 경로로 이동한다
  Then 로그인 페이지로 리디렉션된다
```

### AC-02: 메시지 전송 및 SSE 스트리밍 응답

```gherkin
Scenario: 사용자가 점장에게 질문을 전송한다
  Given 사용자가 채팅 페이지에 있다
  When 사용자가 입력창에 "이번 달 매출 분석해줘"라고 입력한다
  And 전송 버튼을 클릭한다
  Then 사용자 메시지가 채팅 목록에 표시된다
  And 로딩 인디케이터가 표시된다
  And AI 응답이 실시간으로 스트리밍되어 한 글자씩 표시된다
  And 스트리밍 완료 후 로딩 인디케이터가 사라진다

Scenario: 스트리밍 중 추가 메시지 제출 방지
  Given AI 응답이 스트리밍 중이다
  When 사용자가 새 메시지를 입력하려 한다
  Then 입력창 또는 전송 버튼이 비활성화 상태이다
```

### AC-03: 사이드바 메뉴 항목

```gherkin
Scenario: 사이드바에서 채팅 메뉴로 이동한다
  Given 사용자가 대시보드의 아무 페이지에 있다
  When 사이드바에서 "AI 채팅" 메뉴 항목을 클릭한다
  Then "/chat" 경로의 채팅 페이지로 이동한다
  And "AI 채팅" 메뉴 항목이 활성 상태로 표시된다

Scenario: 모바일에서 채팅 메뉴로 이동한다
  Given 사용자가 모바일 화면(< 768px)에서 대시보드를 사용 중이다
  When 모바일 헤더 메뉴에서 "AI 채팅"을 선택한다
  Then "/chat" 경로의 채팅 페이지로 이동한다
```

---

## 2. 리뷰 AI 답글 버튼 연결

### AC-04: AI 답글 생성 버튼

```gherkin
Scenario: AI 답글을 일괄 생성한다
  Given 사용자가 리뷰 페이지에 있다
  And AI 답글이 없는 리뷰가 존재한다
  When 사용자가 "AI 답글 생성" 버튼을 클릭한다
  Then 로딩 상태가 표시된다
  And "/api/dapjangi/process" API가 호출된다
  And 처리 완료 후 리뷰 목록이 갱신된다
  And AI 답글이 생성된 리뷰에 답글이 표시된다

Scenario: AI 답글 생성 중 중복 요청 방지
  Given AI 답글 생성이 진행 중이다
  When 사용자가 "AI 답글 생성" 버튼을 다시 클릭한다
  Then 버튼이 비활성화 상태이어서 추가 요청이 발생하지 않는다
```

### AC-05: 답글 수정 기능

```gherkin
Scenario: AI 답글을 인라인 편집한다
  Given 리뷰에 AI 답글이 존재한다
  When 사용자가 "수정하기" 버튼을 클릭한다
  Then 답글 텍스트가 편집 가능한 Textarea로 전환된다
  And "저장" 및 "취소" 버튼이 표시된다

Scenario: 수정한 답글을 저장한다
  Given 사용자가 답글을 편집 중이다
  And 답글 텍스트를 수정했다
  When 사용자가 "저장" 버튼을 클릭한다
  Then "/api/reviews/[id]/reply" PATCH API가 호출된다
  And 수정된 답글이 저장되고 읽기 모드로 전환된다
  And 성공 토스트 메시지가 표시된다

Scenario: 답글 편집을 취소한다
  Given 사용자가 답글을 편집 중이다
  When 사용자가 "취소" 버튼을 클릭한다
  Then 편집 전 원래 텍스트가 복원된다
  And 읽기 모드로 전환된다
```

### AC-06: 답글 발행 기능

```gherkin
Scenario: AI 답글을 발행한다
  Given 리뷰에 AI 답글이 존재한다
  And 답글이 미발행 상태이다
  When 사용자가 "발행하기" 버튼을 클릭한다
  Then 발행 확인 다이얼로그가 표시된다
  When 사용자가 "확인"을 선택한다
  Then "/api/reviews/[id]/publish" POST API가 호출된다
  And 답글 상태가 "발행됨"으로 변경된다
  And 성공 토스트 메시지가 표시된다

Scenario: AI 답글이 없는 리뷰의 버튼 비활성화
  Given 리뷰에 AI 답글이 존재하지 않는다
  Then "수정하기" 버튼이 비활성화 상태이다
  And "발행하기" 버튼이 비활성화 상태이다
```

---

## 3. 랜딩 페이지 네비게이션 보완

### AC-07: 로고 네비게이션

```gherkin
Scenario: 랜딩 페이지 로고 클릭으로 홈 이동
  Given 사용자가 랜딩 페이지의 아무 섹션에 있다
  When 네비게이션 바의 "사장 AI" 로고를 클릭한다
  Then 페이지 최상단("/")으로 이동한다

Scenario: 로고에 커서를 올리면 클릭 가능함을 인지한다
  Given 사용자가 랜딩 페이지에 있다
  When "사장 AI" 로고에 마우스를 올린다
  Then 커서가 pointer로 변경된다
```

### AC-08: 푸터 링크

```gherkin
Scenario: 푸터에서 이용약관 페이지로 이동
  Given 사용자가 랜딩 페이지 푸터를 보고 있다
  When "이용약관" 링크를 클릭한다
  Then "/terms" 페이지가 표시된다
  And 이용약관 placeholder 콘텐츠가 표시된다

Scenario: 푸터에서 개인정보처리방침 페이지로 이동
  Given 사용자가 랜딩 페이지 푸터를 보고 있다
  When "개인정보처리방침" 링크를 클릭한다
  Then "/privacy" 페이지가 표시된다
  And 개인정보처리방침 placeholder 콘텐츠가 표시된다
```

---

## 4. Quality Gates

### 4.1 기능 검증

- [ ] 모든 AC 시나리오가 수동 테스트를 통과한다
- [ ] SSE 스트리밍이 Chrome, Safari, Firefox에서 동작한다
- [ ] 모바일 해상도(< 768px)에서 채팅 UI가 정상 표시된다

### 4.2 코드 품질

- [ ] 새 컴포넌트가 shadcn/ui 디자인 시스템을 따른다
- [ ] TypeScript 타입 에러가 없다 (`npx tsc --noEmit`)
- [ ] ESLint 경고가 없다 (`npx next lint`)

### 4.3 접근성

- [ ] 채팅 입력창에 적절한 `aria-label`이 있다
- [ ] 버튼에 접근 가능한 레이블이 있다
- [ ] 키보드 탐색으로 모든 인터랙션이 가능하다

### 4.4 에러 처리

- [ ] API 호출 실패 시 사용자에게 에러 메시지가 표시된다
- [ ] 네트워크 오류 시 재시도 안내가 제공된다
- [ ] 빈 상태(리뷰 없음, 채팅 없음)에 적절한 빈 화면이 표시된다

---

## 5. Verification Methods

| 검증 항목 | 방법 | 도구 |
|-----------|------|------|
| SSE 스트리밍 동작 | 수동 테스트 | 브라우저 DevTools Network 탭 |
| 버튼 핸들러 연결 | 수동 클릭 테스트 | 브라우저 |
| 인증 보호 | 비로그인 상태 접근 테스트 | 시크릿 모드 |
| 반응형 UI | 다양한 화면 크기 테스트 | Chrome DevTools |
| 타입 안전성 | TypeScript 컴파일 | `npx tsc --noEmit` |
| 코드 품질 | Lint 검사 | `npx next lint` |
