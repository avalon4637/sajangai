# LLM 아키텍처 고도화 계획

## Context

sajang.ai의 핵심 가치는 AI 에이전트(세리, 답장이, 점장)이다. 사장님이 "와, 이 AI는 내 가게를 진짜 잘 아네!" 라고 느끼게 만드는 것이 최종 목표.

**심층 분석에서 발견된 핵심 문제:**

1. **데이터 활용률 극히 낮음**: DB에 매출/비용/리뷰/인건비/미수금/거래처 등 광범위하게 수집하지만, LLM에는 월간 합계와 top-3 채널만 전달. **수집 데이터의 20% 미만만 활용 중**
2. **agent_memory 테이블이 존재하지만 읽지 않음**: fact/preference/insight/decision 타입의 장기 기억 테이블이 구현되어 있으나, 어떤 AI 호출에서도 읽지 않음
3. **store_context 테이블 미활용**: 세리/답장이가 분석 결과를 저장하는 공유 컨텍스트 테이블이 있으나, 점장이 이를 읽지 않음
4. **채팅 완전 stateless**: 이전 대화 기억 불가, 개인화 불가
5. **교차 분석 부재**: 리뷰↔매출, 비용↔리뷰 상관관계 분석 미구현
6. **업종 벤치마크 없음**: "내 가게가 잘 하고 있는지" 비교 기준 부재
7. **비용 비효율**: LLM 비용 매출의 40~60%, Prompt Caching 미적용, 동일 프롬프트 4회 전송

**현재 스택:** `@ai-sdk/anthropic` v3.0.45, `ai` v6.0.91, `zod` v4.3.6, Claude Sonnet 4.6

---

## Phase 1: 인프라 기반 - 비용 절감 + 안정성 (1주)

### 1-1. AI 공통 유틸리티 추출

**신규:** `src/lib/ai/claude-client.ts`

7개 파일에서 중복되는 `createAnthropic()`, 모델 상수, 에러 핸들링을 통합:
- `callClaudeText()` - generateText 래퍼 (prompt caching, 에러 핸들링, 로깅)
- `callClaudeObject<T>()` - generateObject 래퍼 (Zod 스키마 검증)
- `callClaudeStream()` - streamText 래퍼
- 호출당 input/output 토큰 로깅 + 일일 비용 집계

**수정 대상:** seri-engine.ts, briefing-generator.ts, proactive-diagnosis.ts, review-responder.ts, sentiment-analyzer.ts, brand-voice.ts, expense-classifier.ts

### 1-2. Prompt Caching 적용

`@ai-sdk/anthropic` v3.x `cacheControl` 옵션 활용. 프롬프트 배치 순서: **공통(캐시) → 업종벤치마크(캐시) → 동적 데이터(비캐시)**

```typescript
// claude-client.ts
const { text } = await generateText({
  model: anthropic("claude-sonnet-4-6", { cacheControl: true }),
  system: [{
    type: "text",
    text: SYSTEM_PROMPT,
    providerOptions: { anthropic: { cacheControl: { type: "ephemeral" } } }
  }],
  prompt: userPrompt,
});
```

### 1-3. Structured Outputs (regex → Zod)

**신규:** `src/lib/ai/schemas.ts` - 모든 AI 출력 Zod 스키마

**교체 대상 (5곳):**

| 파일 | 현재 | 변경 |
|------|------|------|
| proactive-diagnosis.ts | `text.match(/\{[\s\S]*\}/)` | `generateObject({ schema: DiagnosisSchema })` |
| sentiment-analyzer.ts | `text.match(/\{[\s\S]*\}/)` | `generateObject({ schema: SentimentBatchSchema })` |
| brand-voice.ts | `text.match(/\{[\s\S]*\}/)` | `generateObject({ schema: VoiceTraitsSchema })` |
| expense-classifier.ts | `text.match(/\{[\s\S]*\}/)` | `generateObject({ schema: ClassificationSchema })` |
| briefing-generator.ts | regex 파싱 | `generateObject({ schema: BriefingSchema })` |

---

## Phase 2: 핵심 - LLM이 가게를 "진짜 아는" 구조 (3주)

> 이 Phase가 서비스의 성패를 결정함. 사장님이 체감하는 AI 품질의 80%가 여기서 결정.

### 2-1. 비즈니스 프로필 엔진 (개인화의 핵심)

사장님 가게를 깊이 이해하는 "가게 DNA"를 매일 자동 갱신.

**신규:** `src/lib/ai/business-profile.ts`

```typescript
interface BusinessProfile {
  // 정적 정보 (온보딩 시 수집)
  industry: string;           // "한식당", "카페", "소매점"
  location: string;           // "강남구 역삼동"
  operatingSince: string;     // 개업일

  // 동적 정보 (데이터에서 자동 계산 - 매일 갱신)
  monthlyAvgRevenue: number;  // 최근 6개월 평균
  revenueGrowthRate: number;  // 월 성장률
  deliveryRatio: number;      // 배달 매출 비중
  topChannels: string[];      // 상위 채널 순위
  profitMargin: number;       // 순이익률
  laborRatio: number;         // 인건비 비율
  costTrend: string;          // "상승"/"안정"/"하락"

  // 리뷰 프로필
  avgRating: number;          // 전체 평균 별점
  ratingTrend: string;        // 별점 추세
  topComplaintCategories: string[];  // 주요 불만 카테고리
  responseRate: number;       // 리뷰 응답률

  // AI가 학습한 인사이트 (agent_memory에서 로드)
  ownerConcerns: string[];    // 사장님 주요 관심사
  pastSuggestions: string[];  // 이전 제안과 반응
  businessGoals: string[];    // 확인된 사업 목표
  seasonalPatterns: string[]; // 발견된 계절 패턴

  // 벤치마크 비교 (업종 평균 대비)
  benchmark: IndustryBenchmark;
}
```

**구현:** 매일 모닝 루틴에서 `rebuildBusinessProfile()` 실행. 결과를 `store_context` 테이블에 `agent_type='profile'`로 저장.

**LLM 주입 형태** (~500 토큰, 모든 AI 호출에 공통 주입):

```
[가게 프로필 - 2026년 3월 20일]
역삼동 한식당 | 운영 14개월 | 월평균 매출 2,800만원 (+3.2%/월)
배달 62%(배민 주력) | 순이익률 18.5% | 인건비 32%(평균 28% 대비 높음)
리뷰 4.2점(하락 추세) | 주 불만: 배달 지연, 양 | 응답률 78%
사장님 관심: 비용 절감 | 목표: 월 3,000만원 | 계절: 여름 냉면 매출 +20%
```

### 2-2. Claude Tool Use - 동적 데이터 검색 (7개 도구)

현재 채팅 시 고정 데이터를 주입하는 방식을 Tool Use로 전환. Claude가 질문에 따라 필요한 데이터만 조회.

**신규:** `src/lib/ai/chat-tools.ts`

```typescript
export const chatTools = {
  // 도구 설명에 자연어 트리거를 포함하여 Claude가 정확히 매칭
  getBusinessSnapshot: {
    description: "사업장 현재 경영 상태 스냅샷. '요즘 장사 어때?', '현황 알려줘' 같은 일반 질문에 사용",
    parameters: z.object({}),
    // 반환: 이번달 매출/비용/순이익, 전월 대비 변화율, 주의 항목
  },
  queryRevenue: {
    description: "매출 데이터 조회. 일별/주별/월별 집계, 채널별(배민/쿠팡/카드) 분석 가능. '이번달 매출', '배달 매출 추이' 등에 사용. 비교 분석은 두 번 호출",
    parameters: z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
      granularity: z.enum(["daily", "weekly", "monthly"]),
      groupBy: z.enum(["channel", "dayOfWeek", "none"]).optional(),
    }),
  },
  queryExpenses: {
    description: "비용 상세 조회. 9대 분류(식자재/인건비/임대료/마케팅 등) 카테고리별 분석. '비용 많이 나가는 항목', '식자재비 추이'에 사용",
    parameters: z.object({
      periodStart: z.string(),
      periodEnd: z.string(),
      category: z.string().optional(),
    }),
    // 반환: 카테고리별 합계 + 전월 대비 변화율 + 업종 평균 대비
  },
  getReviewAnalysis: {
    description: "리뷰 분석. 플랫폼별/카테고리별 분포, 감성 추이, 키워드 빈도. '리뷰 어때?', '불만이 뭐야?'에 사용",
    parameters: z.object({
      days: z.number().optional().default(30),
      platform: z.enum(["baemin", "coupangeats", "yogiyo", "all"]).optional(),
    }),
    // 반환: 평점 분포, 카테고리별 불만(맛/양/배달/서비스/가격/위생), 트렌드
  },
  getCashFlowForecast: {
    description: "향후 14일 자금 흐름 예측. 카드 정산일, 배달앱 정산, 고정비 납부 포함. '돈 빠듯해?', '현금 괜찮아?'에 사용",
    parameters: z.object({}),
  },
  comparePeriods: {
    description: "두 기간 비교 분석. 매출/비용/이익 변화율과 주요 변동 요인. '지난달이랑 비교', '작년 같은 달 비교'에 사용",
    parameters: z.object({
      currentStart: z.string(),
      currentEnd: z.string(),
      previousStart: z.string(),
      previousEnd: z.string(),
      metrics: z.array(z.enum(["revenue", "expense", "profit", "reviews"])),
    }),
    // 반환: 각 metric의 변화율 + 주요 변동 항목 top 3
  },
  getInvoicesAndReceivables: {
    description: "미수금/미지급금 현황. '밀린 돈 있어?', '거래처 결제'에 사용",
    parameters: z.object({
      type: z.enum(["receivable", "payable", "all"]).optional(),
      status: z.enum(["pending", "overdue", "all"]).optional(),
    }),
  },
};
```

**도구 결과 크기 제한:** 각 도구는 최대 50행, 초과 시 집계 요약 + "추가 조회 필요" 메시지.

**수정:** `src/app/api/chat/route.ts`
- `fetchBusinessContext()` 제거 → Tool Use로 대체
- 비즈니스 프로필(500토큰)만 system prompt에 주입
- Claude가 질문에 따라 필요한 도구만 호출

### 2-3. 대화 메모리 - 3계층 아키텍처

| 계층 | 저장소 | TTL | 내용 |
|------|--------|-----|------|
| Hot | 현재 세션 | 세션 동안 | 직전 15개 메시지 (슬라이딩 윈도우) |
| Warm | `chat_messages` 테이블 | 90일 | 모든 대화 원시 기록 |
| Cold | `agent_memory` + 대화 요약 | 무제한 | AI가 추출한 인사이트, 사장님 관심사, 과거 제안 결과 |

**DB 마이그레이션:** `supabase/migrations/00009_chat_memory.sql`

```sql
-- 대화 메시지 (Warm 계층)
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  token_count int,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_chat_session ON chat_messages(session_id, created_at);

-- 대화 요약 (Cold 계층)
CREATE TABLE conversation_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  summary text NOT NULL,
  key_facts jsonb DEFAULT '[]',     -- 확인된 사실 ["메뉴 변경함", "직원 1명 추가"]
  follow_ups jsonb DEFAULT '[]',    -- 후속 필요 ["다음주 식자재비 확인"]
  created_at timestamptz DEFAULT now()
);
```

**대화 종료 시 자동 요약 생성** (Haiku 사용 - 저비용):

```
이 대화에서 사업 운영 관련 핵심만 추출:
- 사장님이 언급한 문제/고민
- AI가 제안한 솔루션과 사장님 반응
- 확인된 사실 (메뉴 변경, 직원 상황 등)
- 다음 대화에서 follow-up 필요한 항목
200자 이내 요약.
```

**새 세션 시작 시 주입:**
- 비즈니스 프로필 (~500 tokens)
- 최근 대화 요약 3개 (~300 tokens)
- agent_memory에서 importance >= 7 인사이트 (~200 tokens)
- **총 ~1,000 tokens로 완전한 맥락 제공**

### 2-4. agent_memory 활성화 (기존 테이블 활용!)

`agent_memory` 테이블이 이미 구현되어 있지만 **아무도 읽지 않는 상태**. 이를 활성화.

**수정:** `src/lib/ai/jeongjang-engine.ts`
- 모닝 루틴에서 `agent_memory` 조회 추가 (importance >= 7)
- 진단 결과를 `agent_memory`에 `insight` 타입으로 저장
- 반복되는 패턴을 `fact` 타입으로 누적

**수정:** `src/lib/ai/seri-engine.ts`
- 비용 이상 감지 결과를 `agent_memory`에 저장
- "3주 연속 식자재비 상승" 같은 패턴을 `insight`로 기록

**수정:** `src/lib/ai/dapjangi-engine.ts`
- 반복 불만 키워드를 `agent_memory`에 저장
- "배달 지연 불만 5건 연속" 같은 트렌드를 `insight`로 기록

**수정:** `src/app/api/chat/route.ts`
- 대화 종료 시 새로 확인된 사실을 `agent_memory`에 `fact`로 저장
- 사장님의 반응을 `preference`로 저장 (어떤 제안을 좋아했는지)

**효과:** 시간이 지날수록 AI가 더 똑똑해짐. "지난달에 발견된 패턴을 이번달에도 경고"

### 2-5. store_context 읽기 활성화

`store_context` 테이블에 세리/답장이가 결과를 저장하지만 점장이 읽지 않는 상태.

**store_context JSONB 스키마 정의:**

```typescript
// Seri store_context
interface SeriContext {
  profitMargin: number;
  revenueGrowth: number;
  costAnomalies: { category: string; deviation: number }[];
  cashFlowRisk: "safe" | "caution" | "danger";
  topInsight: string;  // 가장 중요한 인사이트 1줄
}

// Dapjangi store_context
interface DapjangiContext {
  avgRating: number;
  ratingTrend: "improving" | "stable" | "declining";
  topComplaints: { category: string; count: number }[];
  urgentReviews: number;
  topInsight: string;
}
```

**수정:** `src/lib/ai/jeongjang-engine.ts`의 `runMorningRoutine()`
- Seri/Dapjangi 분석 후 store_context에 저장
- 브리핑 생성 시 store_context에서 각 specialist 결과 로드
- 교차 진단 시 양쪽 store_context를 동시에 활용

### 2-6. 교차 분석 엔진

현재 완전히 부재한 리뷰↔매출↔비용 상관관계 분석.

**신규:** `src/lib/ai/cross-analyzer.ts`

```typescript
interface CrossAnalysis {
  // 리뷰 ↔ 매출 상관관계
  reviewRevenueCorrelation: {
    pattern: string;  // "별점 4.5+ 날 매출 18% 증가"
    confidence: number;
  }[];

  // 비용 ↔ 리뷰 상관관계
  costReviewCorrelation: {
    pattern: string;  // "식자재비 절감 → 양 불만 3배 증가"
    confidence: number;
  }[];

  // 요일/시간대 패턴
  dayOfWeekPatterns: {
    day: string;
    avgRevenue: number;
    avgRating: number;
  }[];

  // 이상 감지
  anomalies: {
    date: string;
    type: string;
    description: string;
    severity: "info" | "warning" | "critical";
  }[];
}
```

**proactive-diagnosis.ts 강화:**
- 현재: 단순 재무 트렌드 + 리뷰 트렌드 별도 분석
- 개선: `crossAnalyze()` 결과를 진단 프롬프트에 주입
- Extended Thinking 활성화 (budgetTokens: 2048)

**Claude에 주입되는 교차 분석 예시:**
```
[교차 분석 결과]
- 3월 첫째주: 식자재비 +12만원 증가 & "양 적다" 리뷰 0건 → 품질 유지 확인
- 3월 둘째주: 배달 수수료율 변경(배민 6.8→7.2%) & 배달 매출 -8% → 가격 전가 영향 추정
- 금요일 저녁 매출 평균 150만원 (주중 평균 95만원 대비 +58%) → 주말 인력 배치 확인 필요
- 리뷰 별점 4.3→4.0 하락 기간에 매출도 -5% → 상관관계 r=0.72
```

### 2-7. Seri 호출 최적화

현재 `seri-engine.ts`에서 Claude 4회 호출 → 1회로 축소.

**수정:** `src/lib/ai/seri-engine.ts`
- profit/cashflow/cost 개별 narrative → 결정론적 한국어 템플릿으로 대체 (LLM 불필요)
- dailySummary만 Claude 1회 호출 (계산 결과 + 교차 분석 결과를 종합)

```
[하이브리드 아키텍처]
코드 계산 (정확, 즉시): 매출 합계, 마진율, 변화율, 이상 감지 → 숫자
Claude 1회 (인사이트): 숫자 + 교차분석 + 프로필 → "왜?"와 "그래서 뭘 해야 해?"
```

### 2-8. 프롬프트 품질 대폭 개선

**수정:** `src/lib/ai/seri-prompts.ts`, `jeongjang-prompts.ts`, `dapjangi-prompts.ts`

**Few-shot 예시 추가** (좋은 응답 vs 나쁜 응답):

```
[좋은 응답 예시]
사장님: 이번 달 장사 어때?
AI: 3월 1-19일 매출 1,420만원, 월말 예상 약 2,240만원이에요.
지난달(2,180만원)보다 소폭 상승인데, 배민은 +15%인 반면 쿠팡이츠는 -8%예요.
쿠팡이츠 쪽 리뷰를 보니 '배달 늦다'는 불만이 3건 있어서 영향이 있는 것 같아요.
식자재비가 12만원 더 나갔는데 대파 가격 때문인 것 같으니, 대체 식재료를 검토해보시겠어요?

[나쁜 응답 - 절대 이렇게 하지 마세요]
AI: 이번 달 매출을 분석해드리겠습니다. 총 매출은 양호한 수준입니다.
마케팅 전략을 수립하시는 것이 바람직할 것으로 사료됩니다.
```

**응답 구조 강제:**
```
모든 분석 응답에 반드시 포함:
1. 핵심 수치 (금액, 변화율) - 구체적 숫자
2. "왜?" 가설 (데이터 기반 원인 추정)
3. "그래서 뭘 해야 해?" 구체적 액션 1-2개
4. 액션의 예상 효과 (가능하면 숫자로)

절대 하지 말 것:
- "다양한 전략을 수립하세요" 같은 빈말
- 사장님이 이미 아는 일반 상식
- 실행 불가능한 제안 ("마케팅 전문가 고용하세요")
```

---

## Phase 3: 품질 고도화 (2주)

### 3-1. 업종별 벤치마크 시스템

**신규:** `src/lib/ai/industry-benchmarks.ts`

```typescript
const BENCHMARKS: Record<string, IndustryBenchmark> = {
  "한식당": {
    avgMonthlyRevenue: 25_000_000,
    foodCostRatio: { min: 30, max: 35, avg: 32 },
    laborRatio: { min: 25, max: 30, avg: 28 },
    rentRatio: { min: 8, max: 15, avg: 10 },
    deliveryRatio: { min: 30, max: 50, avg: 40 },
    avgRating: 4.2,
    profitMargin: { min: 12, max: 20, avg: 15 },
  },
  "카페": { /* ... */ },
  "소매점": { /* ... */ },
  "분식점": { /* ... */ },
  "치킨점": { /* ... */ },
};
```

**LLM 주입:** 비즈니스 프로필에 벤치마크 비교 포함
```
[업종 대비] 식자재비 40%(평균 32% 대비 높음) | 인건비 32%(평균 28% 대비 높음) | 배달비중 62%(평균 40% 대비 높음)
```

### 3-2. 사용자 피드백 수집

**DB 마이그레이션:** `supabase/migrations/00010_ai_feedback.sql`

**수정:** 채팅 메시지, 브리핑 카드, 리뷰 답글에 thumbs up/down 추가.
피드백 → `ai_feedback` 테이블 → prompt_version과 연결 → 프롬프트 개선 데이터.

### 3-3. 프롬프트 버저닝

**신규:** `src/lib/ai/prompt-registry.ts` - 각 프롬프트에 버전 부여, 피드백과 연결.

### 3-4. Haiku/Sonnet 태스크 분배

| 태스크 | 모델 | 비용 효과 |
|--------|------|----------|
| 대화 요약 생성 | Haiku | -80% |
| 리뷰 감성 분석 배치 | Haiku | -80% |
| 프로필 업데이트 추출 | Haiku | -80% |
| 재무 인사이트 생성 | Sonnet | 유지 |
| 리뷰 답글 생성 | Sonnet | 유지 |
| Q&A 채팅 | Sonnet | 유지 |
| 교차 진단 | Sonnet + Extended Thinking | +10% |

---

## Phase 4: 선제적 인사이트 (지속)

### 4-1. 프로액티브 알림 강화
- 현재: 모닝 루틴 1회/일 → 하루 3~5회 체크 (Supabase Edge Function)
- 이상 감지 즉시 알림 (매출 급락, 부정 리뷰 급증, 현금 부족 예측)
- 기회 감지 알림 ("오늘 날씨 흐림 → 배달 주문 증가 예상, 식자재 준비하세요")

### 4-2. 바이럴 에이전트 AI 엔진
- 재방문 유도 문자 자동 생성
- SNS 콘텐츠 제안 (메뉴 사진 + 캡션)
- 프로모션 타이밍 최적화 (매출 저조 예측 시기에 자동 제안)

### 4-3. RAG - 비즈니스 지식 기반
- pgvector로 과거 진단/브리핑 기록 임베딩
- "작년 여름에 어떻게 했지?" 같은 질문에 유사 패턴 검색
- 업종별 경영 가이드 RAG

---

## 수정 대상 파일 전체 목록

### Phase 1 (신규 2 + 수정 7)
| 파일 | 작업 |
|------|------|
| `src/lib/ai/claude-client.ts` | **신규** - 공통 유틸리티 (캐싱, 로깅, 재시도) |
| `src/lib/ai/schemas.ts` | **신규** - Zod 스키마 중앙 관리 |
| `src/lib/ai/seri-engine.ts` | 수정 - claude-client 사용 |
| `src/lib/ai/briefing-generator.ts` | 수정 - generateObject |
| `src/lib/ai/proactive-diagnosis.ts` | 수정 - generateObject |
| `src/lib/ai/review-responder.ts` | 수정 - claude-client |
| `src/lib/ai/sentiment-analyzer.ts` | 수정 - generateObject |
| `src/lib/ai/brand-voice.ts` | 수정 - generateObject |
| `src/lib/ai/expense-classifier.ts` | 수정 - generateObject |

### Phase 2 (신규 4 + 수정 8 + migration 1)
| 파일 | 작업 |
|------|------|
| `src/lib/ai/business-profile.ts` | **신규** - 가게 DNA 엔진 |
| `src/lib/ai/chat-tools.ts` | **신규** - Tool Use 7개 도구 |
| `src/lib/ai/cross-analyzer.ts` | **신규** - 교차 분석 엔진 |
| `supabase/migrations/00009_chat_memory.sql` | **신규** - chat_messages + conversation_summaries |
| `src/app/api/chat/route.ts` | 수정 - Tool Use + 3계층 메모리 + 프로필 주입 |
| `src/lib/ai/seri-engine.ts` | 수정 - 4회→1회 호출 + store_context 저장 + agent_memory 저장 |
| `src/lib/ai/jeongjang-engine.ts` | 수정 - store_context 읽기 + agent_memory 읽기/쓰기 |
| `src/lib/ai/dapjangi-engine.ts` | 수정 - agent_memory 저장 |
| `src/lib/ai/proactive-diagnosis.ts` | 수정 - 교차 분석 주입 + Extended Thinking |
| `src/lib/ai/seri-prompts.ts` | 수정 - Few-shot + 응답 구조 강제 + 벤치마크 |
| `src/lib/ai/jeongjang-prompts.ts` | 수정 - Few-shot + 프로필 컨텍스트 + 메모리 참조 |
| `src/lib/ai/dapjangi-prompts.ts` | 수정 - 교차 분석 결과 반영 |

### Phase 3 (신규 3 + 수정 4 + migration 1)
| 파일 | 작업 |
|------|------|
| `src/lib/ai/industry-benchmarks.ts` | **신규** - 업종별 벤치마크 |
| `src/lib/ai/prompt-registry.ts` | **신규** - 프롬프트 버저닝 |
| `supabase/migrations/00010_ai_feedback.sql` | **신규** - ai_feedback 테이블 |
| `src/app/api/feedback/route.ts` | **신규** - 피드백 API |
| UI 컴포넌트 3~4개 | 수정 - thumbs up/down 버튼 |
| `src/lib/ai/claude-client.ts` | 수정 - Haiku/Sonnet 분배 로직 |

---

## 비용 종합 예측

| 단계 | 사업장 일일 | 사업장 월간 | 매출 대비 |
|------|-----------|-----------|----------|
| 현재 | $0.10~0.15 | $3.0~4.5 | 40~60% |
| Phase 1 후 | $0.06~0.10 | $1.8~3.0 | 24~40% |
| Phase 2 후 | $0.04~0.07 | $1.2~2.1 | 16~28% |
| Phase 3 후 | $0.03~0.05 | $0.9~1.5 | 12~20% |

---

## 사장님 체감 품질 변화 시뮬레이션

### 현재
```
사장님: 요즘 장사 어때?
AI: 이번 달 매출은 2,100만원이며, 순이익은 350만원입니다.
    경영 상태를 개선하기 위해 다양한 전략을 수립하시는 것이 좋겠습니다.
```

### Phase 2 완료 후
```
사장님: 요즘 장사 어때?
AI: [Tool: getBusinessSnapshot 호출]
    [Tool: getReviewAnalysis 호출]

    사장님, 3월 매출 2,100만원으로 지난달(1,980만원)보다 6% 올랐어요!
    특히 배민 매출이 +15%인데, 지난번에 올리신 신메뉴 효과인 것 같아요.

    다만 쿠팡이츠 쪽 리뷰에 "배달 느리다" 불만이 3건 연속 들어왔어요.
    쿠팡이츠 매출이 -8%인 것도 이 영향일 수 있으니 배달 대행사 확인해보시겠어요?

    식자재비가 12만원 더 나갔는데, 대파 시세 때문이에요.
    지난달에 말씀하셨던 비용 절감 목표(30% 이하)까지 2% 남았어요.

사장님: 쿠팡이츠 리뷰 좀 보여줘
AI: [이전 대화 기억 → 쿠팡이츠 맥락 유지]
    [Tool: getReviewAnalysis({ platform: "coupangeats", days: 14 }) 호출]

    최근 2주 쿠팡이츠 리뷰 8건 중:
    - 배달 지연 불만 3건 (모두 저녁 7-8시 피크타임)
    - 맛 칭찬 4건 (신메뉴 언급 2건!)
    - 양 불만 1건

    배달 지연이 피크타임에 집중되어 있어요.
    배달 대행 업체 변경이나, 피크타임 조리 선준비를 고려해보시는 건 어떨까요?
```

---

## 검증 방법

1. **비용 검증**: claude-client.ts 토큰 로깅으로 Phase별 비용 비교
2. **Structured Output 검증**: 기존 regex 결과와 generateObject 결과 비교
3. **개인화 검증**: 3일간 데이터 축적 후 "요즘 장사 어때?" 질문 → 가게 맥락 반영 여부
4. **메모리 검증**: 멀티턴 대화 → "아까 말한 매출" 후속 질문 처리 확인
5. **Tool Use 검증**: "이번 달 배달 매출" → queryRevenue 도구 호출 확인
6. **교차 분석 검증**: 진단 결과에 리뷰↔매출 상관관계 포함 여부
7. **타입 체크**: `npx tsc --noEmit`
8. **기능 테스트**: `pnpm dev`로 각 AI 기능 수동 테스트

---

## 실행 순서

```
SPEC-UI-001 완료 (채팅 UI, 리뷰 버튼, 랜딩)
    ↓
Phase 1 (1주) - 인프라: 공통 유틸리티, 캐싱, Structured Outputs
    ↓
Phase 2 (3주) - 핵심: 프로필, Tool Use, 메모리, 교차분석, 프롬프트 개선
    ↓
Phase 3 (2주) - 품질: 벤치마크, 피드백, Haiku/Sonnet 분배
    ↓
Phase 4 (지속) - 고급: 프로액티브 알림, 바이럴 AI, RAG
```

**차별화 전략:** 캐시노트가 "얼마" → sajang.ai는 "왜 + 그래서 뭘 해야 하는지"

---

## Phase 5: 데이터 팜 - "돈 새는 곳 찾기" 엔진 (3주)

> 플랫폼에 쌓이는 매출/매입 데이터를 익명 집계하여 교차 비교. 사장님의 비용이 동종 업계 대비 비싼지 즉시 알려주는 킬러 기능.

### 5-1. 핵심 컨셉

```
내 가게 인터넷비 5만원/월
         vs
동일 업종 평균   3만원/월   ← 플랫폼 내 익명 집계
전국 평균        3.3만원/월 ← 공공 API (통계청 KOSIS)
→ "인터넷비가 업종 평균보다 67% 비쌉니다. 결합상품 전환 시 월 2만원 절감 가능"
```

### 5-2. 3가지 데이터 소스 결합

| 소스 | 내용 | 업데이트 주기 |
|------|------|-------------|
| **내부 데이터 팜** | 플랫폼 사용자의 익명 비용 집계 (9대 분류별) | 월 1회 배치 |
| **공공 API** | 국토부 상가 임대 실거래, 소진공 상권정보, 통계청 KOSIS | 분기~연 1회 |
| **벤치마크 테이블** | 국세청 경비율, 유틸리티 적정 범위, 배달 수수료율 | 연 1~2회 수동 |

### 5-3. 내부 데이터 팜 구현

**DB 마이그레이션:** `supabase/migrations/00011_data_farm.sql`

```sql
-- 업종 표준화 (자유 텍스트 → Enum)
CREATE TABLE industry_types (
  code text PRIMARY KEY,           -- "korean_restaurant", "cafe", "chicken"
  name_ko text NOT NULL,           -- "한식당", "카페", "치킨점"
  parent_code text,                -- 대분류 그룹핑
  nts_code text                    -- 국세청 업종코드 연결
);

-- 지역 표준화
CREATE TABLE regions (
  code text PRIMARY KEY,           -- "seoul_gangnam", "busan_haeundae"
  name_ko text NOT NULL,           -- "서울 강남구"
  sido text NOT NULL,              -- "서울특별시"
  sigungu text NOT NULL            -- "강남구"
);

-- 익명 비용 벤치마크 (월 1회 배치 생성)
CREATE TABLE expense_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_code text REFERENCES industry_types(code),
  region_code text REFERENCES regions(code),
  category text NOT NULL,          -- 9대 분류
  sub_category text,               -- 세부 항목 (임차료, 인터넷 등)
  avg_amount numeric NOT NULL,
  median_amount numeric NOT NULL,
  p25_amount numeric,              -- 하위 25%
  p75_amount numeric,              -- 상위 75%
  sample_count int NOT NULL,       -- 비교 대상 수 (최소 5개 이상)
  calculated_month text NOT NULL,  -- "2026-03"
  UNIQUE(industry_code, region_code, category, sub_category, calculated_month)
);
-- RLS: 모든 인증 사용자 조회 가능 (익명화됨)

-- businesses 테이블 확장
ALTER TABLE businesses ADD COLUMN industry_code text REFERENCES industry_types(code);
ALTER TABLE businesses ADD COLUMN region_code text REFERENCES regions(code);
```

**배치 집계 프로세스:** `src/lib/ai/data-farm.ts`

```typescript
// 월 1회 실행 (cron)
async function rebuildBenchmarks(): Promise<void> {
  // 1. 활성 구독자의 expenses/fixed_costs 집계
  // 2. industry_code + region_code 기준 그룹핑
  // 3. avg, median, p25, p75 계산
  // 4. sample_count >= 5인 그룹만 저장 (통계적 유의미성)
  // 5. expense_benchmarks 테이블 upsert
}

// 개별 사업체 비용 진단
async function diagnoseCosts(businessId: string): Promise<CostDiagnosis[]> {
  // 1. 사업체의 비용 항목별 합계
  // 2. 동일 industry_code + region_code의 벤치마크 조회
  // 3. 편차 계산 (내 비용 vs 평균/중앙값)
  // 4. 편차 큰 항목 순으로 정렬
  // 5. 각 항목에 절감 제안 첨부
}
```

**비용 진단 결과 예시:**
```typescript
interface CostDiagnosis {
  category: string;        // "고정비용"
  subCategory: string;     // "통신비"
  myAmount: number;        // 50000
  benchmarkAvg: number;    // 33000
  benchmarkMedian: number; // 30000
  deviationPct: number;    // +52%
  sampleCount: number;     // 87 (비교 대상 수)
  severity: "info" | "warning" | "critical";  // >30% = critical
  suggestion: string;      // "통신사 결합상품 전환 시 월 2만원 절감 가능"
}
```

### 5-4. 공공 API 연동 (권리금닷컴 사례 기반 확장)

**참고:** 권리금닷컴이 12개 API를 활용하여 상권분석/권리금 산정을 제공. sajang.ai는 이 중 9개를 비용 진단/인사이트 관점으로 재활용.

**신규:** `src/lib/public-data/`

| 파일 | API | 엔드포인트 | 용도 | 비용 |
|------|-----|----------|------|------|
| `rent-benchmark.ts` | 국토부 상가 임대 실거래 | `openapi.molit.go.kr/.../getRTMSDataSvcSHRent` | 지역/면적별 임대료 시세, 보증금/월세 | 무료 |
| `commercial-zone.ts` | 소진공 상가정보 (3개 엔드포인트) | `storeListInRadius` (반경 내 매장), `storeZoneOne` (상권 상세), `storeZoneInUpjong` (업종별 상권) | 경쟁 매장 수, 상권 밀집도, 업종별 분포 | 무료 |
| `industry-stats.ts` | 통계청 KOSIS OpenAPI | `kosis.kr/openapi/` | 업종별 비용 구조 (인건비/임차료/수도광열비/통신비 등 항목별 비율) | 무료 |
| `nts-expense-rate.ts` | 국세청 업종별 경비율 (수동 DB) | 홈택스 고시 (연 1회) | 업종코드별 표준 경비율 (단순/기준) | 무료 |
| `building-info.ts` | 국토부 건축물대장 API | `apis.data.go.kr/1613000/BldRgstService/` | 건물 면적/층수/용도 자동 파악 → 임대료 비교 정확도 향상 | 무료 |
| `floating-population.ts` | 서울시 유동인구 + 통계청 SGIS | 서울: `openapi.seoul.go.kr/.../VwsmSignguStorePopltn`, 전국: `sgis.kostat.go.kr/` | 시간대/연령대/요일별 유동인구 → 입지 기반 인사이트 | 무료 |
| `card-sales-stats.ts` | 중소벤처기업부 카드매출 통계 | `data.go.kr` (상세 확인 필요) | 업종별/지역별 카드매출 추이 → 매출 벤치마크 | 무료 |
| `franchise-info.ts` | 공정위 가맹정보 | `apis.data.go.kr/1130000/FftcBrandRlsService/getBrandRlsInfo` | 프랜차이즈 브랜드 매장수, 업종분류 → 프랜차이즈 사장님 벤치마크 | 무료 |

**자동 수집 스케줄러** (권리금닷컴 사례 참고):

```
매일 04:00 → 소진공 상가정보 API → 경쟁 매장 변동 추적 (신규/폐업)
매월 01일 → 국토부 임대 실거래 → 지역별 임대료 트렌드 갱신
분기 1회 → 통계청 KOSIS → 업종별 비용 구조 갱신
연 1회   → 국세청 경비율 → 표준경비율 DB 갱신
연 1회   → 공정위 가맹정보 → 프랜차이즈 마스터 갱신
```

**활용 시나리오 확장 (공공데이터 기반):**

```
사장님: 가게 위치가 괜찮은 거야?
AI: [Tool: getLocationAnalysis 호출]

    📍 역삼역 상권 분석:
    - 반경 500m 내 한식당 23개 (경쟁 밀집도: 중상)
    - 유동인구: 일 평균 12,400명 (직장인 72%, 20-40대 68%)
    - 피크 시간: 점심 12-13시 (유동인구의 34%)

    📊 임대료 비교 (국토부 실거래 기준):
    - 사장님 매장: 33m2, 월세 250만원 (평당 7.6만원)
    - 같은 상권 33m2 평균: 월세 185만원 (평당 5.6만원)
    - 같은 상권 상위 25%: 월세 220만원

    🏗️ 건물 정보 (건축물대장):
    - 건축년도: 2015년, 1층, 상업시설
    - 유사 조건(2010년 이후, 1층) 평균 월세: 200만원

    → 임대료가 같은 상권 평균보다 35% 높습니다.
      계약 갱신 시 200-220만원대로 협상해보시겠어요?
      월 30-50만원 절감 가능합니다.
```

**임대료 진단 예시:**
```
사장님 가게: 서울 강남구, 한식당, 1층, 33m2, 보증금 3000만/월세 250만

[국토부 실거래] 강남구 33m2 상가 최근 6개월:
  - 평균 월세: 180만원
  - 중앙값: 170만원
  - 상위 25%: 220만원

[소진공 상권정보] 역삼역 상권:
  - 1층 평당 환산임대료: 약 6.5만원/m2 → 33m2 = 215만원

→ "사장님 임대료 250만원은 같은 지역 평균(180만원)보다 39% 높습니다.
   계약 갱신 시 임대료 인하 협상 여지가 있습니다.
   참고: 인근 상가 최근 거래가는 170~220만원대입니다."
```

### 5-5. LLM Tool로 연결

`chat-tools.ts`에 데이터 팜 도구 추가:

```typescript
getCostDiagnosis: {
  description: "내 비용이 동종 업계 대비 비싼 곳을 찾습니다. '돈 어디서 새고 있어?', '비용 줄일 데 없어?', '임대료가 비싼 거 아닌지'에 사용",
  parameters: z.object({
    category: z.string().optional(),  // 특정 카테고리만 진단
  }),
  // 반환: CostDiagnosis[] 상위 5개 (편차 큰 순)
},
getRentBenchmark: {
  description: "내 가게 임대료가 적정한지 공공 데이터 기반으로 비교합니다. '임대료 비싸?', '월세 적당한지'에 사용",
  parameters: z.object({}),
  // 반환: 국토부 실거래 + 소진공 상권정보 기반 비교
},
```

**채팅 시나리오:**
```
사장님: 돈이 너무 새는 것 같아. 어디서 새고 있는지 찾아줘
AI: [Tool: getCostDiagnosis 호출]

    사장님 가게의 비용을 같은 업종(한식당) 87개 매장과 비교해봤어요.

    🔴 임대료: 250만원 (평균 180만원 대비 +39%)
       → 같은 강남구 33m2 상가 최근 거래가가 170~220만원이에요.
         계약 갱신 시 인하 협상 여지가 있습니다.

    🟡 통신비: 5만원 (평균 3.3만원 대비 +52%)
       → 인터넷+전화 결합상품으로 전환하면 월 2만원 절감 가능해요.

    🟡 보험료: 8만원 (평균 5.5만원 대비 +45%)
       → 영업배상책임보험을 재견적하면 월 2~3만원 절감 가능합니다.

    ✅ 식자재비: 820만원 (평균 850만원 대비 -4%)
       → 잘 관리하고 계세요!

    총 절감 가능 금액: 월 약 74~93만원 (연 888~1,116만원)
```

### 5-6. 사업자번호 기반 자동 프로필링 (사용자 입력 최소화)

사용자가 사업자번호와 가게명만 입력하면 나머지를 자동으로 채우는 구조.

**자동 추출 흐름:**

```
사업자번호 입력 → "인증하기" 클릭
    ↓
[1] 국세청 API (이미 구현됨, 응답 확장만 필요)
    → b_sector (업태): "한식"
    → b_type (종목): "음식점"
    → tax_type: "간이과세자" / "일반과세자"
    → 자동으로 industry_code 매핑
    ↓
[2] 사업자번호 앞 3자리 → 관할 세무서 코드
    → "101" = 종로세무서 → region_code = "seoul_jongno"
    → "211" = 부산진세무서 → region_code = "busan_busanjin"
    → 세무서코드 → 시군구 매핑 테이블 (약 130개)
    ↓
[3] 가게명 + 지역으로 카카오 로컬 API 검색 (선택적 보강)
    → 정확한 도로명주소
    → 업종 카테고리 (카카오 기준)
    → 영업시간
    → 좌표 (위도/경도)
    ↓
온보딩 폼에 자동 채움 (사용자는 확인만)
```

**현재 NTS API 응답에서 버리고 있는 데이터 활용:**

```typescript
// AS-IS: verifyBusinessNumber()가 isActive만 반환
return { success: true, isActive, businessNumber: item.b_no, validMsg: item.valid_msg };

// TO-BE: 업태/종목/세금유형도 반환
return {
  success: true, isActive,
  businessNumber: item.b_no,
  validMsg: item.valid_msg,
  businessSector: item.request_param?.b_sector,  // "한식" (업태)
  businessType: item.request_param?.b_type,      // "음식점" (종목)
  taxType: item.status?.tax_type,                // "간이과세자"
};
```

**세무서코드 → 지역 매핑:** `src/lib/data/tax-office-regions.ts`

```typescript
// 사업자번호 앞 3자리 = 관할 세무서 코드 (약 130개)
const TAX_OFFICE_REGION: Record<string, { region: string; sido: string; sigungu: string }> = {
  "101": { region: "seoul_jongno", sido: "서울", sigungu: "종로구" },
  "104": { region: "seoul_gangnam", sido: "서울", sigungu: "강남구" },
  "211": { region: "busan_busanjin", sido: "부산", sigungu: "부산진구" },
  // ... 약 130개
};

export function getRegionFromBusinessNumber(bno: string) {
  return TAX_OFFICE_REGION[bno.substring(0, 3)] ?? null;
}
```

**카카오 로컬 API로 상세 정보 보강:** `src/lib/public-data/kakao-local.ts`

```typescript
// 가게명 + 지역으로 검색 → 주소, 카테고리, 좌표 자동 수집
async function searchBusiness(name: string, region: string) {
  // GET https://dapi.kakao.com/v2/local/search/keyword.json?query={name}&region={region}
  // 반환: address_name, road_address_name, category_name, x, y
}
```

**온보딩 UX 변경:**

```
[AS-IS] 사용자가 직접 입력 (4개 필드)
  사업자등록번호 [__________] [인증하기]
  사업장명 [__________]     ← 직접 입력
  업종 [__________]         ← 직접 입력
  주소 [__________]         ← 직접 입력

[TO-BE] 사업자번호 인증 시 자동 채움 (사용자는 확인+수정만)
  사업자등록번호 [1234567890] [인증하기]
  ✅ 인증 완료 - 계속사업자

  사업장명 [맛있는 한식당]   ← 직접 입력
  업종 [한식 > 음식점]      ← 🔒 국세청 자동 (수정 가능)
  지역 [서울 강남구]        ← 🔒 세무서코드 자동 (수정 가능)
  주소 [서울 강남구 역삼로 123] ← 🔒 카카오 검색 자동 (수정 가능)
  매장면적 [33 m²]          ← 카카오 또는 수동 입력
```

**수정 대상 파일:**
- `src/lib/actions/business.ts` - `verifyBusinessNumber()` 응답 확장, `registerBusiness()` 필드 추가
- `src/app/auth/onboarding/onboarding-form.tsx` - 자동채움 UI, 수정 가능한 프리필
- `src/lib/data/tax-office-regions.ts` - **신규** 세무서코드→지역 매핑
- `src/lib/public-data/kakao-local.ts` - **신규** 카카오 로컬 검색 API

### 5-7. 프라이버시 보호

- 벤치마크는 **최소 5개 사업체 이상** 집계된 경우에만 노출
- 개별 사업체 식별 불가능한 집계 통계만 제공
- `expense_benchmarks` 테이블에 원본 business_id 저장하지 않음
- RLS로 원본 expenses는 본인 것만 접근 가능

### 5-8. 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `supabase/migrations/00011_data_farm.sql` | **신규** - industry_types, regions, expense_benchmarks, businesses 확장 |
| `src/lib/ai/data-farm.ts` | **신규** - 벤치마크 배치 집계 + 비용 진단 |
| `src/lib/public-data/rent-benchmark.ts` | **신규** - 국토부 임대 실거래 API |
| `src/lib/public-data/commercial-zone.ts` | **신규** - 소진공 상권정보 API |
| `src/lib/public-data/industry-stats.ts` | **신규** - 통계청 KOSIS API |
| `src/lib/public-data/nts-expense-rate.ts` | **신규** - 국세청 경비율 DB |
| `src/lib/ai/chat-tools.ts` | 수정 - getCostDiagnosis, getRentBenchmark 도구 추가 |
| `src/app/auth/onboarding/onboarding-form.tsx` | 수정 - 업종/지역 표준화 드롭다운 |
| `src/lib/actions/business.ts` | 수정 - industry_code, region_code 저장 |
| `src/app/api/cron/benchmark/route.ts` | **신규** - 월 1회 벤치마크 배치 |
| `src/lib/ai/seri-prompts.ts` | 수정 - 비용 진단 결과 프롬프트 주입 |

---

## 최종 실행 순서 (Phase 5 포함)

```
SPEC-UI-001 완료 (채팅 UI, 리뷰 버튼, 랜딩)
    ↓
Phase 1 (1주) - 인프라: 공통 유틸리티, 캐싱, Structured Outputs
    ↓
Phase 2 (3주) - 핵심: 프로필, Tool Use, 메모리, 교차분석, 프롬프트 개선
    ↓
Phase 3 (2주) - 품질: 벤치마크, 피드백, Haiku/Sonnet 분배
    ↓
Phase 4 (지속) - 고급: 프로액티브 알림, 바이럴 AI, RAG
    ↓
Phase 5 (3주) - 데이터 팜: 내부 익명 집계 + 공공 API + 돈 새는 곳 찾기
```

> Phase 5는 Phase 2의 Tool Use 인프라 위에서 동작하므로 Phase 2 이후 언제든 시작 가능.
> 단, 유의미한 벤치마크를 위해 최소 50개 이상 사업체 데이터가 필요 → 사용자 확보와 병행.
