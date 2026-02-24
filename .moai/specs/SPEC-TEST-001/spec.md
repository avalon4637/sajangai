---
id: SPEC-TEST-001
version: "1.0.0"
status: ready
created: "2026-02-24"
priority: P1
depends_on: []
---

# SPEC-TEST-001: 테스트 커버리지 보강

## 개요

Phase 1에서 구현된 핵심 비즈니스 로직의 단위 테스트를 보강한다. 현재 테스트는 인증 관련 4개 파일(31개 테스트)만 존재하며, KPI 계산, CSV 파싱, 시뮬레이션 엔진 등 핵심 로직에 대한 테스트가 없다.

## 현재 테스트 현황

| 파일 | 테스트 수 | 영역 |
|------|----------|------|
| `src/lib/validations/auth.test.ts` | - | 인증 유효성 검사 |
| `src/app/auth/login/login-page.test.tsx` | - | 로그인 페이지 |
| `src/app/auth/signup/signup-page.test.tsx` | - | 회원가입 페이지 |
| `src/app/auth/onboarding/onboarding-form.test.tsx` | - | 온보딩 폼 |
| **합계** | **31개** | 인증만 |

## 범위

- KPI 계산 로직 (`calculator.ts`) 단위 테스트
- CSV 파서 (`parser.ts`) 엣지 케이스 테스트
- 시뮬레이션 엔진 (`engine.ts`) 단위 테스트
- 데이터 입력 유효성 검사 (`data-entry.ts`) 테스트
- 카테고리/채널 상수 (`categories.ts`) 테스트

## 범위 제외

- Server Action 통합 테스트 (Supabase 의존)
- E2E 테스트
- 컴포넌트 렌더링 테스트 (UI 테스트)

---

## Requirements (EARS)

### REQ-01: KPI 계산 테스트

**Ubiquitous:**
- 시스템은 `calculateKpi()` 함수에 대해 다음 시나리오를 테스트해야 한다:
  - 정상 입력: 매출, 비용, 인건비, 고정비가 있는 경우
  - 경계값: 매출 0, 비용 0, 모두 0인 경우
  - 음수: 순이익이 마이너스인 경우
  - 생존점수 가중치: 각 지표(순이익률 30, 매출총이익률 25, 인건비율 20, 고정비율 25)
  - 생존점수 등급: 위험(0-30), 주의(31-60), 양호(61-80), 우수(81-100)

### REQ-02: CSV 파서 테스트

**Ubiquitous:**
- 시스템은 `parseCsv()` 함수에 대해 다음 시나리오를 테스트해야 한다:
  - 한국어 헤더 자동 감지 (날짜, 금액, 구분, 채널 등)
  - 영문 헤더 감지
  - 숫자 포맷: 콤마 포함 ("1,000,000"), 원화 기호 ("₩1,000")
  - 날짜 포맷: "2026-01-15", "2026/01/15", "20260115"
  - 빈 행/빈 셀 처리
  - 인코딩: UTF-8, EUC-KR
  - 대용량: 1000행 이상 파일
  - 잘못된 형식: 비CSV 파일, 빈 파일

### REQ-03: 시뮬레이션 엔진 테스트

**Ubiquitous:**
- 시스템은 `runSimulation()` 함수에 대해 다음 시나리오를 테스트해야 한다:
  - 4가지 시나리오 타입: employee_change, revenue_change, rent_change, expense_change
  - 원 단위 / % 단위 변경
  - 양수/음수 변경 (증가/감소)
  - 변경 전후 KPI 비교 정확성
  - 경계값: 변경량 0, 매우 큰 변경량

### REQ-04: 데이터 유효성 검사 테스트

**Ubiquitous:**
- 시스템은 `data-entry.ts` 유효성 검사에 대해 다음을 테스트해야 한다:
  - 필수 필드 누락
  - 금액 범위 (0 이상, 상한선)
  - 날짜 유효성
  - 카테고리/채널 유효값

---

## 기술 설계

### 테스트 대상 파일 및 생성 파일

| 대상 | 테스트 파일 | 예상 테스트 수 |
|------|-----------|-------------|
| `src/lib/kpi/calculator.ts` | `src/lib/kpi/calculator.test.ts` | 15-20 |
| `src/lib/csv/parser.ts` | `src/lib/csv/parser.test.ts` | 15-20 |
| `src/lib/simulation/engine.ts` | `src/lib/simulation/engine.test.ts` | 12-15 |
| `src/lib/validations/data-entry.ts` | `src/lib/validations/data-entry.test.ts` | 10-12 |

### 테스트 프레임워크

- 기존 설정: Vitest (또는 Jest - package.json 확인 필요)
- 순수 함수 테스트 위주 (외부 의존성 없음)
- 테이블 기반 테스트 패턴 사용 (describe.each / it.each)

### 목표

- 테스트 수: 31개 → 80개+ (150% 증가)
- 핵심 비즈니스 로직 커버리지: 0% → 85%+

---

## 수용 기준

- [ ] calculator.test.ts: 15+ 테스트 통과
- [ ] parser.test.ts: 15+ 테스트 통과
- [ ] engine.test.ts: 12+ 테스트 통과
- [ ] data-entry.test.ts: 10+ 테스트 통과
- [ ] 전체 테스트 80개 이상
- [ ] 모든 테스트 통과 (0 failures)
- [ ] 핵심 로직 라인 커버리지 85%+

<!-- TAG: SPEC-TEST-001 -->
