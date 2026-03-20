---
id: SPEC-LLM-001
title: "LLM Architecture Overhaul - Implementation Plan"
version: "1.0.0"
status: draft
created: "2026-03-20"
updated: "2026-03-20"
spec_ref: SPEC-LLM-001/spec.md
---

# SPEC-LLM-001: Implementation Plan

## 1. Milestone Overview

```
M1: AI Infrastructure          [Priority: Critical]
    |
    v
M2: Intelligence Core          [Priority: Critical]
    |          \
    v           v
M3: Quality     M5: Data Farm  [Priority: High / Priority: Medium]
    |
    v
M4: Proactive Features         [Priority: Low]
```

### 의존성 관계

| Milestone | 의존 대상 | 의존 이유 |
|-----------|----------|----------|
| M1 | 없음 | 기반 인프라, 독립 실행 가능 |
| M2 | M1 | claude-client.ts, schemas.ts 필요 |
| M3 | M1 + M2 (부분) | 벤치마크는 프로필 엔진 필요, 피드백은 채팅 시스템 필요 |
| M4 | M2 | 교차 분석, Tool Use, 메모리 인프라 필요 |
| M5 | M2 (부분) | Tool Use 인프라 위에서 동작, M2 이후 언제든 시작 가능 |

---

## 2. Milestone 1: AI Infrastructure (M1)

**Priority**: Critical
**선행 조건**: 없음
**요구사항 참조**: REQ-INF-001, REQ-INF-002, REQ-INF-003

### 태스크 목록

#### M1-T1: 공통 Claude 클라이언트 추출 [REQ-INF-001]

- `src/lib/ai/claude-client.ts` 신규 생성
- 7개 파일에서 중복되는 `createAnthropic()`, 모델 상수, 에러 핸들링 통합
- `callClaudeText()`, `callClaudeObject<T>()`, `callClaudeStream()` 래퍼 구현
- 호출당 input/output 토큰 로깅 + 일일 비용 집계 로직

#### M1-T2: Prompt Caching 적용 [REQ-INF-002]

- `claude-client.ts`에 `cacheControl` 옵션 통합
- 프롬프트 배치 순서 적용: 공통(캐시) -> 동적(비캐시)
- `providerOptions.anthropic.cacheControl: { type: "ephemeral" }` 설정

#### M1-T3: Structured Outputs 전환 [REQ-INF-003]

- `src/lib/ai/schemas.ts` 신규 생성 - 모든 AI 출력 Zod 스키마
- 5개 파일의 regex 파싱을 `generateObject()` + Zod 스키마로 교체:
  - proactive-diagnosis.ts (DiagnosisSchema)
  - sentiment-analyzer.ts (SentimentBatchSchema)
  - brand-voice.ts (VoiceTraitsSchema)
  - expense-classifier.ts (ClassificationSchema)
  - briefing-generator.ts (BriefingSchema)
- 기존 regex 결과와 generateObject 결과 비교 검증

### 영향 파일 (신규 2 + 수정 7)

| 파일 | 작업 |
|------|------|
| `src/lib/ai/claude-client.ts` | **신규** |
| `src/lib/ai/schemas.ts` | **신규** |
| `src/lib/ai/seri-engine.ts` | 수정 |
| `src/lib/ai/briefing-generator.ts` | 수정 |
| `src/lib/ai/proactive-diagnosis.ts` | 수정 |
| `src/lib/ai/review-responder.ts` | 수정 |
| `src/lib/ai/sentiment-analyzer.ts` | 수정 |
| `src/lib/ai/brand-voice.ts` | 수정 |
| `src/lib/ai/expense-classifier.ts` | 수정 |

### 비용 영향

- Prompt Caching: 캐시 히트 시 input 토큰 비용 -90%
- Structured Outputs: 실패 재시도 감소로 -10-15%
- 예상 일일 비용: $0.10-0.15 -> $0.06-0.10

### 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| generateObject가 특정 스키마에서 실패 | 중간 | 중간 | output: "no-schema" 모드로 폴백, 기존 regex 유지 |
| cacheControl이 특정 모델에서 미지원 | 낮음 | 낮음 | cacheControl 없이 동작하도록 옵셔널 처리 |
| 7개 파일 동시 수정 시 충돌 | 중간 | 높음 | import 경로만 변경하는 단계적 마이그레이션 |

---

## 3. Milestone 2: Intelligence Core (M2)

**Priority**: Critical
**선행 조건**: M1 완료
**요구사항 참조**: REQ-INT-001 ~ REQ-INT-008

### 태스크 목록

#### M2-T1: 비즈니스 프로필 엔진 [REQ-INT-001]

- `src/lib/ai/business-profile.ts` 신규 생성
- `BusinessProfile` interface 정의 (정적/동적/리뷰/AI인사이트/벤치마크)
- `rebuildBusinessProfile()` 함수 구현 (매일 모닝 루틴)
- store_context에 `agent_type='profile'`로 저장
- 프로필 텍스트 렌더링 (~500 tokens)

#### M2-T2: Claude Tool Use 채팅 [REQ-INT-002]

- `src/lib/ai/chat-tools.ts` 신규 생성
- 7개 도구 정의 및 핸들러 구현
- `src/app/api/chat/route.ts` 수정: fetchBusinessContext() 제거, Tool Use 전환
- 도구 결과 크기 제한 로직 (최대 50행, 집계 요약)

#### M2-T3: 3계층 대화 메모리 [REQ-INT-003]

- `supabase/migrations/00009_chat_memory.sql` 신규 생성
- chat_messages 테이블 (session_id, role, content, token_count)
- conversation_summaries 테이블 (summary, key_facts, follow_ups)
- Hot 계층: 슬라이딩 윈도우 15 메시지 로직
- 대화 종료 시 Haiku 자동 요약 생성
- 새 세션 시작 시 컨텍스트 주입 (~1,000 tokens)

#### M2-T4: agent_memory 활성화 [REQ-INT-004]

- jeongjang-engine.ts: 모닝 루틴에서 agent_memory 조회 + 인사이트 저장
- seri-engine.ts: 비용 이상 감지 결과 agent_memory 저장
- dapjangi-engine.ts: 반복 불만 키워드 agent_memory 저장
- chat/route.ts: 대화 종료 시 fact/preference 저장

#### M2-T5: store_context 활성화 [REQ-INT-005]

- jeongjang-engine.ts의 runMorningRoutine()에서 세리/답장이 store_context 읽기
- 브리핑 생성 시 교차 참조

#### M2-T6: 교차 분석 엔진 [REQ-INT-006]

- `src/lib/ai/cross-analyzer.ts` 신규 생성
- CrossAnalysis interface 구현
- 리뷰<->매출, 비용<->리뷰 상관관계 분석
- 요일/시간대 패턴, 이상 감지
- proactive-diagnosis.ts에 교차 분석 결과 주입
- Extended Thinking 활성화

#### M2-T7: 세리 호출 최적화 [REQ-INT-007]

- seri-engine.ts 하이브리드 아키텍처 구현
- 결정론적 계산 (매출 합계, 마진율, 변화율)
- 한국어 템플릿 기반 narrative 생성
- Claude 1회만 호출 (종합 인사이트)

#### M2-T8: 프롬프트 품질 업그레이드 [REQ-INT-008]

- seri-prompts.ts, jeongjang-prompts.ts, dapjangi-prompts.ts 전면 개선
- Few-shot 예시 추가 (좋은/나쁜 응답)
- 응답 구조 강제 (핵심 수치 -> 왜? -> 액션 -> 예상 효과)

### 영향 파일 (신규 4 + 수정 8 + migration 1)

| 파일 | 작업 |
|------|------|
| `src/lib/ai/business-profile.ts` | **신규** |
| `src/lib/ai/chat-tools.ts` | **신규** |
| `src/lib/ai/cross-analyzer.ts` | **신규** |
| `supabase/migrations/00009_chat_memory.sql` | **신규** |
| `src/app/api/chat/route.ts` | 수정 |
| `src/lib/ai/seri-engine.ts` | 수정 |
| `src/lib/ai/jeongjang-engine.ts` | 수정 |
| `src/lib/ai/dapjangi-engine.ts` | 수정 |
| `src/lib/ai/proactive-diagnosis.ts` | 수정 |
| `src/lib/ai/seri-prompts.ts` | 수정 |
| `src/lib/ai/jeongjang-prompts.ts` | 수정 |
| `src/lib/ai/dapjangi-prompts.ts` | 수정 |

### 비용 영향

- Tool Use: 불필요한 컨텍스트 주입 제거 -> input 토큰 -40%
- 세리 최적화: 4회 -> 1회 호출 -> -75%
- 메모리: 세션 당 추가 ~1,000 tokens (acceptable)
- 예상 일일 비용: $0.06-0.10 -> $0.04-0.07

### 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Tool Use 시 Claude가 잘못된 도구 호출 | 중간 | 중간 | 도구 description에 자연어 트리거 명확히 기술 |
| 대화 메모리 토큰 오버헤드 | 낮음 | 중간 | 슬라이딩 윈도우 크기 조절 (15 -> 10) |
| agent_memory 데이터 품질 저하 | 중간 | 낮음 | importance 임계값 조절, 주기적 정리 |
| 교차 분석 성능 (대량 데이터) | 중간 | 중간 | 분석 기간 제한 (최근 90일), 캐싱 |

---

## 4. Milestone 3: Quality Optimization (M3)

**Priority**: High
**선행 조건**: M1 완료, M2 부분 완료 (프로필 엔진, 채팅 시스템)
**요구사항 참조**: REQ-QUA-001 ~ REQ-QUA-004

### 태스크 목록

#### M3-T1: 업종별 벤치마크 시스템 [REQ-QUA-001]

- `src/lib/ai/industry-benchmarks.ts` 신규 생성
- 5개 업종 벤치마크 데이터 정의 (한식당, 카페, 소매점, 분식점, 치킨점)
- 벤치마크 항목: 월평균 매출, 식자재비율, 인건비율, 임대비율, 배달비중, 평균별점, 순이익률
- 비즈니스 프로필에 벤치마크 비교 자동 삽입

#### M3-T2: 사용자 피드백 수집 [REQ-QUA-002]

- `supabase/migrations/00010_ai_feedback.sql` 신규 생성
- ai_feedback 테이블 (business_id, message_id, feedback_type, prompt_version)
- `src/app/api/feedback/route.ts` 신규 생성
- 채팅 메시지, 브리핑 카드, 리뷰 답글에 thumbs up/down UI 추가

#### M3-T3: 프롬프트 버저닝 [REQ-QUA-003]

- `src/lib/ai/prompt-registry.ts` 신규 생성
- 각 프롬프트에 버전 ID 부여
- 피드백과 프롬프트 버전 연결

#### M3-T4: Haiku/Sonnet 태스크 분배 [REQ-QUA-004]

- claude-client.ts에 모델 선택 로직 추가
- 태스크 분류별 모델 매핑 (요약/감성분석 -> Haiku, 인사이트/답글 -> Sonnet)

### 영향 파일 (신규 3 + 수정 4-5 + migration 1)

| 파일 | 작업 |
|------|------|
| `src/lib/ai/industry-benchmarks.ts` | **신규** |
| `src/lib/ai/prompt-registry.ts` | **신규** |
| `supabase/migrations/00010_ai_feedback.sql` | **신규** |
| `src/app/api/feedback/route.ts` | **신규** |
| `src/lib/ai/claude-client.ts` | 수정 |
| UI 컴포넌트 3-4개 | 수정 |

### 비용 영향

- Haiku 분배: 단순 태스크 비용 -80%
- 전체 예상 일일 비용: $0.04-0.07 -> $0.03-0.05

### 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Haiku 품질 부족 | 중간 | 중간 | 태스크별 품질 테스트 후 점진적 전환 |
| 벤치마크 데이터 부정확 | 중간 | 낮음 | 업계 리포트 참조로 초기 데이터 검증 |
| 피드백 수집률 저조 | 높음 | 낮음 | 비침습적 UI (자연스러운 인라인 버튼) |

---

## 5. Milestone 4: Proactive Features (M4)

**Priority**: Low
**선행 조건**: M2 완료
**요구사항 참조**: REQ-PRO-001 ~ REQ-PRO-003

### 태스크 목록

#### M4-T1: 선제적 알림 강화 [REQ-PRO-001]

- Supabase Edge Function으로 하루 3-5회 이상 감지 체크
- 매출 급락, 부정 리뷰 급증, 현금 부족 예측 시 즉시 알림
- 기회 감지 (날씨 기반 배달 수요 예측)

#### M4-T2: 바이럴 에이전트 AI 엔진 [REQ-PRO-002]

- 재방문 유도 문자 자동 생성
- SNS 콘텐츠 제안
- 프로모션 타이밍 최적화

#### M4-T3: RAG 비즈니스 지식 기반 [REQ-PRO-003]

- pgvector 임베딩 파이프라인 구축
- 과거 진단/브리핑 벡터 검색
- 업종별 경영 가이드 RAG

### 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Edge Function 실행 비용 | 중간 | 중간 | 호출 빈도 최적화, 불필요한 체크 제거 |
| 알림 피로 (과다 알림) | 높음 | 중간 | 중요도 필터링, 사용자 설정 |
| RAG 임베딩 품질 | 중간 | 중간 | 임베딩 모델 선택 검증 |

---

## 6. Milestone 5: Data Farm (M5)

**Priority**: Medium
**선행 조건**: M2 부분 완료 (Tool Use 인프라)
**요구사항 참조**: REQ-FARM-001 ~ REQ-FARM-004

### 태스크 목록

#### M5-T1: 사업자번호 기반 자동 프로필링 [REQ-FARM-001]

- `src/lib/actions/business.ts` 수정: verifyBusinessNumber() 응답 확장 (b_sector, b_type, tax_type)
- `src/lib/data/tax-office-regions.ts` 신규 생성: 세무서코드->지역 매핑 (~130개)
- `src/lib/public-data/kakao-local.ts` 신규 생성: 카카오 로컬 검색 API
- `src/app/auth/onboarding/onboarding-form.tsx` 수정: 자동채움 UI

#### M5-T2: 내부 데이터 팜 [REQ-FARM-002]

- `supabase/migrations/00011_data_farm.sql` 신규 생성
  - industry_types 테이블 (업종 표준화)
  - regions 테이블 (지역 표준화)
  - expense_benchmarks 테이블 (익명 집계)
  - businesses 테이블 확장 (industry_code, region_code)
- `src/lib/ai/data-farm.ts` 신규 생성
  - rebuildBenchmarks() 배치 집계 (월 1회)
  - diagnoseCosts() 개별 사업체 비용 진단
- `src/app/api/cron/benchmark/route.ts` 신규 생성: 배치 크론 엔드포인트

#### M5-T3: 공공 API 연동 [REQ-FARM-003]

- `src/lib/public-data/rent-benchmark.ts` 신규 생성: 국토부 상가 임대 실거래
- `src/lib/public-data/commercial-zone.ts` 신규 생성: 소진공 상권정보
- `src/lib/public-data/industry-stats.ts` 신규 생성: 통계청 KOSIS
- `src/lib/public-data/nts-expense-rate.ts` 신규 생성: 국세청 경비율

#### M5-T4: 비용 진단 Chat Tools [REQ-FARM-004]

- chat-tools.ts에 getCostDiagnosis, getRentBenchmark 도구 추가
- seri-prompts.ts에 비용 진단 결과 프롬프트 주입

### 영향 파일 (신규 9 + 수정 4 + migration 1)

| 파일 | 작업 |
|------|------|
| `supabase/migrations/00011_data_farm.sql` | **신규** |
| `src/lib/ai/data-farm.ts` | **신규** |
| `src/lib/data/tax-office-regions.ts` | **신규** |
| `src/lib/public-data/kakao-local.ts` | **신규** |
| `src/lib/public-data/rent-benchmark.ts` | **신규** |
| `src/lib/public-data/commercial-zone.ts` | **신규** |
| `src/lib/public-data/industry-stats.ts` | **신규** |
| `src/lib/public-data/nts-expense-rate.ts` | **신규** |
| `src/app/api/cron/benchmark/route.ts` | **신규** |
| `src/lib/ai/chat-tools.ts` | 수정 |
| `src/lib/actions/business.ts` | 수정 |
| `src/app/auth/onboarding/onboarding-form.tsx` | 수정 |
| `src/lib/ai/seri-prompts.ts` | 수정 |

### 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| 사업체 수 부족 (< 50) | 높음 | 높음 | Phase 5 시작 시점을 사용자 확보와 연동 |
| 공공 API 불안정/변경 | 중간 | 중간 | 폴백 로직 + 캐싱 + 수동 DB 유지 |
| 세무서코드 매핑 불완전 | 낮음 | 낮음 | 국세청 공식 목록 기반, 미매핑 시 사용자 입력 |
| 카카오 API 호출 제한 | 중간 | 낮음 | 온보딩 시 1회만 호출, 결과 캐싱 |
| 프라이버시 이슈 | 낮음 | 높음 | 최소 5개 샘플, business_id 미저장, RLS 적용 |

---

## 7. 전체 비용 영향 요약

| 단계 | 사업장 일일 | 사업장 월간 | 매출 대비 | 절감률 |
|------|-----------|-----------|----------|--------|
| 현재 | $0.10-0.15 | $3.0-4.5 | 40-60% | - |
| M1 완료 | $0.06-0.10 | $1.8-3.0 | 24-40% | -33% |
| M2 완료 | $0.04-0.07 | $1.2-2.1 | 16-28% | -53% |
| M3 완료 | $0.03-0.05 | $0.9-1.5 | 12-20% | -67% |

---

## 8. 기술적 접근 방식

### 8.1 마이그레이션 전략

- **점진적 전환**: M1에서 claude-client.ts를 먼저 만들고, 각 파일을 순차적으로 마이그레이션
- **기존 기능 보존**: 각 파일 수정 시 기존 테스트가 통과하는지 확인 후 진행
- **폴백 지원**: generateObject 실패 시 기존 regex 파싱으로 폴백

### 8.2 테스트 전략

- claude-client.ts: 모킹된 API 호출 테스트
- schemas.ts: Zod 스키마 유효성 테스트 (valid/invalid 케이스)
- chat-tools.ts: 각 도구의 입출력 테스트
- data-farm.ts: 배치 집계 로직 단위 테스트
- 통합 테스트: 실제 AI 응답 품질 수동 검증

### 8.3 아키텍처 설계 방향

- **단일 진입점**: 모든 Claude 호출은 claude-client.ts를 통해
- **스키마 중앙화**: 모든 AI 출력 스키마는 schemas.ts에서 관리
- **3계층 메모리**: Hot(세션) -> Warm(DB 90일) -> Cold(영구 인사이트)
- **하이브리드 계산**: 결정론적 계산 + LLM 인사이트 (세리 패턴)
- **프라이버시 바이 디자인**: 벤치마크 데이터는 처음부터 익명화 설계
