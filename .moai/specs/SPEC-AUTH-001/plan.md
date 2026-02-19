# SPEC-AUTH-001 구현 계획

<!-- TAG: SPEC-AUTH-001 -->

## 개요

sajang.ai의 P0 크리티컬 이슈 해결을 위한 인증 시스템 및 사업장 등록 기능 구현 계획이다.
현재 앱이 `/auth/login` 페이지가 없어 완전히 접근 불가 상태이므로 최우선 처리가 필요하다.

---

## 태스크 분해 (의존성 순서)

### Milestone 1: 기반 구성 (Primary Goal)

다른 모든 태스크의 전제 조건이 되는 기반 파일을 먼저 작성한다.

#### TASK-01: 미들웨어 경로 수정

- **대상 파일**: `src/lib/supabase/middleware.ts`
- **변경 내용**:
  - 리다이렉트 경로: `/login` → `/auth/login`
  - 인증 예외 조건에 `/auth/` 접두사 추가
  - `pathname.startsWith("/auth/")` 조건으로 통합
- **의존성**: 없음 (첫 번째 태스크)
- **중요도**: 이 수정 없이는 로그인 페이지가 존재해도 무한 리다이렉트 발생

#### TASK-02: Zod 검증 스키마 생성

- **생성 파일**: `src/lib/validations/auth.ts`
- **내용**:
  - `LoginSchema`: email (email 형식), password (min 8자)
  - `SignupSchema`: LoginSchema + confirmPassword (비밀번호 일치 검증 refine)
  - `OnboardingSchema`: name (min 1, max 100 필수), business_type (optional), address (optional)
  - 타입 추론: `LoginFormData`, `SignupFormData`, `OnboardingFormData`
- **의존성**: 없음 (TASK-01과 병렬 진행 가능)

#### TASK-03: useAuth 커스텀 훅 생성

- **생성 파일**: `src/hooks/use-auth.ts`
- **내용**:
  - `createClient()` (browser client) 사용
  - `supabase.auth.getSession()` 초기 세션 로드
  - `supabase.auth.onAuthStateChange()` 구독
  - `signOut()` 액션: `supabase.auth.signOut()` + `router.push('/auth/login')`
  - 반환: `{ user, session, loading, signOut }`
- **의존성**: 없음 (TASK-01, TASK-02와 병렬 진행 가능)

---

### Milestone 2: 인증 페이지 구현 (Primary Goal)

#### TASK-04: Auth 라우트 그룹 레이아웃

- **생성 파일**: `src/app/(auth)/layout.tsx`
- **내용**:
  - 중앙 정렬 컨테이너 레이아웃
  - 로그인/회원가입 페이지 공통 배경 및 카드 래퍼
  - 로고 또는 서비스명 표시 영역
- **의존성**: TASK-01 완료 후

#### TASK-05: 로그인 페이지 구현

- **생성 파일**: `src/app/(auth)/login/page.tsx`
- **사용 컴포넌트**: shadcn/ui `Card`, `CardContent`, `CardHeader`, `Input`, `Label`, `Button`
- **내용**:
  - `useForm<LoginFormData>` + `zodResolver(LoginSchema)`
  - `supabase.auth.signInWithPassword()` 호출
  - 성공 시 `/dashboard`로 `router.push`
  - 에러 시 한국어 메시지 표시 (폼 레벨 에러)
  - 회원가입 페이지 링크
  - 로딩 상태 처리 (`isSubmitting`)
- **의존성**: TASK-02, TASK-04 완료 후

#### TASK-06: 회원가입 페이지 구현

- **생성 파일**: `src/app/(auth)/signup/page.tsx`
- **사용 컴포넌트**: shadcn/ui `Card`, `Input`, `Label`, `Button`
- **내용**:
  - `useForm<SignupFormData>` + `zodResolver(SignupSchema)`
  - `supabase.auth.signUp()` 호출
  - 성공 시 `/auth/onboarding`으로 `router.push`
  - 에러 시 한국어 메시지 표시
  - 로그인 페이지 링크
  - 로딩 상태 처리
- **의존성**: TASK-02, TASK-04 완료 후

---

### Milestone 3: 온보딩 및 대시보드 (Primary Goal)

#### TASK-07: 온보딩 페이지 구현

- **생성 파일**: `src/app/(auth)/onboarding/page.tsx`
- **사용 컴포넌트**: shadcn/ui `Card`, `Input`, `Label`, `Button`
- **내용**:
  - Server Component에서 세션 확인 (인증 검증)
  - 이미 사업장 등록된 경우 `/dashboard`로 리다이렉트
  - `useForm<OnboardingFormData>` + `zodResolver(OnboardingSchema)`
  - Supabase client를 사용한 `businesses` 테이블 INSERT
  - 성공 시 `/dashboard`로 `router.push`
  - `user_id`: `session.user.id` 사용
- **의존성**: TASK-02, TASK-04, TASK-03 완료 후

#### TASK-08: Dashboard 라우트 그룹 레이아웃

- **생성 파일**: `src/app/(dashboard)/layout.tsx`
- **내용**:
  - Server Component에서 세션 검증 (`createClient()` from server)
  - 세션 없으면 `redirect('/auth/login')`
  - 사이드바 내비게이션 컴포넌트 포함
  - 사이드바: 홈 링크, 로그아웃 버튼 (useAuth 훅 활용)
  - 사용자 이메일 표시 (optional)
- **의존성**: TASK-03 완료 후

#### TASK-09: Dashboard 메인 페이지 (Placeholder)

- **생성/수정 파일**: `src/app/(dashboard)/dashboard/page.tsx`
- **내용**:
  - 최소한의 placeholder UI ("대시보드" 타이틀)
  - 이후 SPEC에서 실제 내용 구현
- **의존성**: TASK-08 완료 후

---

### Milestone 4: 테스트 작성 (Secondary Goal)

#### TASK-10: 단위 테스트 작성

- **생성 파일**:
  - `src/__tests__/auth/login.test.tsx`
  - `src/__tests__/auth/signup.test.tsx`
  - `src/__tests__/auth/onboarding.test.tsx`
  - `src/__tests__/hooks/use-auth.test.ts`
- **프레임워크**: Vitest + React Testing Library
- **내용**: acceptance.md의 Given/When/Then 시나리오 기반
- **의존성**: TASK-05, TASK-06, TASK-07, TASK-03 완료 후

---

## 기술 결정 사항

### 1. 라우트 구조: 라우트 그룹 활용

**결정**: `/auth/*` 경로에 `(auth)` 라우트 그룹, `/dashboard/*`에 `(dashboard)` 라우트 그룹 사용

**이유**:
- URL에 그룹 이름이 노출되지 않음 (`/auth/login`은 URL에 `(auth)` 미포함)
- 라우트 그룹별 공통 레이아웃 적용 가능
- Next.js App Router의 권장 패턴

### 2. 인증 흐름: Client Component + Supabase Browser Client

**결정**: 로그인/회원가입 폼은 `'use client'` Client Component로 구현

**이유**:
- React Hook Form은 클라이언트 사이드 상태 관리가 필요
- `supabase.auth.signInWithPassword()`는 브라우저 환경에서 쿠키 설정 필요
- 서버 액션(Server Actions) 대신 클라이언트 방식 사용으로 즉각적인 에러 처리 가능

### 3. 세션 관리: Supabase SSR 쿠키 방식

**결정**: `@supabase/ssr` 패키지의 쿠키 기반 세션 관리 유지

**이유**:
- 이미 구현된 `createBrowserClient`/`createServerClient` 활용
- httpOnly 쿠키로 XSS 공격 방어
- Next.js App Router의 서버 컴포넌트와 호환

### 4. 폼 검증: Zod + React Hook Form

**결정**: `zodResolver`를 통한 통합 검증

**이유**:
- 클라이언트/서버 동일 스키마 재사용 가능
- TypeScript 타입 자동 추론
- 이미 스택에 포함된 기술

---

## 파일 생성/수정 목록

| 작업   | 파일 경로                                      | 규모 (예상 줄 수) |
| ------ | ---------------------------------------------- | ----------------- |
| 수정   | `src/lib/supabase/middleware.ts`               | ~50줄             |
| 생성   | `src/lib/validations/auth.ts`                  | ~40줄             |
| 생성   | `src/hooks/use-auth.ts`                        | ~50줄             |
| 생성   | `src/app/(auth)/layout.tsx`                    | ~30줄             |
| 생성   | `src/app/(auth)/login/page.tsx`                | ~80줄             |
| 생성   | `src/app/(auth)/signup/page.tsx`               | ~90줄             |
| 생성   | `src/app/(auth)/onboarding/page.tsx`           | ~80줄             |
| 생성   | `src/app/(dashboard)/layout.tsx`               | ~60줄             |
| 생성/수정 | `src/app/(dashboard)/dashboard/page.tsx`    | ~20줄             |
| 생성   | `src/__tests__/auth/login.test.tsx`            | ~60줄             |
| 생성   | `src/__tests__/auth/signup.test.tsx`           | ~60줄             |
| 생성   | `src/__tests__/auth/onboarding.test.tsx`       | ~50줄             |
| 생성   | `src/__tests__/hooks/use-auth.test.ts`         | ~50줄             |

**총 예상 파일 수**: 13개 (수정 1개 포함)

---

## 위험 분석

| 위험 요소                              | 가능성 | 영향도 | 대응 방안                                                  |
| -------------------------------------- | ------ | ------ | ---------------------------------------------------------- |
| 미들웨어 무한 리다이렉트 루프          | High   | Critical | `/auth/` 경로 전체를 예외 처리, 로컬 테스트로 즉시 검증  |
| 온보딩 후 `businesses` RLS 위반 에러  | Medium | High   | `session.user.id`를 `user_id`로 정확히 설정, 에러 핸들링 |
| React Hook Form + Zod 4.x 호환성      | Low    | Medium | `@hookform/resolvers` 최신 버전 확인                       |
| Supabase 환경변수 미설정               | Low    | Critical | `.env.local.example` 파일 확인 및 설정 가이드 제공        |
| `(auth)` 라우트 그룹의 URL 혼용 혼란  | Medium | Low    | 미들웨어에서 `/auth/` 경로 통합 처리                      |

---

## 태스크 의존성 그래프

```
TASK-01 (미들웨어 수정) ──────────────────────────────┐
TASK-02 (Zod 스키마) ──────────────────────────────────┤
TASK-03 (useAuth 훅) ──────────────────────────────────┤
                                                        ↓
TASK-04 (Auth 레이아웃) ──┬──→ TASK-05 (로그인 페이지)   ──┐
                          └──→ TASK-06 (회원가입 페이지) ──┤
                          └──→ TASK-07 (온보딩 페이지)    ──┤
                                                           ↓
TASK-03 ──────────────────────→ TASK-08 (Dashboard 레이아웃) ──→ TASK-09 (Dashboard 페이지)
                                                           ↓
                                                    TASK-10 (테스트)
```

---

## 구현 완료 기준 (Definition of Done)

- [ ] `npm run dev` 실행 후 `/auth/login` 페이지 정상 접근 가능
- [ ] 로그인 성공 시 `/dashboard`로 리다이렉트
- [ ] 회원가입 성공 시 `/auth/onboarding`으로 리다이렉트
- [ ] 온보딩 완료 시 `businesses` 테이블에 레코드 생성 확인
- [ ] 미인증 사용자가 `/dashboard`로 직접 접근 시 `/auth/login`으로 리다이렉트
- [ ] TypeScript 타입 에러 0개 (`npm run type-check`)
- [ ] Vitest 테스트 통과 (`npm run test`)
- [ ] ESLint 에러 0개 (`npm run lint`)
