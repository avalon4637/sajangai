# Implementation Plan: 사용자별 AI 팀 멀티에이전트 시스템 (Phase 1-4)

## Context

sajang.ai의 랜딩 + 매출 분석 대시보드(mock) 구현 완료. 사용자가 자신만의 AI 팀(답장이/세리/바이럴)을 "고용"하여 서로 소통하며 매장을 운영하는 멀티에이전트 시스템 구현.

현재 AI는 단일 stateless 엔드포인트(`/api/ai/route.ts`)로 대화 이력/에이전트 개념/메모리 없음.

## 구현 범위
- **Phase 1-4**: DB 스키마 + 세리 엔진 + 세리 채팅 UI + 메모리 시스템 + 답장이 + 에이전트 간 통신
- **UI 스타일**: 카카오톡 스타일 말풍선 채팅 (에이전트 간 통신은 접을 수 있는 시스템 메시지)
- **Phase 5-6 (바이럴 + 자동화)**: 이번 스코프 밖

---

## 핵심 아키텍처 결정

### 1. 데이터베이스 스키마 (6개 신규 테이블)

```
agent_profiles      -- 사업장별 에이전트 프로필 (business_id + agent_type UNIQUE)
conversations       -- 대화 스레드 (에이전트별 또는 팀)
messages            -- 대화 메시지 (role: user/assistant/system)
agent_memory        -- 에이전트 장기 기억 (fact/preference/insight/decision)
agent_events        -- 에이전트 간 통신 이벤트 큐 (finding/request/response/alert)
agent_activity_log  -- 사용자에게 보여줄 활동 피드
```

모든 테이블에 `business_id` 포함 → 기존 RLS 패턴 동일 적용 → 사용자별 완전 격리

### 2. 3계층 비용 최적화 (Smart Router)

모든 상호작용이 3개 에이전트 호출 = 비용 3배. 이를 방지:

| 계층 | 방식 | API 호출 | 사용 시점 |
|------|------|---------|----------|
| 1 | 규칙 기반 라우팅 | 0회 | 사용자가 특정 에이전트에게 직접 대화, 데이터 변경 트리거 |
| 2 | Haiku 오케스트레이터 | 1회 (저비용) | 어떤 에이전트가 응답할지 불명확할 때 |
| 3 | 풀 오케스트레이션 | 1 + N회 | 팀 브리핑, 크로스 에이전트 분석 |

### 3. 에이전트 간 통신: 비동기 이벤트 큐

- `agent_events` 테이블이 이벤트 큐 역할
- 세리가 매출 급락 감지 → `agent_events`에 finding 발행 (target: dapjangi)
- 답장이는 **다음 호출 시** pending 이벤트를 확인하고 컨텍스트에 포함
- 즉시 호출하지 않음 → 비용 절감 (사용자가 직접 대화하거나 일일 보고 시 소비)
- Supabase Realtime으로 UI에만 실시간 알림 푸시

### 4. 3계층 메모리 시스템

| 계층 | 저장소 | 용도 | 비용 |
|------|--------|------|------|
| 단기 | API 컨텍스트 윈도우 | 현재 대화 최근 10개 메시지 | 메시지당 토큰 |
| 중기 | messages 테이블 | 전체 대화 이력 | 요약 시 1회 |
| 장기 | agent_memory 테이블 | 압축된 핵심 인사이트 (Haiku로 추출) | 매우 낮음 |

### 5. Vercel AI SDK Tool Use 활용

에이전트가 DB를 직접 조회할 수 있는 도구 제공:
- `getKpiTool` - KPI 데이터 조회
- `getRevenueTrendTool` - 매출 추이 조회
- `sendToAgentTool` - 다른 에이전트에게 이벤트 발행

### 6. 에이전트 캐릭터 설정

| 에이전트 | 성격 | 전문 분야 | 시작 멘트 스타일 |
|---------|------|----------|----------------|
| 답장이 | 꼼꼼, 세심 | 리뷰 감지, AI 답변, 리뷰 트렌드 | "사장님, 새로운 리뷰가..." |
| 세리 | 논리적, 간결 | 매출 분석, 이상 감지, KPI 해석 | "사장님, 데이터를 보니..." |
| 바이럴 | 창의적, 트렌디 | 마케팅 전략, 경쟁 분석, SNS | "사장님, 이런 아이디어..." |

각 에이전트 프롬프트에 **다른 에이전트와의 관계** 명시 (누구에게 뭘 요청하고, 누구로부터 뭘 받는지)

---

## 에이전트 간 캐스케이드 예시

```
매출 데이터 입력
  → [Smart Router] revenue 변경 → 세리 라우팅 (규칙, API 0회)
  → [세리] 분석: "지난주 대비 15% 하락" (API 1회)
  → [세리 → agent_events] finding: "매출 급락" (target: dapjangi)
  → [activity_log] "세리: 매출 15% 하락 감지"

사용자가 답장이와 대화
  → [답장이] pending 이벤트 확인 → 세리의 finding 컨텍스트 포함
  → [답장이] 분석: "부정 리뷰 3건, 키워드: 대기시간" (API 1회)
  → [답장이 → agent_events] finding: "부정 리뷰-매출 상관" (target: viral)

UI 활동 피드:
  "세리: 지난주 대비 매출 15% 하락 감지"
  "답장이: 부정 리뷰 3건과 상관관계 발견"
  "바이럴: 리뷰 대응 + SNS 전략 제안 (대기 중)"
```

---

## 서버 사이드 파일 구조

```
src/lib/agents/
  types.ts                  -- AgentType, AgentContext, AgentEvent 타입
  router.ts                 -- Smart Router (3계층)
  engine.ts                 -- 에이전트 실행 엔진 (streamText + tools)
  context-builder.ts        -- 컨텍스트 조립 (기억 + 이벤트 + 비즈니스 데이터)
  memory-extractor.ts       -- Haiku로 대화에서 핵심 기억 추출
  cost-guard.ts             -- 일일 API 호출/토큰 예산 관리
  event-publisher.ts        -- agent_events CRUD
  prompts/
    dapjangi.ts             -- 답장이 시스템 프롬프트
    seri.ts                 -- 세리 시스템 프롬프트
    viral.ts                -- 바이럴 시스템 프롬프트
    shared.ts               -- 공통 프롬프트 유틸리티
  tools/
    kpi-tools.ts            -- KPI/매출 조회 도구
    review-tools.ts         -- 리뷰 데이터 도구
    event-tools.ts          -- 에이전트 간 통신 도구

src/app/api/agents/
  [agentType]/chat/route.ts -- 에이전트별 채팅 API (스트리밍)
  [agentType]/memory/route.ts -- 에이전트 기억 조회
  events/route.ts           -- 에이전트 간 이벤트 피드
  activity/route.ts         -- 활동 로그
  orchestrate/route.ts      -- 오케스트레이터
```

## UI 구조

```
src/app/(dashboard)/agents/
  page.tsx                  -- AI 팀 대시보드 (3개 카드 + 활동 피드)
  dapjangi/page.tsx         -- 답장이 채팅
  seri/page.tsx             -- 세리 채팅
  viral/page.tsx            -- 바이럴 (Coming Soon)
  activity/page.tsx         -- 전체 활동 로그

src/components/agents/
  agent-team-dashboard.tsx  -- AI 팀 대시보드
  agent-card.tsx            -- 에이전트 카드
  agent-chat/
    chat-container.tsx      -- 채팅 컨테이너
    chat-message.tsx        -- 메시지 버블
    chat-input.tsx          -- 입력 UI
    agent-header.tsx        -- 에이전트 헤더
    event-bubble.tsx        -- 에이전트 간 통신 버블 (접기 가능)
  activity/
    activity-feed.tsx       -- 활동 피드
    activity-item.tsx       -- 활동 항목

src/stores/agent-store.ts   -- Zustand 스토어 (채팅, 활동, Realtime)
src/hooks/use-agent-realtime.ts -- Supabase Realtime 구독
```

## 사이드바 네비게이션

```
- 홈
- 매출 분석
- 매출 관리 / 비용 관리 / 고정비 관리
- 데이터 임포트 / 시뮬레이션
── AI 팀 ──────
- 답장이 (리뷰)
- 세리 (매출분석)
- 바이럴 (마케팅) [Coming Soon]
- 팀 활동 로그
```

---

## 구현 단계 (Phase 1-4)

### Phase 1: DB + 에이전트 엔진 코어

**신규 파일:**
- `supabase/migrations/00002_agent_tables.sql` - 6개 테이블 DDL + RLS
- `src/lib/agents/types.ts` - AgentType, AgentContext, AgentEvent 타입
- `src/lib/agents/engine.ts` - 에이전트 실행 엔진 (streamText + tools)
- `src/lib/agents/context-builder.ts` - 컨텍스트 조립
- `src/lib/agents/cost-guard.ts` - 일일 예산 관리
- `src/lib/agents/prompts/shared.ts` - 공통 프롬프트
- `src/lib/agents/prompts/seri.ts` - 세리 시스템 프롬프트
- `src/lib/agents/tools/kpi-tools.ts` - KPI/매출 조회 도구
- `src/lib/queries/agent.ts` - 에이전트 DB 쿼리
- `src/lib/actions/agent.ts` - 에이전트 서버 액션
- `src/app/api/agents/[agentType]/chat/route.ts` - 채팅 API

**재사용:** [monthly-summary.ts](src/lib/queries/monthly-summary.ts)의 getMonthlyKpi, getMonthlyTrend, getRevenueByChannel

### Phase 2: 세리 채팅 UI (카카오톡 스타일)

**신규 파일:**
- `src/stores/agent-store.ts` - Zustand 스토어
- `src/components/agents/agent-chat/chat-container.tsx` - 채팅 컨테이너
- `src/components/agents/agent-chat/chat-message.tsx` - 카톡 말풍선
- `src/components/agents/agent-chat/chat-input.tsx` - 메시지 입력
- `src/components/agents/agent-chat/agent-header.tsx` - 에이전트 헤더
- `src/components/agents/shared/agent-avatar.tsx` - 에이전트 아바타
- `src/components/agents/agent-team-dashboard.tsx` - AI 팀 대시보드
- `src/components/agents/agent-card.tsx` - 에이전트 카드
- `src/app/(dashboard)/agents/page.tsx` - AI 팀 대시보드 페이지
- `src/app/(dashboard)/agents/seri/page.tsx` - 세리 채팅 페이지
- `src/app/(dashboard)/agents/seri/page-client.tsx` - 세리 클라이언트

**수정:** [sidebar.tsx](src/app/(dashboard)/sidebar.tsx) - AI 팀 네비게이션 추가

### Phase 3: 메모리 시스템 + 답장이

**신규 파일:**
- `src/lib/agents/memory-extractor.ts` - Haiku 기반 기억 추출
- `src/lib/agents/prompts/dapjangi.ts` - 답장이 프롬프트
- `src/lib/agents/tools/review-tools.ts` - 리뷰 데이터 도구
- `src/app/api/agents/[agentType]/memory/route.ts` - 메모리 API
- `src/app/(dashboard)/agents/dapjangi/page.tsx` - 답장이 페이지
- `src/app/(dashboard)/agents/dapjangi/page-client.tsx`
- `src/app/(dashboard)/agents/viral/page.tsx` - 바이럴 Coming Soon

### Phase 4: 에이전트 간 통신 + 활동 피드

**신규 파일:**
- `src/lib/agents/router.ts` - Smart Router (3계층)
- `src/lib/agents/event-publisher.ts` - 이벤트 발행/소비
- `src/lib/agents/tools/event-tools.ts` - sendToAgent 도구
- `src/hooks/use-agent-realtime.ts` - Supabase Realtime 구독
- `src/components/agents/agent-chat/event-bubble.tsx` - 에이전트 간 통신 버블
- `src/components/agents/activity/activity-feed.tsx`
- `src/components/agents/activity/activity-item.tsx`
- `src/app/api/agents/events/route.ts`
- `src/app/api/agents/activity/route.ts`
- `src/app/api/agents/orchestrate/route.ts` - 오케스트레이터
- `src/app/(dashboard)/agents/activity/page.tsx` - 활동 로그 페이지

## 기존 코드 영향

- **변경**: `sidebar.tsx` (네비 추가), `types/database.ts` (타입 추가)
- **나머지 전부 신규 파일** → 기존 기능 파괴 없음
- **기존 `/api/ai`** 유지 (대시보드 위젯 호환)

## 기술 스택 (추가 의존성 없음)

기존 패키지만 활용: Vercel AI SDK (`ai`), Zustand (`zustand`), Supabase, Claude API

## Verification

1. Phase 1: `/api/agents/seri/chat` POST로 스트리밍 응답 확인
2. Phase 2: 세리 채팅 UI에서 카톡 스타일 대화 + KPI 도구 사용 확인
3. Phase 3: 답장이 대화 후 agent_memory에 기억 저장 확인
4. Phase 4: 세리 finding → 답장이 이벤트 소비 → 활동 로그 표시 확인
5. 전체: `npm run build` 성공, 기존 대시보드 정상 동작
