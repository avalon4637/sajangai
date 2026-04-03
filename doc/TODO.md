# sajang.ai 할일 목록 (2026-04-03 기준)

> 비판적 분석 + 우선순위 반영 종합 정리

## 진행 현황 요약

```
완료: Phase 0 (안정화), SPEC-KICK-001, SPEC-ENGAGE-001, SPEC-GROWTH-001, SPEC-FINANCE-001
대기: SPEC-APP-001 (Capacitor 앱화)
```

---

## P0: 프로덕션 차단 이슈 (배포 전 필수)

### SEC: 보안 수정

- [ ] **SEC-01**: `insight_events`/`action_results` INSERT 정책을 `service_role` 전용으로 변경 (`WITH CHECK (true)` 제거)
- [ ] **SEC-02**: `/api/insights/act`, `/api/insights/dismiss`에 business 소유권 검증 추가 (IDOR 취약점)
- [ ] **SEC-03**: `/api/reviews/[id]/reply`, `/api/reviews/[id]/publish`에 리뷰→business 소유권 검증 추가
- [ ] **SEC-04**: `ai_feedback` 테이블 RLS 활성화 + 정책 추가
- [ ] **SEC-05**: `industry_types`, `regions`, `expense_benchmarks` 테이블 RLS 활성화
- [ ] **SEC-06**: `subscriptions.billing_key` 암호화 저장으로 전환
- [ ] **SEC-07**: CSRF 보호 (`src/lib/api/csrf.ts`) 모든 POST 라우트에 적용
- [ ] **SEC-08**: `SECURITY DEFINER` SQL 함수에 `p_business_id` 소유권 파라미터 검증 추가

### ERR: 에러 처리

- [ ] **ERR-01**: `/api/insights/act`에서 `businessId: ""` → insight 조회 후 실제 business_id 추출로 수정
- [ ] **ERR-02**: Error boundary 추가 (`src/app/error.tsx`, `src/app/(dashboard)/error.tsx`)
- [ ] **ERR-03**: 주요 `catch { }` 블록에 console.error 추가 (최소 API 라우트, 결제, 메시징)

### DEPLOY: 배포 준비

- [ ] **DEPLOY-01**: `.env.local.example` 전체 환경변수 목록으로 업데이트 (KAKAO, NTS, PORTONE, SOLAPI, HYPHEN, CRON_SECRET)
- [ ] **DEPLOY-02**: AI API 라우트(`/api/chat`, `/api/ai`, `/api/seri/report`)에 rate limiting 추가 (사용자당 분당 10회)
- [ ] **DEPLOY-03**: `CRON_SECRET` 환경변수 정의 + cron 라우트 인증 로직 확인
- [ ] **DEPLOY-04**: next.config.ts에 보안 헤더 추가 (CSP, X-Frame-Options, HSTS)

---

## P1: 핵심 기능 완성 (서비스 가치 직결)

### UI: 빠진 페이지 구현

- [ ] **UI-01**: 대출 관리 페이지 (`/loan` — CRUD: 대출 추가/수정/삭제, 상환 기록, 잔액 표시)
- [ ] **UI-02**: 예산 관리 페이지 (`/budget` — 카테고리별 월 목표 설정, 달성률 차트)
- [ ] **UI-03**: 입출금 내역 페이지 (`/cashflow` — 입출금 입력, 잔액/예비비 표시)
- [ ] **UI-04**: 일별 누적매출 + 7일 이동평균 차트 컴포넌트 (분석 페이지에 추가)
- [ ] **UI-05**: 사이드바 네비게이션 보완 — 매출/지출/고정비/CSV가져오기 접근 경로 추가
- [ ] **UI-06**: 사이드바 "김사장님" 하드코딩 → 실제 사업장명으로 교체
- [ ] **UI-07**: 사이드바 "점장 고용 중" 뱃지 → 구독 상태 동적 반영

### ACTION: 실행 기능 연결

- [ ] **ACTION-01**: 마케팅 페이지에 재방문 문자 발송 버튼 추가 (SolAPI 연동)
- [ ] **ACTION-02**: 인사이트 카드 → 리뷰 답글 등록 플로우 E2E 연결 확인
- [ ] **ACTION-03**: 체험 D+1~D+7 카톡 시퀀스 구현 (7개 템플릿 + 일별 발송 로직)

### PERF: 성능

- [ ] **PERF-01**: Daily briefing cron — 활성 구독자만 필터링 (`status IN ('trial','active')`)
- [ ] **PERF-02**: 인사이트 엔진 — 데이터 부족 시 카테고리별 조기 종료 (리뷰 0건이면 C시나리오 스킵)
- [ ] **PERF-03**: `delivery_reviews` 테이블에 `(business_id, review_date)` 복합 인덱스 추가

---

## P2: 품질 강화

### TEST: 테스트 보강

- [ ] **TEST-01**: 인사이트 시나리오 단위 테스트 (A1, A2, A3, B1, B2 — 각각 trigger/no-trigger 케이스)
- [ ] **TEST-02**: 인사이트 엔진 테스트 (시나리오 레지스트리, 실행, dedup, 에러 격리)
- [ ] **TEST-03**: ROI 계산기 테스트 (각 항목별 계산 검증)
- [ ] **TEST-04**: 채팅 메모리 테스트 (추출 + 주입)
- [ ] **TEST-05**: sync-orchestrator rate limiter 테스트 (trial vs paid)
- [ ] **TEST-06**: InsightCard 컴포넌트 테스트 (렌더링, 액션 클릭, dismiss)

### CODE: 코드 품질

- [ ] **CODE-01**: `supabase gen types` 실행 → `as any` 10건 제거
- [ ] **CODE-02**: TODO/미구현 함수 정리 (`rent-benchmark.ts`, `commercial-zone.ts`)
- [ ] **CODE-03**: `catch { }` → `catch (err) { console.error(err) }` 주요 51건 정리

### DATA: 데이터 무결성

- [ ] **DATA-01**: `businesses` 테이블에 `user_id` UNIQUE 제약 추가 (또는 앱 레벨 제한)
- [ ] **DATA-02**: `upsertInsight` DELETE+INSERT → 트랜잭션 또는 upsert로 변경
- [ ] **DATA-03**: soft delete 전략 검토 (businesses 삭제 시 CASCADE 대신 비활성화)
- [ ] **DATA-04**: vercel.json cron schedule 확인 (sync의 "every 5 hours" 주석 vs 실제 1일 1회 불일치)

---

## P3: 고도화

### FEATURE: 미구현 기능

- [ ] 인사이트 stub 시나리오 활성화 (A5 신메뉴, A6 배달시간, A7 날씨, A8 경쟁 — 데이터 소스 확보 후)
- [ ] 카드 수수료 분석 (B5) — 하이픈 카드 정산 데이터 확보 후
- [ ] 정산 누락 감지 (B6) — 주문 건별 정산 데이터 확보 후
- [ ] 랜딩 페이지 업데이트 — 현재 제품 비전(AI 점장)에 맞게 재구성
- [ ] 웹앱 오프라인 대응 (서비스 워커 or 최소 에러 상태)

### APP: Capacitor 앱화 (SPEC-APP-001)

- [ ] Capacitor 설정 + iOS/Android 프로젝트 생성
- [ ] 푸시 알림 (FCM/APNS)
- [ ] 딥링크 (sajangai:// scheme)
- [ ] App Store / Play Store 제출

---

## 작업 순서 권장

```
1단계 (즉시): P0 보안 수정 — 프로덕션 배포 전 필수
2단계 (1주): P1-UI — 사용자가 데이터를 넣고 볼 수 있어야 의미
3단계 (1주): P1-ACTION + P1-PERF — 실행 기능 + 성능 최적화
4단계 (지속): P2 테스트 + 코드 품질
5단계 (이후): P3 고도화 + 앱화
```

---

_Generated: 2026-04-03 by MoAI Critical Analysis_
