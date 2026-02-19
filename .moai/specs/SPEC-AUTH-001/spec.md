---
id: SPEC-AUTH-001
version: "1.0.0"
status: approved
created: "2026-02-19"
updated: "2026-02-19"
author: avalon4637
priority: P0
---

# SPEC-AUTH-001: 인증 시스템 및 사업장 등록

## HISTORY

| 버전  | 날짜       | 작성자      | 변경 내용                  |
| ----- | ---------- | ----------- | -------------------------- |
| 1.0.0 | 2026-02-19 | avalon4637  | 초기 작성                  |

---

## Environment (환경)

### 기술 스택

| 구분             | 기술                              | 버전       |
| ---------------- | --------------------------------- | ---------- |
| 프레임워크       | Next.js App Router                | 16.1.6     |
| UI 라이브러리    | React                             | 19.2.3     |
| 언어             | TypeScript strict                 | 5.x        |
| 인증 백엔드      | Supabase Auth                     | latest     |
| DB               | Supabase PostgreSQL (RLS 활성화)  | 16.x       |
| 폼 관리          | React Hook Form                   | 7.x        |
| 스키마 검증      | Zod                               | 4.x        |
| UI 컴포넌트      | shadcn/ui (new-york 테마)         | latest     |
| CSS              | Tailwind CSS                      | 4.x        |
| 테스트           | Vitest                            | 4.x        |

### 기존 인프라

- `src/middleware.ts`: 미인증 사용자를 `/auth/login`으로 리다이렉트 (이미 구현됨)
- `src/lib/supabase/client.ts`: `createBrowserClient` 클라이언트 팩토리 (이미 구현됨)
- `src/lib/supabase/server.ts`: `createServerClient` 서버 팩토리 (이미 구현됨)
- `src/lib/supabase/middleware.ts`: `updateSession()` 세션 갱신 함수 (이미 구현됨)
- `src/types/database.ts`: TypeScript DB 타입 정의 (이미 구현됨)
- `supabase/migrations/00001_initial_schema.sql`: businesses 테이블 스키마 (이미 적용됨)

### 데이터베이스 스키마

```sql
CREATE TABLE businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_type text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- RLS: auth.uid() = user_id 정책 적용
```

### 제약 사항

- 미들웨어가 `/auth/*` 경로를 인증 예외로 처리해야 함 (현재 `/login`, `/signup`만 예외)
- businesses 테이블에 첫 레코드 삽입 전까지 모든 하위 테이블(revenues, expenses 등) 데이터 삽입 불가 (RLS 외래키 제약)
- Supabase 이메일 인증 기본 설정 사용 (커스텀 UI 제외)

---

## Assumptions (가정)

| 번호 | 가정                                                              | 신뢰도 | 근거                               | 검증 방법                            |
| ---- | ----------------------------------------------------------------- | ------ | ---------------------------------- | ------------------------------------ |
| A-01 | Supabase 프로젝트가 이미 생성되어 환경변수가 설정되어 있다        | High   | `src/lib/supabase/client.ts` 존재  | `.env.local` 파일 확인               |
| A-02 | 이메일/비밀번호 인증 방식만 1차 지원한다                         | High   | SPEC 범위 정의                     | 소셜 로그인은 별도 SPEC              |
| A-03 | businesses 테이블의 user_id는 Supabase Auth `auth.uid()`와 동일하다 | High   | DB 스키마의 RLS 정책 확인         | RLS 정책 테스트                      |
| A-04 | 한 사용자는 하나의 사업장만 등록한다 (MVP 단계)                   | High   | SaaS 온보딩 UX 관행                | 온보딩 후 추가 등록 비활성화         |
| A-05 | 미들웨어 리다이렉트 경로를 `/auth/login`으로 수정해야 한다       | High   | 현재 middleware.ts는 `/login`으로 리다이렉트 | middleware.ts 코드 검토        |

---

## Requirements (요구사항)

### REQ-01: 인증 페이지 (로그인/회원가입)

#### Ubiquitous Requirements (항상 적용)

- 시스템은 항상 `/auth/login`과 `/auth/signup` 페이지를 제공해야 한다.
- 시스템은 항상 이메일과 비밀번호 입력 필드를 포함한 폼을 렌더링해야 한다.
- 시스템은 항상 Zod 스키마를 통해 클라이언트 측 입력 검증을 수행해야 한다.
- 시스템은 항상 React Hook Form을 통해 폼 상태를 관리해야 한다.

#### Event-Driven Requirements (이벤트 기반)

- WHEN 사용자가 유효한 이메일과 비밀번호로 로그인 폼을 제출하면 THEN 시스템은 Supabase `signInWithPassword`를 호출하고 `/dashboard`로 리다이렉트해야 한다.
- WHEN 사용자가 회원가입 폼을 유효한 데이터로 제출하면 THEN 시스템은 Supabase `signUp`을 호출하고 `/auth/onboarding`으로 리다이렉트해야 한다.
- WHEN Supabase Auth가 에러를 반환하면 THEN 시스템은 폼 하단에 한국어 에러 메시지를 표시해야 한다.
- WHEN 사용자가 이미 로그인된 상태로 `/auth/login`에 접근하면 THEN 시스템은 `/dashboard`로 리다이렉트해야 한다.

#### State-Driven Requirements (상태 기반)

- IF 이메일 형식이 유효하지 않으면 THEN 시스템은 이메일 필드 아래에 인라인 에러 메시지를 표시해야 한다.
- IF 비밀번호가 8자 미만이면 THEN 시스템은 비밀번호 필드 아래에 인라인 에러 메시지를 표시해야 한다.
- IF 회원가입 시 비밀번호와 비밀번호 확인이 일치하지 않으면 THEN 시스템은 비밀번호 확인 필드에 에러를 표시해야 한다.
- IF 폼 제출이 진행 중이면 THEN 시스템은 제출 버튼을 비활성화하고 로딩 인디케이터를 표시해야 한다.

#### Unwanted Requirements (금지 사항)

- 시스템은 비밀번호를 평문으로 저장하거나 전송하지 않아야 한다 (Supabase Auth가 처리).
- 시스템은 인증 토큰을 localStorage에 저장하지 않아야 한다 (Supabase SSR 쿠키 방식 사용).
- 시스템은 Supabase 에러 코드를 사용자에게 직접 노출하지 않아야 한다.

---

### REQ-02: 사업장 등록 온보딩

#### Ubiquitous Requirements (항상 적용)

- 시스템은 항상 `/auth/onboarding` 페이지를 제공해야 한다.
- 시스템은 항상 사업장명, 업종, 주소 입력 폼을 제공해야 한다.
- 시스템은 항상 사업장명 필드를 필수로 검증해야 한다.

#### Event-Driven Requirements (이벤트 기반)

- WHEN 인증된 사용자가 사업장 등록 폼을 유효한 데이터로 제출하면 THEN 시스템은 `businesses` 테이블에 레코드를 삽입하고 `/dashboard`로 리다이렉트해야 한다.
- WHEN 이미 사업장을 등록한 사용자가 `/auth/onboarding`에 접근하면 THEN 시스템은 `/dashboard`로 리다이렉트해야 한다.
- WHEN 미인증 사용자가 `/auth/onboarding`에 접근하면 THEN 미들웨어가 `/auth/login`으로 리다이렉트해야 한다.

#### State-Driven Requirements (상태 기반)

- IF 사업장명이 비어 있으면 THEN 시스템은 필수 입력 에러 메시지를 표시해야 한다.
- IF 데이터베이스 삽입이 실패하면 THEN 시스템은 에러 메시지를 표시하고 폼을 유지해야 한다.
- IF 폼 제출이 진행 중이면 THEN 시스템은 제출 버튼을 비활성화해야 한다.

#### Optional Requirements (선택 사항)

- 가능하면 업종 선택을 자유 입력 텍스트로 제공한다.
- 가능하면 주소 입력을 단순 텍스트 필드로 제공한다 (지도 API 연동은 미래 SPEC).

#### Unwanted Requirements (금지 사항)

- 시스템은 미인증 상태에서 businesses 테이블 삽입을 허용하지 않아야 한다.
- 시스템은 한 사용자가 MVP 단계에서 복수의 사업장을 등록하도록 허용하지 않아야 한다.

---

### REQ-03: 인증 상태 관리 (useAuth 훅)

#### Ubiquitous Requirements (항상 적용)

- 시스템은 항상 `useAuth` 커스텀 훅을 통해 세션 상태를 구독해야 한다.
- 시스템은 항상 `onAuthStateChange` 이벤트를 통해 세션 변경을 감지해야 한다.

#### Event-Driven Requirements (이벤트 기반)

- WHEN `signOut`이 호출되면 THEN 시스템은 Supabase 세션을 종료하고 `/auth/login`으로 리다이렉트해야 한다.
- WHEN 세션이 만료되면 THEN 미들웨어가 다음 요청 시 `/auth/login`으로 리다이렉트해야 한다.

#### State-Driven Requirements (상태 기반)

- IF 세션이 유효하면 THEN `useAuth`는 `user` 객체와 `session` 객체를 반환해야 한다.
- IF 세션이 없으면 THEN `useAuth`는 `user`와 `session`을 `null`로 반환해야 한다.
- IF 세션 로딩 중이면 THEN `useAuth`는 `loading: true`를 반환해야 한다.

#### Unwanted Requirements (금지 사항)

- 시스템은 Client Component에서 직접 Supabase 서버 클라이언트를 사용하지 않아야 한다.
- 시스템은 `useAuth` 훅 외부에서 세션 상태를 직접 조작하지 않아야 한다.

---

### REQ-04: 대시보드 레이아웃 (사이드바)

#### Ubiquitous Requirements (항상 적용)

- 시스템은 항상 `(dashboard)` 라우트 그룹에 공통 레이아웃을 적용해야 한다.
- 시스템은 항상 사이드바 내비게이션을 포함한 레이아웃을 렌더링해야 한다.

#### Event-Driven Requirements (이벤트 기반)

- WHEN 사용자가 사이드바의 로그아웃 버튼을 클릭하면 THEN 시스템은 `signOut`을 호출해야 한다.

#### State-Driven Requirements (상태 기반)

- IF 사용자가 `(dashboard)` 라우트에 접근하면 THEN 시스템은 서버 컴포넌트에서 세션을 검증해야 한다.
- IF 세션이 없는 상태로 `(dashboard)` 라우트에 접근하면 THEN 미들웨어가 `/auth/login`으로 리다이렉트해야 한다.

#### Optional Requirements (선택 사항)

- 가능하면 사이드바에 현재 사용자의 이메일을 표시한다.
- 가능하면 사이드바에 등록된 사업장명을 표시한다.

---

### REQ-05: 보안 및 에러 처리

#### Ubiquitous Requirements (항상 적용)

- 시스템은 항상 미들웨어에서 `/auth/*` 경로를 인증 검사 예외로 처리해야 한다.
- 시스템은 항상 Server Action 또는 Server Component에서 RLS 정책을 우회하는 서비스 롤 키 사용을 금지해야 한다.

#### Event-Driven Requirements (이벤트 기반)

- WHEN 중복 이메일로 회원가입을 시도하면 THEN 시스템은 "이미 사용 중인 이메일입니다" 메시지를 표시해야 한다.
- WHEN 잘못된 비밀번호로 로그인을 시도하면 THEN 시스템은 "이메일 또는 비밀번호가 올바르지 않습니다" 메시지를 표시해야 한다.

#### Unwanted Requirements (금지 사항)

- 시스템은 에러 메시지에서 사용자 존재 여부를 노출하지 않아야 한다 (보안상 동일한 에러 메시지 사용).
- 시스템은 `SUPABASE_SERVICE_ROLE_KEY`를 클라이언트 코드에서 사용하지 않아야 한다.

---

## Specifications (명세)

### 파일 구조

```
src/app/
├── (auth)/
│   ├── layout.tsx              # Auth 라우트 그룹 레이아웃 (로그인/회원가입 공통 UI)
│   ├── login/
│   │   └── page.tsx            # 로그인 페이지
│   ├── signup/
│   │   └── page.tsx            # 회원가입 페이지
│   └── onboarding/
│       └── page.tsx            # 사업장 등록 온보딩 페이지
├── (dashboard)/
│   ├── layout.tsx              # Dashboard 라우트 그룹 레이아웃 (사이드바 포함)
│   └── dashboard/
│       └── page.tsx            # 대시보드 메인 페이지 (placeholder)
src/hooks/
│   └── use-auth.ts             # useAuth 커스텀 훅
src/lib/
│   └── validations/
│       └── auth.ts             # Zod 인증 스키마 (LoginSchema, SignupSchema, OnboardingSchema)
src/middleware.ts               # 수정 필요: /auth/* 예외 경로 업데이트
```

### 미들웨어 수정 사항

현재 `src/lib/supabase/middleware.ts`의 리다이렉트 경로를 `/login` → `/auth/login`으로 수정하고, 인증 예외 경로에 `/auth/` 접두사를 추가해야 한다.

### Zod 스키마 명세

```typescript
// src/lib/validations/auth.ts
LoginSchema: { email: z.string().email(), password: z.string().min(8) }
SignupSchema: LoginSchema + { confirmPassword: z.string() }.refine(비밀번호 일치)
OnboardingSchema: { name: z.string().min(1).max(100), business_type: z.string().optional(), address: z.string().optional() }
```

### useAuth 훅 명세

```typescript
// src/hooks/use-auth.ts
interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
```

---

## Traceability (추적성)

| 요구사항 ID | 구현 파일                                     | 테스트 파일                              |
| ----------- | --------------------------------------------- | ---------------------------------------- |
| REQ-01      | `(auth)/login/page.tsx`, `(auth)/signup/page.tsx` | `__tests__/auth/login.test.tsx`      |
| REQ-02      | `(auth)/onboarding/page.tsx`                  | `__tests__/auth/onboarding.test.tsx`     |
| REQ-03      | `hooks/use-auth.ts`                           | `__tests__/hooks/use-auth.test.ts`       |
| REQ-04      | `(dashboard)/layout.tsx`                      | `__tests__/dashboard/layout.test.tsx`    |
| REQ-05      | `middleware.ts`, `lib/supabase/middleware.ts`  | `__tests__/middleware.test.ts`           |

<!-- TAG: SPEC-AUTH-001 -->
