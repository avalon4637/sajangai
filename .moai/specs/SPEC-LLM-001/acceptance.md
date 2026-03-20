---
id: SPEC-LLM-001
title: "LLM Architecture Overhaul - Acceptance Criteria"
version: "1.0.0"
status: draft
created: "2026-03-20"
updated: "2026-03-20"
spec_ref: SPEC-LLM-001/spec.md
plan_ref: SPEC-LLM-001/plan.md
---

# SPEC-LLM-001: Acceptance Criteria

## Module 1: AI Infrastructure

### AC-INF-001: 공통 Claude 클라이언트 유틸리티

```gherkin
Scenario: callClaudeObject가 유효한 타입 객체를 반환한다
  Given DiagnosisSchema가 Zod로 정의되어 있고
  And 프롬프트가 진단 결과를 요청하면
  When callClaudeObject<DiagnosisResult>(prompt, DiagnosisSchema)를 호출하면
  Then 반환된 객체가 DiagnosisSchema를 충족하고
  And 모든 필수 필드(severity, findings, recommendations)가 존재하고
  And 타입 검증이 런타임에서 통과한다
```

```gherkin
Scenario: 모든 AI 호출이 토큰 사용량을 로깅한다
  Given claude-client.ts가 로깅이 활성화된 상태에서
  When 임의의 callClaudeText() 호출이 완료되면
  Then input_tokens와 output_tokens가 로그에 기록되고
  And 일일 비용 집계에 반영된다
```

### AC-INF-002: Prompt Caching

```gherkin
Scenario: Prompt Caching이 토큰 비용을 절감한다
  Given system prompt에 cacheControl이 적용되어 있고
  And 동일한 system prompt로 2회 이상 호출하면
  When 두 번째 호출의 토큰 로그를 확인하면
  Then cache_read_input_tokens가 0보다 크고
  And 총 input 비용이 캐시 미적용 대비 감소한다
```

```gherkin
Scenario: 프롬프트 배치 순서가 캐시 효율을 최적화한다
  Given system prompt 배열이 [공통 지시(캐시), 업종벤치마크(캐시), 동적데이터(비캐시)] 순서이면
  When Claude API를 호출하면
  Then 공통 지시와 벤치마크 부분이 캐시되어 재사용된다
```

### AC-INF-003: Structured Outputs

```gherkin
Scenario: generateObject가 regex 파싱을 완전히 대체한다
  Given proactive-diagnosis.ts에서 기존 regex 파싱 코드가 제거되고
  When generateObject({ schema: DiagnosisSchema })를 호출하면
  Then 유효한 DiagnosisSchema 타입의 객체가 반환되고
  And text.match(/\{[\s\S]*\}/) 패턴이 코드에 존재하지 않는다
```

```gherkin
Scenario: 스키마 검증 실패 시 적절한 에러 처리
  Given generateObject 호출에서 Claude가 스키마에 맞지 않는 응답을 생성하면
  When Zod 검증이 실패하면
  Then 에러가 로깅되고
  And 사용자에게 적절한 폴백 응답이 반환된다
```

---

## Module 2: Intelligence Core

### AC-INT-001: 비즈니스 프로필 엔진

```gherkin
Scenario: 비즈니스 프로필이 매일 자동 갱신된다
  Given 사업장 ID가 유효하고 최근 6개월 매출/비용/리뷰 데이터가 존재하면
  When rebuildBusinessProfile()이 실행되면
  Then BusinessProfile 객체가 생성되고
  And monthlyAvgRevenue, profitMargin, avgRating 등 동적 필드가 계산되고
  And store_context에 agent_type='profile'로 저장된다
```

```gherkin
Scenario: 프로필 텍스트가 ~500 토큰 이내로 렌더링된다
  Given BusinessProfile 객체가 생성되면
  When renderProfileText()를 호출하면
  Then 반환된 텍스트의 토큰 수가 600 이하이고
  And 업종, 지역, 월평균 매출, 성장률, 배달 비중, 리뷰 상태가 포함된다
```

### AC-INT-002: Claude Tool Use 채팅

```gherkin
Scenario: 매출 관련 질문에 queryRevenue 도구가 호출된다
  Given 사장님이 "이번달 배달 매출 얼마야?"라고 입력하면
  When Claude가 Tool Use를 통해 도구를 선택하면
  Then queryRevenue 도구가 호출되고
  And parameters에 이번 달 periodStart/periodEnd가 포함되고
  And groupBy가 "channel"로 설정되고
  And 응답에 채널별 매출 수치가 포함된다
```

```gherkin
Scenario: 도구 결과가 50행을 초과하면 집계 요약을 반환한다
  Given queryExpenses 도구가 호출되고
  And 결과 데이터가 50행을 초과하면
  When 도구 핸들러가 실행되면
  Then 상위 항목의 집계 요약이 반환되고
  And "추가 조회 필요" 메시지가 포함된다
```

### AC-INT-003: 3계층 대화 메모리

```gherkin
Scenario: 채팅이 이전 대화를 기억한다
  Given 사장님이 이전 세션에서 "식자재비 절감 방법"을 질문했고
  And 해당 대화가 conversation_summaries에 요약 저장되었으면
  When 새 세션에서 "아까 말한 식자재비 건 어떻게 됐어?"라고 질문하면
  Then AI가 이전 대화의 식자재비 관련 맥락을 참조하여 응답하고
  And 이전 제안 내용을 언급한다
```

```gherkin
Scenario: 대화 종료 시 자동 요약이 생성된다
  Given 세션에서 5개 이상의 메시지가 교환되었으면
  When 세션이 종료되면 (일정 시간 비활성 또는 명시적 종료)
  Then Haiku 모델로 대화 요약이 생성되고
  And conversation_summaries 테이블에 summary, key_facts, follow_ups가 저장된다
```

### AC-INT-004: agent_memory 활성화

```gherkin
Scenario: agent_memory가 세션 간 인사이트를 유지한다
  Given 세리가 "3주 연속 식자재비 상승" 패턴을 발견하고
  And agent_memory에 importance=8로 저장했으면
  When 다음 날 모닝 루틴에서 점장이 agent_memory를 조회하면
  Then importance >= 7인 인사이트 목록에 해당 패턴이 포함되고
  And 브리핑에 "지속적인 식자재비 상승 경고"가 반영된다
```

```gherkin
Scenario: 채팅에서 사장님 선호가 기록된다
  Given 사장님이 AI의 비용 절감 제안에 긍정적으로 반응하면
  When 대화 종료 시 preference 추출이 실행되면
  Then agent_memory에 type='preference'로 저장되고
  And 향후 응답에서 유사한 방향의 제안이 우선순위를 받는다
```

### AC-INT-005: store_context 활성화

```gherkin
Scenario: 점장이 세리/답장이의 store_context를 교차 참조한다
  Given 세리가 store_context에 cashFlowRisk='caution'을 저장하고
  And 답장이가 store_context에 ratingTrend='declining'을 저장했으면
  When 점장의 runMorningRoutine()이 실행되면
  Then 브리핑에 "현금 흐름 주의 + 리뷰 하락 추세" 교차 인사이트가 포함된다
```

```gherkin
Scenario: store_context가 누락된 경우 graceful 처리
  Given 답장이의 store_context가 존재하지 않으면
  When 점장이 store_context를 조회하면
  Then 에러 없이 세리 데이터만으로 브리핑을 생성하고
  And "리뷰 분석 미완료" 상태가 표시된다
```

### AC-INT-006: 교차 분석 엔진

```gherkin
Scenario: 리뷰와 매출 상관관계를 분석한다
  Given 최근 90일간 리뷰와 매출 데이터가 존재하면
  When crossAnalyze()를 실행하면
  Then reviewRevenueCorrelation 배열에 최소 1개의 패턴이 포함되고
  And 각 패턴에 confidence 값이 0-1 사이로 설정되고
  And "별점 4.5+ 날 매출 증가" 같은 자연어 패턴이 생성된다
```

```gherkin
Scenario: 이상 감지가 적절한 severity를 부여한다
  Given 특정 날짜에 매출이 전주 대비 30% 이상 급락했으면
  When anomaly detection이 실행되면
  Then anomalies 배열에 해당 날짜가 포함되고
  And severity가 "critical"로 설정되고
  And description에 구체적 수치가 포함된다
```

### AC-INT-007: 세리 호출 최적화

```gherkin
Scenario: 세리 분석이 Claude 1회만 호출한다
  Given 세리 재무 분석 요청이 들어오면
  When seri-engine.ts의 analyze() 함수가 실행되면
  Then Claude API 호출이 정확히 1회 발생하고
  And 매출 합계, 마진율, 변화율은 결정론적 코드로 계산되고
  And Claude는 종합 인사이트 생성에만 사용된다
```

### AC-INT-008: 프롬프트 품질

```gherkin
Scenario: AI 응답이 4단계 구조를 따른다
  Given 사장님이 "요즘 장사 어때?"라고 질문하면
  When AI가 응답을 생성하면
  Then 응답에 구체적 매출 수치가 포함되고 (핵심 수치)
  And 변화의 원인 가설이 포함되고 (왜?)
  And 실행 가능한 구체적 액션이 1-2개 포함되고 (그래서 뭘 해야 해?)
  And "다양한 전략을 수립하세요" 같은 빈말이 포함되지 않는다
```

---

## Module 3: Quality Optimization

### AC-QUA-001: 업종별 벤치마크

```gherkin
Scenario: 벤치마크가 "업종 평균 대비" 비교를 보여준다
  Given 사업장의 업종이 "한식당"이고
  And 식자재비율이 40%이면
  When 비즈니스 프로필이 렌더링되면
  Then "식자재비 40%(평균 32% 대비 높음)" 형태의 비교가 포함되고
  And 편차가 큰 항목이 강조된다
```

```gherkin
Scenario: 미지원 업종에 대해 graceful 처리
  Given 사업장의 업종이 벤치마크에 없는 "꽃집"이면
  When 벤치마크 조회를 시도하면
  Then 에러 없이 벤치마크 비교 없는 프로필이 반환되고
  And "벤치마크 미지원 업종" 메시지가 포함된다
```

### AC-QUA-002: 사용자 피드백

```gherkin
Scenario: thumbs up/down 피드백이 DB에 저장된다
  Given AI 채팅 메시지에 thumbs up/down 버튼이 표시되고
  When 사장님이 thumbs down을 클릭하면
  Then ai_feedback 테이블에 feedback_type='negative'로 저장되고
  And 해당 메시지의 message_id와 prompt_version이 연결된다
```

```gherkin
Scenario: 피드백 API가 올바른 데이터를 수집한다
  Given POST /api/feedback 요청에 message_id, feedback_type, prompt_version이 포함되면
  When API가 처리되면
  Then 201 상태 코드가 반환되고
  And ai_feedback 테이블에 레코드가 생성된다
```

### AC-QUA-003: 프롬프트 버저닝

```gherkin
Scenario: 프롬프트 버전이 응답에 추적 가능하다
  Given seri-prompts.ts의 현재 버전이 "seri-v2.1"이면
  When 세리가 응답을 생성하면
  Then 응답 메타데이터에 prompt_version="seri-v2.1"이 포함되고
  And 피드백 수집 시 해당 버전과 연결된다
```

### AC-QUA-004: Haiku/Sonnet 분배

```gherkin
Scenario: 대화 요약이 Haiku 모델을 사용한다
  Given 대화 세션 종료 시 요약 생성이 트리거되면
  When callClaudeText()가 호출되면
  Then 모델이 Claude Haiku로 설정되고
  And 요약 품질이 핵심 사실과 follow-up 항목을 포함한다
```

---

## Module 4: Proactive Features

### AC-PRO-001: 선제적 알림 강화

```gherkin
Scenario: 매출 급락 시 즉시 알림이 발송된다
  Given 일일 매출이 전주 동일 요일 대비 30% 이상 하락하면
  When 이상 감지 체크가 실행되면
  Then 사장님에게 푸시 알림이 발송되고
  And 알림에 구체적 하락 수치와 추정 원인이 포함된다
```

### AC-PRO-002: 바이럴 에이전트

```gherkin
Scenario: 재방문 유도 문자가 자동 생성된다
  Given 최근 30일 방문 고객 중 재방문 없는 고객이 존재하면
  When 바이럴 에이전트가 실행되면
  Then 개인화된 재방문 유도 문자 초안이 생성되고
  And 사장님 확인 후 발송 가능한 상태가 된다
```

---

## Module 5: Data Farm

### AC-FARM-001: 사업자번호 기반 자동 프로필링

```gherkin
Scenario: 사업자번호 인증 시 업종과 지역이 자동 채워진다
  Given 사용자가 사업자번호 "1234567890"을 입력하고 "인증하기"를 클릭하면
  When 국세청 API 인증이 성공하면
  Then 업종 필드에 b_sector(업태)와 b_type(종목)이 자동 표시되고
  And 지역 필드에 사업자번호 앞 3자리 기반 시군구가 자동 표시되고
  And 사용자는 자동 채워진 값을 확인하거나 수정할 수 있다
```

```gherkin
Scenario: 카카오 로컬 API로 상세 주소가 보강된다
  Given 사업자번호 인증으로 지역이 "서울 강남구"로 결정되고
  And 사장님이 가게명 "맛있는 한식당"을 입력하면
  When 카카오 로컬 API 검색이 실행되면
  Then 도로명주소가 자동 채워지고
  And 사용자가 검색 결과에서 정확한 가게를 선택할 수 있다
```

### AC-FARM-002: 내부 데이터 팜

```gherkin
Scenario: 비용 진단이 동종 업계 대비 편차를 보여준다
  Given 사업장의 industry_code가 "korean_restaurant"이고 region_code가 "seoul_gangnam"이고
  And 해당 그룹의 expense_benchmarks에 sample_count >= 5인 데이터가 존재하면
  When diagnoseCosts()를 실행하면
  Then CostDiagnosis 배열이 편차 큰 순으로 정렬되고
  And 각 항목에 myAmount, benchmarkAvg, deviationPct가 포함되고
  And severity가 올바르게 설정된다 (>30% = critical, 15-30% = warning, <15% = info)
```

```gherkin
Scenario: sample_count < 5인 경우 벤치마크를 노출하지 않는다
  Given 특정 업종/지역 그룹의 사업체 수가 4개 이하이면
  When 벤치마크 배치 집계가 실행되면
  Then 해당 그룹의 벤치마크가 expense_benchmarks에 저장되지 않고
  And 비용 진단 시 "비교 데이터 부족" 메시지가 반환된다
```

### AC-FARM-003: 공공 API 연동

```gherkin
Scenario: 국토부 API로 임대료 시세를 비교한다
  Given 사업장이 서울 강남구, 33m2, 월세 250만원이면
  When getRentBenchmark 도구가 호출되면
  Then 국토부 실거래 기반 같은 지역/면적의 평균/중앙값 월세가 반환되고
  And 사장님 임대료와의 편차율이 계산되고
  And 편차가 큰 경우 "계약 갱신 시 인하 협상 여지" 같은 제안이 포함된다
```

```gherkin
Scenario: 공공 API 호출 실패 시 폴백 처리
  Given 국토부 API가 응답하지 않으면
  When rent-benchmark.ts가 호출되면
  Then 에러 없이 캐시된 데이터 또는 국세청 경비율 기반 추정값이 반환되고
  And "실시간 데이터 조회 실패, 참고 데이터 기반 추정" 메시지가 포함된다
```

### AC-FARM-004: 비용 진단 Chat Tools

```gherkin
Scenario: "돈 새는 곳" 질문에 비용 진단이 실행된다
  Given 사장님이 "돈이 너무 새는 것 같아. 어디서 새고 있는지 찾아줘"라고 입력하면
  When Claude가 Tool Use를 통해 도구를 선택하면
  Then getCostDiagnosis 도구가 호출되고
  And 편차 큰 상위 5개 비용 항목이 반환되고
  And 각 항목에 내 금액, 업종 평균, 편차율, 절감 제안이 포함되고
  And 총 절감 가능 금액이 계산된다
```

```gherkin
Scenario: 임대료 적정성 질문에 공공 데이터 기반 비교가 제공된다
  Given 사장님이 "월세가 비싼 거 아닌지 확인해줘"라고 입력하면
  When Claude가 getRentBenchmark 도구를 호출하면
  Then 국토부 실거래 데이터 기반의 같은 지역 임대료 통계가 포함되고
  And 사장님 월세와의 편차율이 표시되고
  And 인근 상가 최근 거래 가격대가 참고로 제공된다
```

### AC-FARM-005: 상권 분석 (경쟁매장 + 유동인구)

```gherkin
Scenario: "가게 위치 괜찮아?" 질문에 상권 분석이 제공된다
  Given 사장님이 "가게 위치가 괜찮은 거야?"라고 입력하면
  When Claude가 getLocationAnalysis 도구를 호출하면
  Then 소진공 API 기반 반경 500m 내 동종 매장 수가 반환되고
  And 유동인구 데이터(시간대/연령대)가 포함되고
  And "직장인 비율 72%라 점심 매출이 핵심" 같은 입지 기반 인사이트가 생성된다
```

```gherkin
Scenario: 서울 외 지역도 유동인구 분석을 제공한다
  Given 사업장이 부산 해운대구에 위치하면
  When 유동인구 분석이 요청되면
  Then 통계청 SGIS 격자 인구통계로 폴백하여 분석이 제공되고
  And "서울시 API 미지원 지역, 통계청 데이터 기반" 안내가 포함된다
```

### AC-FARM-006: 건축물대장 기반 면적 자동 파악

```gherkin
Scenario: 사업자등록 후 건축물대장에서 면적을 자동 조회한다
  Given 사장님이 사업자번호 인증을 완료하고 주소가 확보되면
  When 건축물대장 API를 호출하면
  Then 건물 면적(m2), 층수, 용도가 자동으로 조회되고
  And 온보딩 폼의 매장면적 필드에 자동 채움되고
  And 임대료 비교 시 평당 단가 계산에 활용된다
```

### AC-FARM-007: 카드매출 통계 벤치마크

```gherkin
Scenario: 매출 수준을 동종 업계와 비교한다
  Given 사장님이 "매출이 평균이야?"라고 질문하면
  When Claude가 getIndustrySalesComparison 도구를 호출하면
  Then 같은 업종/지역의 카드매출 통계 평균이 반환되고
  And 사장님 매출과의 편차가 계산되고
  And "같은 지역 한식당 월 카드매출 평균 2,100만원 대비 86%입니다" 형태로 제공된다
```

---

## Quality Gate Criteria

### Definition of Done

- [ ] 모든 신규 파일에 TypeScript strict 모드 적용
- [ ] `npx tsc --noEmit` 에러 없음
- [ ] 각 Module의 핵심 시나리오 수동 테스트 통과
- [ ] regex 기반 JSON 파싱이 코드에 존재하지 않음 (Module 1 완료 후)
- [ ] 토큰 로깅으로 Phase별 비용 비교 데이터 확보
- [ ] DB 마이그레이션 스크립트 정상 실행 (00009, 00010, 00011)
- [ ] RLS 정책이 expense_benchmarks에 적용됨
- [ ] 개인 business_id가 벤치마크 데이터에 포함되지 않음

### 검증 방법

| 검증 항목 | 방법 | 완료 기준 |
|----------|------|----------|
| 비용 검증 | claude-client.ts 토큰 로깅 | Phase별 비용 감소 확인 |
| Structured Output | generateObject 반환 타입 확인 | 모든 스키마 통과 |
| 개인화 | 3일 데이터 축적 후 질문 테스트 | 가게 맥락 반영 |
| 메모리 | 멀티턴 대화 테스트 | "아까 말한" 후속 질문 처리 |
| Tool Use | 자연어 질문 -> 도구 매칭 | 올바른 도구 호출 |
| 교차 분석 | 진단 결과 검토 | 리뷰<->매출 상관관계 포함 |
| 타입 체크 | `npx tsc --noEmit` | 에러 0 |
| 자동 프로필링 | 실제 사업자번호 인증 테스트 | 업종/지역 자동 채움 |
| 벤치마크 | 5개+ 테스트 사업체로 집계 | 편차율 정확도 |
