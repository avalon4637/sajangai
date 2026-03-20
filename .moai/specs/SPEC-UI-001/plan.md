---
id: SPEC-UI-001
type: plan
version: "1.0.0"
status: draft
created: "2026-03-20"
updated: "2026-03-20"
tags: [ui, chat, review, landing, streaming, shadcn]
---

# SPEC-UI-001: Implementation Plan

## 1. Overview

3건의 UI-백엔드 연결 갭을 수정하여 사용자가 모든 AI 에이전트 기능에 접근할 수 있도록 한다.

## 2. Milestones

### Milestone 1: 점장 Q&A 채팅 UI [Priority High - Primary Goal]

**기술 접근**

SSE 스트리밍 채팅 UI를 구현한다. 기존 `/api/chat/route.ts`의 SSE 응답을 `fetch` API + `ReadableStream`으로 소비하는 클라이언트 컴포넌트를 생성한다.

**작업 분해**

1. `chat/page.tsx` 서버 컴포넌트 생성
   - Supabase Auth 인증 확인
   - 사업체 정보 로딩
   - `ChatClient` 클라이언트 컴포넌트 렌더링

2. `chat/chat-client.tsx` 클라이언트 컴포넌트 생성
   - 메시지 목록 상태 관리 (`useState<Message[]>`)
   - 입력 폼 (shadcn/ui `Input` + `Button`)
   - SSE 스트리밍 처리 (`fetch` + `ReadableStream` + `TextDecoder`)
   - 스트리밍 중 로딩 인디케이터
   - 자동 스크롤 (`useRef` + `scrollIntoView`)
   - 에러 처리 및 재시도

3. 사이드바 메뉴 항목 추가
   - `sidebar.tsx`에 "AI 채팅" 항목 추가 (MessageSquare 아이콘)
   - `mobile-header.tsx`에 동일 항목 추가

**아키텍처 방향**

```
[ChatClient] --fetch POST--> [/api/chat/route.ts] --SSE Stream--> [ChatClient]
     |                              |
     |                    [jeongjang-engine.ts]
     |                    [jeongjang-prompts.ts]
     |                              |
     +--- useState(messages) <------+
```

**리스크 및 대응**

| 리스크 | 영향 | 대응 |
|--------|------|------|
| SSE 스트리밍 파싱 오류 | 메시지 깨짐 | TextDecoder 청크 병합 로직 구현 |
| 긴 응답 시 메모리 증가 | 성능 저하 | 메시지 히스토리 최대 개수 제한 |
| 네트워크 끊김 | 사용자 혼란 | 연결 상태 표시 + 자동 재시도 |

---

### Milestone 2: 리뷰 AI 답글 버튼 연결 [Priority High - Primary Goal]

**기술 접근**

기존 `review/page-client.tsx`의 빈 버튼 핸들러를 구현하고, 리뷰 답글 수정/발행을 위한 API 엔드포인트를 추가한다.

**작업 분해**

1. "AI 답글 생성" 버튼 추가 및 연결
   - 페이지 상단에 "AI 답글 생성" 버튼 배치
   - `/api/dapjangi/process` POST 호출
   - 처리 중 로딩 상태 표시
   - 완료 후 리뷰 목록 갱신 (`revalidatePath`)

2. "수정하기" 버튼 onClick 핸들러 구현
   - 인라인 편집 모드 토글 (`useState<string | null>(editingId)`)
   - shadcn/ui `Textarea`로 답글 텍스트 편집
   - 저장 시 `/api/reviews/[id]/reply` PATCH 호출
   - 취소 시 원래 텍스트 복원

3. "발행하기" 버튼 onClick 핸들러 구현
   - 확인 다이얼로그 (shadcn/ui `AlertDialog`)
   - `/api/reviews/[id]/publish` POST 호출
   - 성공 시 상태 업데이트 + toast 알림

4. 신규 API 엔드포인트 생성
   - `src/app/api/reviews/[id]/reply/route.ts` - PATCH (답글 수정)
   - `src/app/api/reviews/[id]/publish/route.ts` - POST (답글 발행)

**아키텍처 방향**

```
[ReviewPageClient]
    |-- "AI 답글 생성" --> POST /api/dapjangi/process --> revalidate
    |-- "수정하기"     --> inline edit --> PATCH /api/reviews/[id]/reply
    |-- "발행하기"     --> confirm dialog --> POST /api/reviews/[id]/publish
```

**리스크 및 대응**

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 배치 처리 시간 초과 | 사용자 이탈 | 진행률 표시 + 타임아웃 안내 |
| 동시 수정 충돌 | 데이터 손실 | Optimistic locking (updated_at 확인) |
| 발행 후 롤백 불가 | 잘못된 답글 게시 | 발행 전 확인 다이얼로그 필수 |

---

### Milestone 3: 랜딩 페이지 네비게이션 보완 [Priority Low - Secondary Goal]

**기술 접근**

최소한의 코드 변경으로 네비게이션 누락을 수정한다.

**작업 분해**

1. `nav.tsx` 로고 Link 감싸기
   - "사장 AI" 텍스트를 `<Link href="/">` 로 래핑
   - 기존 스타일 유지

2. `footer.tsx` 링크 추가
   - 이용약관 (`/terms`), 개인정보처리방침 (`/privacy`), 문의하기 (`mailto:`) 링크
   - 기존 푸터 레이아웃 내 적절한 위치에 배치

3. Legal 페이지 생성 (placeholder)
   - `src/app/(legal)/terms/page.tsx` - 이용약관 placeholder
   - `src/app/(legal)/privacy/page.tsx` - 개인정보처리방침 placeholder

**리스크 및 대응**

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 낮은 우선순위로 누락 가능 | UX 미완성 | Milestone 1,2 완료 후 반드시 수행 |

---

## 3. Expert Consultation Recommendations

### Frontend Expert (expert-frontend)

이 SPEC은 SSE 스트리밍 채팅 UI 구현을 포함하므로 expert-frontend 상담을 권장합니다.

**상담 영역:**
- SSE 스트리밍을 React 19 + Next.js 16 App Router에서 소비하는 최적 패턴
- 채팅 UI의 자동 스크롤 및 메시지 렌더링 최적화
- shadcn/ui 컴포넌트 조합 전략

### Backend Expert (expert-backend)

리뷰 답글 수정/발행 API 엔드포인트 설계를 위해 expert-backend 상담을 권장합니다.

**상담 영역:**
- `/api/reviews/[id]/reply` PATCH 엔드포인트 설계
- `/api/reviews/[id]/publish` POST 엔드포인트 설계
- Supabase RLS 정책과의 호환성 확인

## 4. Implementation Order

```
[Milestone 1: 채팅 UI]  ──parallel──  [Milestone 2: 리뷰 버튼]
         \                                    /
          \                                  /
           +──── [Milestone 3: 랜딩 보완] ──+
```

- Milestone 1과 2는 독립적이므로 병렬 수행 가능
- Milestone 3은 마지막에 수행 (의존성 없음, 낮은 우선순위)

## 5. Definition of Done

- [ ] `/chat` 경로에서 점장 에이전트와 SSE 스트리밍 채팅이 동작한다
- [ ] 사이드바에 "AI 채팅" 메뉴가 표시되고 클릭 시 채팅 페이지로 이동한다
- [ ] 리뷰 페이지에서 "AI 답글 생성" 버튼이 동작한다
- [ ] "수정하기" 버튼으로 답글을 인라인 편집하고 저장할 수 있다
- [ ] "발행하기" 버튼으로 답글을 발행할 수 있다
- [ ] 랜딩 페이지 로고 클릭 시 홈으로 이동한다
- [ ] 푸터에 약관/개인정보/문의 링크가 표시된다
- [ ] 모든 새 UI는 shadcn/ui 컴포넌트를 사용한다
- [ ] 인증되지 않은 사용자는 채팅에 접근할 수 없다
