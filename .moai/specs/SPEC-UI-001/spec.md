---
id: SPEC-UI-001
title: "UI-Feature Connection Gap Fix"
version: "1.0.0"
status: draft
created: "2026-03-20"
updated: "2026-03-20"
author: MoAI
priority: high
issue_number: 0
tags: [ui, chat, review, landing, streaming, shadcn]
related_specs: [SPEC-JEONGJANG-001, SPEC-DAPJANGI-001]
---

# SPEC-UI-001: UI-Feature Connection Gap Fix

## 1. Environment

### 1.1 현재 시스템 상태

- Next.js 16 App Router + React 19 + Supabase + shadcn/ui (new-york) + Tailwind CSS 4.x
- 7개 개발 단계 완료, 4개 AI 에이전트 시스템 구축 완료
- 백엔드 API 및 AI 엔진 구현 완료, 프론트엔드 연결 미완성 3건 발견

### 1.2 관련 파일 매핑

| 영역 | 백엔드 (READY) | 프론트엔드 (GAP) |
|------|---------------|-----------------|
| 점장 Q&A 채팅 | `/api/chat/route.ts`, `jeongjang-prompts.ts`, `jeongjang-engine.ts` | 채팅 페이지 없음, 사이드바 메뉴 없음 |
| 리뷰 AI 답글 | `/api/dapjangi/process/route.ts` | `review/page-client.tsx` 버튼 핸들러 미연결 |
| 랜딩 페이지 | N/A | `nav.tsx` 로고 Link 없음, `footer.tsx` 링크 없음 |

## 2. Assumptions

- [A1] `/api/chat/route.ts`의 SSE 스트리밍 응답 형식은 변경하지 않는다
- [A2] `jeongjang-prompts.ts`의 `buildChatContextPrompt()` 함수는 정상 동작한다
- [A3] `/api/dapjangi/process/route.ts`의 배치 처리 API는 정상 동작한다
- [A4] 리뷰 수정/발행을 위한 별도 API 엔드포인트가 필요할 수 있다
- [A5] 모든 새 UI 컴포넌트는 shadcn/ui (new-york) 스타일을 따른다
- [A6] 약관/개인정보 페이지는 placeholder 수준으로 생성한다

## 3. Requirements

### 3.1 모듈 1: 점장 Q&A 채팅 UI [CRITICAL]

**REQ-UI-001-01** (Ubiquitous)
시스템은 항상 `/chat` 경로에서 점장 에이전트와의 Q&A 채팅 인터페이스를 제공해야 한다.

**REQ-UI-001-02** (Event-Driven)
WHEN 사용자가 채팅 입력창에 메시지를 제출 THEN 시스템은 `/api/chat` 엔드포인트로 POST 요청을 전송하고 SSE 스트리밍 응답을 실시간으로 표시해야 한다.

**REQ-UI-001-03** (State-Driven)
IF AI 응답이 스트리밍 중인 상태 THEN 시스템은 로딩 인디케이터를 표시하고 추가 메시지 제출을 비활성화해야 한다.

**REQ-UI-001-04** (Ubiquitous)
시스템은 항상 대시보드 사이드바에 "AI 채팅" 메뉴 항목을 표시해야 한다.

**REQ-UI-001-05** (Unwanted)
시스템은 인증되지 않은 사용자에게 채팅 기능을 제공하지 않아야 한다.

### 3.2 모듈 2: 리뷰 AI 답글 버튼 연결 [CRITICAL]

**REQ-UI-001-06** (Event-Driven)
WHEN 사용자가 "AI 답글 생성" 버튼을 클릭 THEN 시스템은 `/api/dapjangi/process` 엔드포인트를 호출하여 선택된 리뷰에 대한 AI 답글을 생성해야 한다.

**REQ-UI-001-07** (Event-Driven)
WHEN 사용자가 리뷰 항목의 "수정하기" 버튼을 클릭 THEN 시스템은 해당 AI 답글을 인라인 편집 모드로 전환하여 텍스트 수정을 허용해야 한다.

**REQ-UI-001-08** (Event-Driven)
WHEN 사용자가 리뷰 항목의 "발행하기" 버튼을 클릭 THEN 시스템은 해당 AI 답글을 발행 상태로 업데이트하고 사용자에게 성공 피드백을 제공해야 한다.

**REQ-UI-001-09** (State-Driven)
IF AI 답글 생성이 진행 중인 상태 THEN 시스템은 해당 리뷰 항목에 로딩 상태를 표시하고 중복 요청을 방지해야 한다.

**REQ-UI-001-10** (Unwanted)
시스템은 AI 답글이 없는 리뷰에 대해 "수정하기" 또는 "발행하기" 버튼을 활성화하지 않아야 한다.

### 3.3 모듈 3: 랜딩 페이지 네비게이션 보완 [MINOR]

**REQ-UI-001-11** (Ubiquitous)
시스템은 항상 랜딩 페이지 네비게이션 바의 "사장 AI" 로고를 클릭하면 홈 페이지(`/`)로 이동하도록 해야 한다.

**REQ-UI-001-12** (Ubiquitous)
시스템은 항상 랜딩 페이지 푸터에 서비스 이용약관, 개인정보처리방침, 문의하기 링크를 제공해야 한다.

## 4. Specifications

### 4.1 기술 사양

| 항목 | 사양 |
|------|------|
| UI 프레임워크 | React 19 + shadcn/ui (new-york) |
| 스타일링 | Tailwind CSS 4.x |
| 채팅 스트리밍 | SSE (Server-Sent Events) via fetch API |
| 상태 관리 | React useState/useRef (로컬 상태) |
| 인증 | Supabase Auth (기존 패턴 활용) |
| 라우팅 | Next.js App Router |

### 4.2 새로 생성할 파일

| 파일 경로 | 목적 |
|-----------|------|
| `src/app/(dashboard)/chat/page.tsx` | 채팅 페이지 서버 컴포넌트 |
| `src/app/(dashboard)/chat/chat-client.tsx` | 채팅 클라이언트 컴포넌트 (SSE 스트리밍) |
| `src/app/(legal)/terms/page.tsx` | 이용약관 페이지 (placeholder) |
| `src/app/(legal)/privacy/page.tsx` | 개인정보처리방침 페이지 (placeholder) |

### 4.3 수정할 기존 파일

| 파일 경로 | 수정 내용 |
|-----------|----------|
| `src/app/(dashboard)/sidebar.tsx` | "AI 채팅" 메뉴 항목 추가 |
| `src/app/(dashboard)/mobile-header.tsx` | 모바일 채팅 메뉴 항목 추가 |
| `src/app/(dashboard)/review/page-client.tsx` | 수정/발행/AI 답글 생성 버튼 onClick 핸들러 연결 |
| `src/components/landing/nav.tsx` | 로고 텍스트를 `<Link href="/">` 로 감싸기 |
| `src/components/landing/footer.tsx` | 약관/개인정보/문의 링크 추가 |

### 4.4 API 엔드포인트 (기존 활용 + 신규)

| 엔드포인트 | 메서드 | 상태 | 용도 |
|-----------|--------|------|------|
| `/api/chat` | POST | 기존 | 점장 Q&A 스트리밍 채팅 |
| `/api/dapjangi/process` | POST | 기존 | AI 리뷰 답글 배치 생성 |
| `/api/reviews/[id]/reply` | PATCH | 신규 | 리뷰 답글 수정 |
| `/api/reviews/[id]/publish` | POST | 신규 | 리뷰 답글 발행 |

### 4.5 의존성

- 신규 패키지 설치 불필요 (기존 shadcn/ui + Tailwind CSS 활용)
- 기존 Supabase 클라이언트 및 인증 패턴 재사용

## 5. Traceability

| 요구사항 ID | 관련 SPEC | 관련 파일 |
|------------|-----------|----------|
| REQ-UI-001-01~05 | SPEC-JEONGJANG-001 | chat/page.tsx, chat-client.tsx, sidebar.tsx |
| REQ-UI-001-06~10 | SPEC-DAPJANGI-001 | review/page-client.tsx |
| REQ-UI-001-11~12 | N/A | nav.tsx, footer.tsx |
