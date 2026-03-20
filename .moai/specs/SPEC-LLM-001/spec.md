---
id: SPEC-LLM-001
title: "LLM Architecture Overhaul - Intelligence & Data Farm"
version: "1.0.0"
status: draft
created: "2026-03-20"
updated: "2026-03-20"
author: MoAI
priority: critical
issue_number: 0
tags: [LLM, AI, Claude, Tool-Use, Memory, Benchmark, Data-Farm]
dependencies: [SPEC-AI-001, SPEC-DATA-001]
lifecycle: spec-anchored
---

# SPEC-LLM-001: LLM Architecture Overhaul - Intelligence & Data Farm

## 1. Environment (환경)

### 1.1 현재 시스템 상태

- **AI SDK**: `@ai-sdk/anthropic` v3.0.45, `ai` v6.0.91, `zod` v4.3.6
- **LLM 모델**: Claude Sonnet 4.6 (단일 모델, Haiku 미분배)
- **AI 에이전트 구조**: Supervisor(점장) + Sub-Agent 3명(세리, 답장이, 바이럴)
- **DB**: Supabase PostgreSQL (pgvector 확장 가능)
- **기존 테이블**: `agent_memory` (구현됨, 미사용), `store_context` (세리/답장이 저장, 점장 미읽기)

### 1.2 핵심 문제 진단

| 문제 | 현재 상태 | 영향 |
|------|----------|------|
| 데이터 활용률 극히 낮음 | 수집 데이터의 20% 미만 활용 | AI 응답이 피상적 |
| agent_memory 미사용 | 테이블 존재하나 읽지 않음 | 학습/개인화 불가 |
| store_context 미활용 | 점장이 세리/답장이 결과 미참조 | 교차 분석 부재 |
| 채팅 완전 stateless | 이전 대화 기억 불가 | 대화 맥락 단절 |
| 교차 분석 없음 | 리뷰<->매출 상관관계 미구현 | 심층 인사이트 부재 |
| 업종 벤치마크 없음 | 비교 기준 부재 | "잘하고 있는지" 판단 불가 |
| LLM 비용 과다 | 매출 대비 40-60% | 사업 지속성 위협 |

### 1.3 기술 스택

- **프레임워크**: Next.js 16 (App Router, Server Actions)
- **LLM SDK**: `@ai-sdk/anthropic` (cacheControl 지원), `ai` (generateObject, streamText)
- **스키마 검증**: Zod v4
- **DB**: Supabase PostgreSQL + pgvector
- **외부 API**: 국세청 사업자인증, 하이픈 API, 카카오 로컬 API, 국토부/소진공/통계청 공공 API

---

## 2. Assumptions (가정)

### 2.1 기술적 가정

- [A-TECH-01] `@ai-sdk/anthropic` v3.x의 `cacheControl` 옵션이 Prompt Caching을 정상 지원한다
- [A-TECH-02] Claude Sonnet 4.6이 Tool Use (function calling)를 안정적으로 처리한다
- [A-TECH-03] `generateObject()` + Zod 스키마가 기존 regex 파싱보다 안정적이다
- [A-TECH-04] Claude Haiku가 대화 요약, 감성 분석 배치 등 단순 태스크에 충분한 품질을 제공한다
- [A-TECH-05] pgvector 확장이 Supabase Free/Pro 플랜에서 사용 가능하다

### 2.2 비즈니스 가정

- [A-BIZ-01] 사업장 일일 LLM 비용을 $0.15 -> $0.05 이하로 절감해야 사업 지속 가능하다
- [A-BIZ-02] 유의미한 내부 벤치마크를 위해 최소 50개 이상 사업체 데이터가 필요하다
- [A-BIZ-03] 사업자번호 앞 3자리로 관할 세무서(약 130개)를 식별할 수 있다
- [A-BIZ-04] 사장님은 "왜?" + "그래서 뭘 해야 해?"를 원하지, 일반적 조언은 원하지 않는다

### 2.3 데이터 가정

- [A-DATA-01] 국세청 API 응답의 `b_sector`(업태)와 `b_type`(종목) 필드가 업종 분류에 활용 가능하다
- [A-DATA-02] 국토부 상가 임대 실거래 API가 지역/면적별 임대료 시세를 제공한다
- [A-DATA-03] 소진공 상권정보 API가 상권별 평균 매출/임대료/유동인구를 제공한다
- [A-DATA-04] 통계청 KOSIS OpenAPI가 업종별 비용 구조(항목별 비율)를 제공한다

---

## 3. Requirements (요구사항)

### Module 1: AI Infrastructure (Phase 1)

#### REQ-INF-001: 공통 Claude 클라이언트 유틸리티
시스템은 **항상** 모든 Claude API 호출을 단일 `claude-client.ts` 유틸리티를 통해 수행해야 한다.

- `callClaudeText()` - generateText 래퍼 (prompt caching, 에러 핸들링, 로깅)
- `callClaudeObject<T>()` - generateObject 래퍼 (Zod 스키마 검증)
- `callClaudeStream()` - streamText 래퍼
- 호출당 input/output 토큰 로깅 + 일일 비용 집계

#### REQ-INF-002: Prompt Caching
시스템은 **항상** `@ai-sdk/anthropic`의 `cacheControl` 옵션을 사용하여 system prompt를 캐싱해야 한다.

- 프롬프트 배치 순서: 공통(캐시) -> 업종벤치마크(캐시) -> 동적 데이터(비캐시)
- `providerOptions.anthropic.cacheControl: { type: "ephemeral" }` 적용

#### REQ-INF-003: Structured Outputs
**WHEN** AI가 구조화된 데이터를 반환해야 하는 경우 **THEN** `generateObject()` + Zod 스키마를 사용해야 한다.

- 교체 대상: proactive-diagnosis.ts, sentiment-analyzer.ts, brand-voice.ts, expense-classifier.ts, briefing-generator.ts
- 기존 `text.match(/\{[\s\S]*\}/)` regex 파싱 전면 교체
- 모든 AI 출력 스키마를 `schemas.ts`에 중앙 관리

시스템은 regex 기반 JSON 파싱을 사용**하지 않아야 한다**.

#### 파일 목록 (Module 1)

| 파일 | 작업 |
|------|------|
| `src/lib/ai/claude-client.ts` | **신규** - 공통 유틸리티 |
| `src/lib/ai/schemas.ts` | **신규** - Zod 스키마 중앙 관리 |
| `src/lib/ai/seri-engine.ts` | 수정 - claude-client 사용 |
| `src/lib/ai/briefing-generator.ts` | 수정 - generateObject |
| `src/lib/ai/proactive-diagnosis.ts` | 수정 - generateObject |
| `src/lib/ai/review-responder.ts` | 수정 - claude-client |
| `src/lib/ai/sentiment-analyzer.ts` | 수정 - generateObject |
| `src/lib/ai/brand-voice.ts` | 수정 - generateObject |
| `src/lib/ai/expense-classifier.ts` | 수정 - generateObject |

---

### Module 2: Intelligence Core (Phase 2)

#### REQ-INT-001: 비즈니스 프로필 엔진
시스템은 **항상** 각 사업장에 대해 ~500 토큰의 비즈니스 프로필을 유지해야 한다.

- 매일 자동 갱신 (`rebuildBusinessProfile()`)
- 정적 정보 (업종, 지역, 개업일)
- 동적 정보 (월평균 매출, 성장률, 배달 비중, 순이익률, 인건비 비율)
- 리뷰 프로필 (평균 별점, 별점 추세, 주요 불만 카테고리, 응답률)
- AI 학습 인사이트 (`agent_memory`에서 로드: 사장님 관심사, 과거 제안 반응, 사업 목표, 계절 패턴)
- 결과를 `store_context` 테이블에 `agent_type='profile'`로 저장

#### REQ-INT-002: Claude Tool Use 채팅
**WHEN** 사용자가 채팅 질문을 입력하면 **THEN** Claude가 Tool Use를 통해 필요한 데이터만 동적으로 조회해야 한다.

7개 도구:
1. `getBusinessSnapshot` - 현재 경영 상태 스냅샷
2. `queryRevenue` - 매출 데이터 조회 (일별/주별/월별, 채널별)
3. `queryExpenses` - 비용 상세 조회 (9대 분류별)
4. `getReviewAnalysis` - 리뷰 분석 (플랫폼별, 감성 추이)
5. `getCashFlowForecast` - 향후 14일 자금 흐름 예측
6. `comparePeriods` - 두 기간 비교 분석
7. `getInvoicesAndReceivables` - 미수금/미지급금 현황

- 도구 결과 크기 제한: 각 도구 최대 50행, 초과 시 집계 요약
- 기존 `fetchBusinessContext()` 제거 -> Tool Use로 대체
- 비즈니스 프로필(~500 토큰)만 system prompt에 주입

#### REQ-INT-003: 3계층 대화 메모리
시스템은 **항상** 3계층 대화 메모리 아키텍처를 유지해야 한다.

| 계층 | 저장소 | TTL | 내용 |
|------|--------|-----|------|
| Hot | 현재 세션 | 세션 동안 | 직전 15개 메시지 (슬라이딩 윈도우) |
| Warm | `chat_messages` 테이블 | 90일 | 모든 대화 원시 기록 |
| Cold | `agent_memory` + `conversation_summaries` | 무제한 | AI 추출 인사이트, 사장님 관심사 |

- DB 마이그레이션: `00009_chat_memory.sql` (chat_messages, conversation_summaries 테이블)
- 대화 종료 시 Haiku로 자동 요약 생성
- 새 세션 시작 시 주입: 프로필(~500 tokens) + 최근 요약 3개(~300 tokens) + agent_memory importance>=7(~200 tokens)

#### REQ-INT-004: agent_memory 활성화
**WHEN** 에이전트가 분석을 수행하면 **THEN** 결과 중 중요 인사이트를 `agent_memory`에 저장해야 한다.

- 점장: 모닝 루틴에서 `agent_memory` 조회 (importance >= 7), 진단 결과를 `insight` 타입으로 저장
- 세리: 비용 이상 감지 결과를 저장 ("3주 연속 식자재비 상승")
- 답장이: 반복 불만 키워드를 저장 ("배달 지연 불만 5건 연속")
- 채팅: 대화 종료 시 새 사실을 `fact`로, 사장님 반응을 `preference`로 저장

**WHEN** 채팅 세션을 시작하면 **THEN** `agent_memory`에서 importance >= 7인 인사이트를 로드해야 한다.

#### REQ-INT-005: store_context 활성화
**WHEN** 점장이 브리핑을 생성하면 **THEN** 세리와 답장이의 `store_context` 결과를 읽어서 교차 참조해야 한다.

- 세리 store_context: profitMargin, revenueGrowth, costAnomalies, cashFlowRisk, topInsight
- 답장이 store_context: avgRating, ratingTrend, topComplaints, urgentReviews, topInsight
- 교차 진단 시 양쪽 store_context를 동시에 활용

#### REQ-INT-006: 교차 분석 엔진
시스템은 **항상** 리뷰<->매출, 비용<->리뷰 교차 상관관계를 분석해야 한다.

- 리뷰<->매출 상관관계: "별점 4.5+ 날 매출 18% 증가"
- 비용<->리뷰 상관관계: "식자재비 절감 -> 양 불만 3배 증가"
- 요일/시간대 패턴 분석
- 이상 감지 (severity: info/warning/critical)
- Extended Thinking 활성화 (budgetTokens: 2048)

#### REQ-INT-007: 세리 호출 최적화
시스템은 세리 분석 시 Claude를 4회 호출**하지 않아야 한다**.

- 하이브리드 아키텍처: 결정론적 계산(매출 합계, 마진율, 변화율) + Claude 1회 호출(인사이트)
- profit/cashflow/cost 개별 narrative -> 결정론적 한국어 템플릿으로 대체

#### REQ-INT-008: 프롬프트 품질 업그레이드
시스템은 **항상** 모든 AI 응답에 다음을 포함해야 한다:

1. 핵심 수치 (금액, 변화율) - 구체적 숫자
2. "왜?" 가설 (데이터 기반 원인 추정)
3. "그래서 뭘 해야 해?" 구체적 액션 1-2개
4. 액션의 예상 효과

시스템은 다음을 출력**하지 않아야 한다**:
- "다양한 전략을 수립하세요" 같은 빈말
- 사장님이 이미 아는 일반 상식
- 실행 불가능한 제안

- Few-shot 예시 추가 (좋은 응답 vs 나쁜 응답)
- 응답 구조 강제 (Zod 스키마)

#### 파일 목록 (Module 2)

| 파일 | 작업 |
|------|------|
| `src/lib/ai/business-profile.ts` | **신규** - 비즈니스 프로필 엔진 |
| `src/lib/ai/chat-tools.ts` | **신규** - Tool Use 7개 도구 |
| `src/lib/ai/cross-analyzer.ts` | **신규** - 교차 분석 엔진 |
| `supabase/migrations/00009_chat_memory.sql` | **신규** - chat_messages + conversation_summaries |
| `src/app/api/chat/route.ts` | 수정 - Tool Use + 3계층 메모리 + 프로필 주입 |
| `src/lib/ai/seri-engine.ts` | 수정 - 4회->1회 호출 + agent_memory 저장 |
| `src/lib/ai/jeongjang-engine.ts` | 수정 - store_context 읽기 + agent_memory 읽기/쓰기 |
| `src/lib/ai/dapjangi-engine.ts` | 수정 - agent_memory 저장 |
| `src/lib/ai/proactive-diagnosis.ts` | 수정 - 교차 분석 주입 + Extended Thinking |
| `src/lib/ai/seri-prompts.ts` | 수정 - Few-shot + 응답 구조 강제 |
| `src/lib/ai/jeongjang-prompts.ts` | 수정 - Few-shot + 프로필 + 메모리 |
| `src/lib/ai/dapjangi-prompts.ts` | 수정 - 교차 분석 결과 반영 |

---

### Module 3: Quality Optimization (Phase 3)

#### REQ-QUA-001: 업종별 벤치마크 시스템
시스템은 **항상** 업종별 벤치마크 데이터를 기반으로 비교 분석을 제공해야 한다.

- 지원 업종: 한식당, 카페, 소매점, 분식점, 치킨점
- 벤치마크 항목: 월평균 매출, 식자재비율, 인건비율, 임대비율, 배달비중, 평균별점, 순이익률
- 비즈니스 프로필에 벤치마크 비교 포함: "식자재비 40%(평균 32% 대비 높음)"

#### REQ-QUA-002: 사용자 피드백 수집
**WHEN** 사용자가 AI 출력물에 thumbs up/down을 누르면 **THEN** `ai_feedback` 테이블에 기록해야 한다.

- 적용 대상: 채팅 메시지, 브리핑 카드, 리뷰 답글
- 피드백과 prompt_version 연결 -> 프롬프트 개선 데이터
- DB 마이그레이션: `00010_ai_feedback.sql`

#### REQ-QUA-003: 프롬프트 버저닝
시스템은 **항상** 각 프롬프트에 버전을 부여하고 피드백과 연결해야 한다.

- `prompt-registry.ts`에서 프롬프트 버전 중앙 관리
- 피드백 데이터로 프롬프트 효과 측정

#### REQ-QUA-004: Haiku/Sonnet 태스크 분배
**IF** 태스크가 단순 분류/요약에 해당하면 **THEN** Haiku 모델을 사용해야 한다.

| 태스크 | 모델 | 비용 효과 |
|--------|------|----------|
| 대화 요약 생성 | Haiku | -80% |
| 리뷰 감성 분석 배치 | Haiku | -80% |
| 프로필 업데이트 추출 | Haiku | -80% |
| 재무 인사이트 생성 | Sonnet | 유지 |
| 리뷰 답글 생성 | Sonnet | 유지 |
| Q&A 채팅 | Sonnet | 유지 |
| 교차 진단 | Sonnet + Extended Thinking | +10% |

#### 파일 목록 (Module 3)

| 파일 | 작업 |
|------|------|
| `src/lib/ai/industry-benchmarks.ts` | **신규** - 업종별 벤치마크 |
| `src/lib/ai/prompt-registry.ts` | **신규** - 프롬프트 버저닝 |
| `supabase/migrations/00010_ai_feedback.sql` | **신규** - ai_feedback 테이블 |
| `src/app/api/feedback/route.ts` | **신규** - 피드백 API |
| `src/lib/ai/claude-client.ts` | 수정 - Haiku/Sonnet 분배 로직 |
| UI 컴포넌트 3-4개 | 수정 - thumbs up/down 버튼 |

---

### Module 4: Proactive Features (Phase 4)

#### REQ-PRO-001: 선제적 알림 강화
**WHEN** 이상 감지가 발생하면 **THEN** 즉시 알림을 발송해야 한다.

- 현재 모닝 루틴 1회/일 -> 하루 3-5회 체크 (Supabase Edge Function)
- 이상 감지 항목: 매출 급락, 부정 리뷰 급증, 현금 부족 예측
- 기회 감지: "오늘 날씨 흐림 -> 배달 주문 증가 예상"

#### REQ-PRO-002: 바이럴 에이전트 AI 엔진
**WHEN** 재방문 유도/마케팅 시점이 도래하면 **THEN** AI가 콘텐츠를 자동 생성해야 한다.

- 재방문 유도 문자 자동 생성
- SNS 콘텐츠 제안 (메뉴 사진 + 캡션)
- 프로모션 타이밍 최적화 (매출 저조 예측 시기에 자동 제안)

#### REQ-PRO-003: RAG 비즈니스 지식 기반
**가능하면** pgvector로 과거 진단/브리핑 기록을 임베딩하여 유사 패턴 검색을 제공해야 한다.

- "작년 여름에 어떻게 했지?" 같은 질문에 유사 패턴 검색
- 업종별 경영 가이드 RAG

---

### Module 5: Data Farm - "돈 새는 곳 찾기" (Phase 5)

#### REQ-FARM-001: 사업자번호 기반 자동 프로필링
**WHEN** 사용자가 사업자번호를 인증하면 **THEN** 업종과 지역을 자동으로 추출해야 한다.

- 국세청 API 응답에서 `b_sector`(업태), `b_type`(종목) 추출 (현재 버리고 있음)
- 사업자번호 앞 3자리 -> 관할 세무서 코드 -> region_code 자동 매핑 (~130개)
- 카카오 로컬 API로 가게명+지역 검색 -> 도로명주소, 카테고리, 좌표 자동 수집
- 온보딩 UX: 인증 후 자동 채움, 사용자는 확인/수정만

시스템은 이미 획득한 국세청 API 응답 데이터를 폐기**하지 않아야 한다**.

#### REQ-FARM-002: 내부 데이터 팜 (익명 교차 비용 벤치마킹)
시스템은 **항상** 플랫폼 사용자의 비용 데이터를 익명으로 집계하여 벤치마크를 제공해야 한다.

- DB 테이블: `industry_types` (업종 표준화 Enum), `regions` (지역 표준화), `expense_benchmarks` (익명 집계)
- 월 1회 배치 집계: avg, median, p25, p75 계산
- sample_count >= 5인 경우에만 노출 (프라이버시 보호)
- 개별 사업체 비용 진단: 동종 벤치마크 대비 편차율 계산

시스템은 벤치마크 데이터에 개별 `business_id`를 포함**하지 않아야 한다**.

#### REQ-FARM-003: 공공 API 연동 (권리금닷컴 사례 기반 확장)
시스템은 **항상** 외부 공공 데이터를 연동하여 벤치마크 정확도를 높여야 한다.

| 우선순위 | API | 파일 | 용도 | 갱신 주기 |
|---------|-----|------|------|----------|
| P1 필수 | 국토부 상가 임대 실거래 | `rent-benchmark.ts` | 지역/면적별 임대료 시세 (보증금/월세) | 월 1회 |
| P1 필수 | 소진공 상가정보 (3개 엔드포인트) | `commercial-zone.ts` | 반경 내 경쟁매장, 상권 상세, 업종별 분포 | 일 1회 |
| P1 필수 | 통계청 KOSIS OpenAPI | `industry-stats.ts` | 업종별 비용 구조 (항목별 비율) | 분기 1회 |
| P1 필수 | 국세청 경비율 (수동 DB) | `nts-expense-rate.ts` | 업종코드별 표준 경비율 | 연 1회 |
| P2 중요 | 국토부 건축물대장 | `building-info.ts` | 건물 면적/층수/용도 자동 파악 | 온보딩 시 |
| P2 중요 | 서울시 유동인구 + 통계청 SGIS | `floating-population.ts` | 시간대/연령대별 유동인구 | 분기 1회 |
| P2 중요 | 중소벤처기업부 카드매출 통계 | `card-sales-stats.ts` | 업종/지역별 카드매출 벤치마크 | 월 1회 |
| P3 선택 | 공정위 가맹정보 | `franchise-info.ts` | 프랜차이즈 브랜드 매장수/업종 | 주 1회 |

소진공 상가정보 API 3개 엔드포인트:
- `storeListInRadius` - 반경 내 매장 목록 (경쟁 밀집도)
- `storeZoneOne` - 상권 상세정보 (평균 매출/임대료)
- `storeZoneInUpjong` - 업종별 상권 분포

#### REQ-FARM-003-A: 건축물대장 연동
**WHEN** 사업자번호 인증으로 주소가 확보되면 **THEN** 건축물대장 API로 건물 면적/층수/용도를 자동 조회해야 한다.
- 면적 정보 → 임대료 평당 비교 정확도 향상
- 층수 정보 → 1층/2층 이상 임대료 차이 반영
- 용도 정보 → 상업/주거 혼합 건물 식별

#### REQ-FARM-003-B: 유동인구 연동
**WHEN** 사장님이 입지/상권 관련 질문을 하면 **THEN** 유동인구 데이터를 기반으로 분석해야 한다.
- 서울: 서울시 열린데이터 API (시간대/연령대/요일별)
- 서울 외: 통계청 SGIS 격자 인구통계
- "직장인 비율 72%라 점심 매출이 핵심" 같은 입지 기반 인사이트

#### REQ-FARM-003-C: 카드매출 통계 연동
**WHEN** 매출 벤치마크가 필요하면 **THEN** 카드매출 통계로 업종/지역별 평균 매출을 비교해야 한다.
- "같은 지역 한식당 월 카드매출 평균 2,100만원 대비 사장님 1,800만원"
- 계절별 매출 트렌드 비교 (전국 동종 업계 기준)

#### REQ-FARM-003-D: 자동 수집 스케줄러
시스템은 **항상** 공공 데이터를 아래 주기로 자동 수집해야 한다.

| 주기 | API | 크론 시간 |
|------|-----|----------|
| 매일 04:00 | 소진공 상가정보 | 경쟁 매장 변동 추적 |
| 매월 1일 | 국토부 임대 실거래 | 임대료 트렌드 갱신 |
| 분기 1회 | 통계청 KOSIS | 비용 구조 갱신 |
| 분기 1회 | 유동인구 | 상권 인구 갱신 |
| 연 1회 | 국세청 경비율 | 표준경비율 DB 갱신 |

#### REQ-FARM-004: 비용 진단 및 상권 분석 Chat Tools
**WHEN** 사용자가 비용/상권 관련 질문을 하면 **THEN** Tool Use를 통해 벤치마크 비교 결과를 제공해야 한다.

4개 도구:
- `getCostDiagnosis` - 동종 업계 대비 비용 진단 (편차율, severity, 절감 제안). "돈 어디서 새?", "비용 줄일 데 없어?"에 사용
- `getRentBenchmark` - 공공 데이터 기반 임대료 적정성 비교 (국토부 실거래 + 건축물대장 면적). "임대료 비싸?", "월세 적당한지"에 사용
- `getLocationAnalysis` - 상권 분석 (소진공 경쟁매장 + 유동인구 + 업종밀집도). "가게 위치 괜찮아?", "주변 경쟁 어때?"에 사용
- `getIndustrySalesComparison` - 카드매출 통계 기반 매출 벤치마크. "매출이 평균이야?", "같은 업종 다른 가게는 얼마나 벌어?"에 사용

#### 파일 목록 (Module 5)

| 파일 | 작업 |
|------|------|
| `supabase/migrations/00011_data_farm.sql` | **신규** - industry_types, regions, expense_benchmarks, businesses 확장 |
| `src/lib/ai/data-farm.ts` | **신규** - 벤치마크 배치 집계 + 비용 진단 |
| `src/lib/data/tax-office-regions.ts` | **신규** - 세무서코드->지역 매핑 (~130개) |
| `src/lib/public-data/kakao-local.ts` | **신규** - 카카오 로컬 검색 API |
| `src/lib/public-data/rent-benchmark.ts` | **신규** - 국토부 임대 실거래 API |
| `src/lib/public-data/commercial-zone.ts` | **신규** - 소진공 상가정보 API (3개 엔드포인트) |
| `src/lib/public-data/industry-stats.ts` | **신규** - 통계청 KOSIS API |
| `src/lib/public-data/nts-expense-rate.ts` | **신규** - 국세청 경비율 DB |
| `src/lib/public-data/building-info.ts` | **신규** - 국토부 건축물대장 API |
| `src/lib/public-data/floating-population.ts` | **신규** - 서울시 유동인구 + 통계청 SGIS |
| `src/lib/public-data/card-sales-stats.ts` | **신규** - 중소벤처기업부 카드매출 통계 |
| `src/lib/public-data/franchise-info.ts` | **신규** - 공정위 가맹정보 |
| `src/app/api/cron/benchmark/route.ts` | **신규** - 월 1회 벤치마크 배치 |
| `src/app/api/cron/commercial-zone/route.ts` | **신규** - 일 1회 경쟁매장 변동 추적 |
| `src/lib/ai/chat-tools.ts` | 수정 - getCostDiagnosis, getRentBenchmark, getLocationAnalysis, getIndustrySalesComparison 도구 추가 |
| `src/lib/actions/business.ts` | 수정 - verifyBusinessNumber() 응답 확장, industry_code/region_code 저장 |
| `src/app/auth/onboarding/onboarding-form.tsx` | 수정 - 자동채움 UI, 업종/지역 드롭다운 |
| `src/lib/ai/seri-prompts.ts` | 수정 - 비용 진단 결과 프롬프트 주입 |

---

## 4. Specifications (명세)

### 4.1 비용 영향 예측

| 단계 | 사업장 일일 | 사업장 월간 | 매출 대비 |
|------|-----------|-----------|----------|
| 현재 | $0.10-0.15 | $3.0-4.5 | 40-60% |
| Phase 1 완료 | $0.06-0.10 | $1.8-3.0 | 24-40% |
| Phase 2 완료 | $0.04-0.07 | $1.2-2.1 | 16-28% |
| Phase 3 완료 | $0.03-0.05 | $0.9-1.5 | 12-20% |

### 4.2 데이터 흐름 아키텍처

```
[사장님 입력]
    |
    v
[Chat Route] -- system prompt --> [비즈니스 프로필 ~500 tokens]
    |                              [최근 대화 요약 ~300 tokens]
    |                              [agent_memory ~200 tokens]
    |
    v
[Claude Tool Use] -- 필요 시 --> [7+2 Tools]
    |                             getBusinessSnapshot
    |                             queryRevenue
    |                             queryExpenses
    |                             getReviewAnalysis
    |                             getCashFlowForecast
    |                             comparePeriods
    |                             getInvoicesAndReceivables
    |                             getCostDiagnosis (Phase 5)
    |                             getRentBenchmark (Phase 5)
    |
    v
[응답 생성] -- 저장 --> [chat_messages (Warm)]
    |                   [agent_memory (Cold, 중요 인사이트)]
    |                   [conversation_summaries (세션 종료 시)]
    v
[사장님에게 전달]
```

### 4.3 프라이버시 요구사항

- 벤치마크 집계 시 최소 5개 사업체 이상인 경우에만 노출
- `expense_benchmarks` 테이블에 원본 `business_id` 미저장
- RLS로 원본 expenses는 본인 것만 접근 가능
- 모든 벤치마크 데이터는 익명화된 집계 통계만 제공

---

## 5. Traceability (추적성)

| 요구사항 ID | 계획 참조 | 인수 기준 참조 |
|------------|----------|--------------|
| REQ-INF-001 | plan.md M1-T1 | acceptance.md AC-INF-001 |
| REQ-INF-002 | plan.md M1-T2 | acceptance.md AC-INF-002 |
| REQ-INF-003 | plan.md M1-T3 | acceptance.md AC-INF-003 |
| REQ-INT-001 | plan.md M2-T1 | acceptance.md AC-INT-001 |
| REQ-INT-002 | plan.md M2-T2 | acceptance.md AC-INT-002 |
| REQ-INT-003 | plan.md M2-T3 | acceptance.md AC-INT-003 |
| REQ-INT-004 | plan.md M2-T4 | acceptance.md AC-INT-004 |
| REQ-INT-005 | plan.md M2-T5 | acceptance.md AC-INT-005 |
| REQ-INT-006 | plan.md M2-T6 | acceptance.md AC-INT-006 |
| REQ-INT-007 | plan.md M2-T7 | acceptance.md AC-INT-007 |
| REQ-INT-008 | plan.md M2-T8 | acceptance.md AC-INT-008 |
| REQ-QUA-001 | plan.md M3-T1 | acceptance.md AC-QUA-001 |
| REQ-QUA-002 | plan.md M3-T2 | acceptance.md AC-QUA-002 |
| REQ-QUA-003 | plan.md M3-T3 | acceptance.md AC-QUA-003 |
| REQ-QUA-004 | plan.md M3-T4 | acceptance.md AC-QUA-004 |
| REQ-PRO-001 | plan.md M4-T1 | acceptance.md AC-PRO-001 |
| REQ-PRO-002 | plan.md M4-T2 | acceptance.md AC-PRO-002 |
| REQ-FARM-001 | plan.md M5-T1 | acceptance.md AC-FARM-001 |
| REQ-FARM-002 | plan.md M5-T2 | acceptance.md AC-FARM-002 |
| REQ-FARM-003 | plan.md M5-T3 | acceptance.md AC-FARM-003 |
| REQ-FARM-004 | plan.md M5-T4 | acceptance.md AC-FARM-004 |
