# SPEC-AUTH-001 인수 테스트 기준

<!-- TAG: SPEC-AUTH-001 -->

## 개요

SPEC-AUTH-001의 구현 완료를 검증하기 위한 인수 기준이다.
모든 Given/When/Then 시나리오는 Vitest + React Testing Library로 자동화 테스트 가능해야 한다.

---

## 인수 테스트 시나리오

### AC-01: 로그인 성공 흐름

```
Given: 사용자가 Supabase에 등록된 계정을 보유하고 있다
And:   사용자가 `/auth/login` 페이지에 접근한다
When:  유효한 이메일과 비밀번호(8자 이상)를 입력하고 "로그인" 버튼을 클릭한다
Then:  Supabase `signInWithPassword`가 호출된다
And:   사용자는 `/dashboard`로 리다이렉트된다
And:   로그인 버튼은 제출 중 비활성화 상태를 거쳐 완료된다
```

**검증 포인트**:
- `supabase.auth.signInWithPassword` 호출 여부
- `router.push('/dashboard')` 호출 여부
- 로딩 중 버튼 disabled 상태

---

### AC-02: 로그인 실패 - 잘못된 비밀번호

```
Given: 사용자가 `/auth/login` 페이지에 접근한다
When:  등록된 이메일과 잘못된 비밀번호를 입력하고 "로그인" 버튼을 클릭한다
Then:  Supabase가 에러를 반환한다
And:   폼에 "이메일 또는 비밀번호가 올바르지 않습니다" 한국어 메시지가 표시된다
And:   사용자는 현재 페이지에 그대로 유지된다
And:   리다이렉트가 발생하지 않는다
```

**검증 포인트**:
- 에러 메시지 텍스트 한국어 확인
- `router.push` 미호출 확인
- 에러 후 폼 초기화 없이 유지

---

### AC-03: 로그인 폼 유효성 검사 - 이메일 형식 오류

```
Given: 사용자가 `/auth/login` 페이지에 접근한다
When:  "notanemail" 같은 유효하지 않은 형식의 이메일을 입력하고 폼을 제출한다
Then:  Supabase API가 호출되지 않는다
And:   이메일 필드 하단에 인라인 에러 메시지가 표시된다
And:   사용자는 현재 페이지에 유지된다
```

**검증 포인트**:
- `supabase.auth.signInWithPassword` 미호출
- 이메일 필드의 aria-invalid 또는 에러 메시지 DOM 존재

---

### AC-04: 회원가입 성공 흐름

```
Given: 사용자가 Supabase에 등록되지 않은 신규 이메일을 보유하고 있다
And:   사용자가 `/auth/signup` 페이지에 접근한다
When:  유효한 이메일, 8자 이상의 비밀번호, 일치하는 비밀번호 확인을 입력하고 제출한다
Then:  Supabase `signUp`이 호출된다
And:   사용자는 `/auth/onboarding`으로 리다이렉트된다
```

**검증 포인트**:
- `supabase.auth.signUp` 호출 여부
- `router.push('/auth/onboarding')` 호출 여부

---

### AC-05: 회원가입 실패 - 비밀번호 불일치

```
Given: 사용자가 `/auth/signup` 페이지에 접근한다
When:  "password123"과 "password456"처럼 일치하지 않는 비밀번호를 입력하고 제출한다
Then:  Supabase API가 호출되지 않는다
And:   비밀번호 확인 필드에 "비밀번호가 일치하지 않습니다" 에러 메시지가 표시된다
```

**검증 포인트**:
- `supabase.auth.signUp` 미호출
- confirmPassword 필드 에러 메시지 존재

---

### AC-06: 회원가입 실패 - 중복 이메일

```
Given: 사용자가 이미 등록된 이메일로 회원가입을 시도한다
And:   사용자가 `/auth/signup` 페이지에 있다
When:  이미 등록된 이메일과 유효한 비밀번호를 입력하고 제출한다
Then:  Supabase가 중복 에러를 반환한다
And:   "이미 사용 중인 이메일입니다" 한국어 메시지가 표시된다
And:   사용자는 현재 페이지에 유지된다
```

**검증 포인트**:
- 에러 메시지 텍스트 한국어 확인
- 페이지 전환 없음 확인

---

### AC-07: 사업장 등록 온보딩 성공

```
Given: 사용자가 인증된 상태이다 (로그인 완료)
And:   사용자가 아직 businesses 테이블에 등록된 사업장이 없다
And:   사용자가 `/auth/onboarding` 페이지에 접근한다
When:  사업장명("테스트 카페")을 입력하고 "등록하기" 버튼을 클릭한다
Then:  Supabase `businesses` 테이블에 새 레코드가 삽입된다
And:   삽입된 레코드의 user_id가 현재 로그인한 사용자의 id와 일치한다
And:   사용자는 `/dashboard`로 리다이렉트된다
```

**검증 포인트**:
- Supabase insert 호출 및 user_id 확인
- `router.push('/dashboard')` 호출 여부
- name 필드값 전달 확인

---

### AC-08: 온보딩 - 사업장명 미입력 유효성 검사

```
Given: 사용자가 인증된 상태로 `/auth/onboarding` 페이지에 있다
When:  사업장명을 빈 상태로 "등록하기" 버튼을 클릭한다
Then:  Supabase API가 호출되지 않는다
And:   사업장명 필드에 "사업장명을 입력해주세요" 에러 메시지가 표시된다
```

**검증 포인트**:
- Supabase insert 미호출
- 에러 메시지 DOM 존재

---

### AC-09: 이미 사업장을 등록한 사용자의 온보딩 접근

```
Given: 사용자가 인증된 상태이다
And:   사용자의 businesses 테이블에 이미 레코드가 존재한다
When:  사용자가 `/auth/onboarding` 페이지에 직접 접근한다
Then:  시스템은 즉시 `/dashboard`로 리다이렉트한다
And:   온보딩 폼이 표시되지 않는다
```

**검증 포인트**:
- 서버 컴포넌트의 리다이렉트 로직 확인
- businesses 테이블 조회 후 리다이렉트

---

### AC-10: 미인증 사용자의 대시보드 접근 차단

```
Given: 사용자가 로그인하지 않은 상태이다 (세션 없음)
When:  사용자가 `/dashboard` URL에 직접 접근한다
Then:  미들웨어가 요청을 가로채서 `/auth/login`으로 리다이렉트한다
And:   대시보드 페이지 내용이 렌더링되지 않는다
```

**검증 포인트**:
- 미들웨어 리다이렉트 응답 확인
- HTTP 307/302 리다이렉트 상태코드

---

### AC-11: 로그아웃 흐름

```
Given: 사용자가 로그인된 상태로 `/dashboard`에 있다
When:  사이드바의 "로그아웃" 버튼을 클릭한다
Then:  Supabase `signOut`이 호출된다
And:   사용자는 `/auth/login`으로 리다이렉트된다
And:   세션 쿠키가 삭제된다
```

**검증 포인트**:
- `supabase.auth.signOut` 호출 여부
- `router.push('/auth/login')` 호출 여부

---

### AC-12: 이미 로그인된 사용자의 로그인 페이지 접근

```
Given: 사용자가 이미 유효한 세션을 보유하고 있다
When:  사용자가 `/auth/login` 페이지에 직접 접근한다
Then:  시스템은 `/dashboard`로 리다이렉트한다
And:   로그인 폼이 표시되지 않는다
```

**검증 포인트**:
- 서버 컴포넌트 또는 미들웨어의 세션 확인 후 리다이렉트

---

### AC-13: useAuth 훅 - 세션 로딩 상태

```
Given: useAuth 훅이 마운트된다
When:  초기 세션을 비동기로 조회 중이다
Then:  `loading`이 `true`를 반환한다
And:   세션 조회 완료 후 `loading`이 `false`로 변경된다
And:   세션이 있으면 `user`와 `session`이 채워진다
```

**검증 포인트**:
- 훅 초기 상태 `loading: true`
- 비동기 완료 후 상태 업데이트
- `onAuthStateChange` 구독 등록

---

## 엣지 케이스 시나리오

### EC-01: 비밀번호 길이 경계값 검사

```
Given: 로그인/회원가입 폼이 열려 있다
When:  7자 비밀번호("pass123")를 입력한다
Then:  "비밀번호는 최소 8자 이상이어야 합니다" 에러가 표시된다

When:  정확히 8자 비밀번호("pass1234")를 입력한다
Then:  비밀번호 필드 에러가 없다
```

---

### EC-02: 세션 만료 시 자동 리다이렉트

```
Given: 사용자가 로그인된 상태로 오랜 시간 비활성 상태였다
When:  세션이 만료된 후 사용자가 다음 요청을 보낸다
Then:  미들웨어의 `updateSession()`이 세션 갱신을 시도한다
And:   갱신 실패 시 `/auth/login`으로 리다이렉트한다
```

---

### EC-03: 네트워크 에러 시 폼 복구

```
Given: 사용자가 로그인 폼을 제출했다
When:  네트워크 오류 또는 Supabase 서비스 장애로 API 호출이 실패한다
Then:  일반 에러 메시지("서버 오류가 발생했습니다. 다시 시도해주세요.")가 표시된다
And:   폼이 초기화되지 않고 사용자 입력이 유지된다
And:   재시도가 가능하다
```

---

### EC-04: 사업장명 최대 길이 제한

```
Given: 온보딩 폼이 열려 있다
When:  101자 이상의 사업장명을 입력한다
Then:  "사업장명은 100자 이하여야 합니다" 에러가 표시된다
And:   Supabase API가 호출되지 않는다
```

---

### EC-05: SQL Injection 시도 방지

```
Given: 로그인 폼에 이메일 필드가 있다
When:  "'; DROP TABLE users; --" 같은 SQL injection 문자열을 입력한다
Then:  Zod 검증에서 이메일 형식 오류로 거부된다
And:   API 호출이 발생하지 않는다
```

---

## 성능 기준

| 지표                          | 기준값          | 측정 방법                        |
| ----------------------------- | --------------- | -------------------------------- |
| 로그인 페이지 초기 로드 (TTI) | 1초 미만        | Lighthouse, Next.js 빌드 분석    |
| 로그인 API 응답 후 리다이렉트 | 500ms 미만      | Network 탭 타이밍                |
| 온보딩 폼 제출 후 리다이렉트  | 1초 미만        | Network 탭 타이밍                |
| Zod 클라이언트 검증           | 즉각적 (< 50ms) | React DevTools 프로파일러        |

---

## TRUST 5 품질 게이트

### Tested (테스트 완성도)

- [ ] 단위 테스트 커버리지 85% 이상 (`src/app/(auth)/`, `src/hooks/use-auth.ts`)
- [ ] AC-01 ~ AC-13의 핵심 시나리오 자동화 테스트 구현
- [ ] 엣지 케이스 EC-01 ~ EC-04 테스트 구현

### Readable (가독성)

- [ ] 모든 컴포넌트 함수에 JSDoc 주석 없이도 의미 명확한 네이밍
- [ ] 에러 메시지 한국어 일관성 유지
- [ ] `use client` / `use server` 디렉티브 명확히 표시

### Unified (일관성)

- [ ] 모든 인증 페이지에 shadcn/ui 컴포넌트 일관 사용
- [ ] Zod 스키마에서 동일한 에러 메시지 패턴 사용
- [ ] ESLint 에러 0개 (`npm run lint`)

### Secured (보안성)

- [ ] 비밀번호 평문 전송 없음 (HTTPS + Supabase 처리)
- [ ] 인증 토큰이 localStorage에 저장되지 않음
- [ ] `SUPABASE_SERVICE_ROLE_KEY`가 클라이언트 번들에 미포함
- [ ] 에러 메시지에서 사용자 존재 여부 노출 없음

### Trackable (추적 가능성)

- [ ] 모든 Supabase API 에러가 콘솔에 로그됨 (프로덕션에서는 에러 서비스로 전송)
- [ ] `SPEC-AUTH-001` TAG가 모든 관련 파일에 포함
- [ ] TypeScript 타입 에러 0개 (`tsc --noEmit`)

---

## 수동 검증 체크리스트

구현 완료 후 로컬 환경에서 직접 수행해야 하는 검증 항목:

- [ ] `npm run dev` 실행 후 `http://localhost:3000` 접속 시 `/auth/login`으로 리다이렉트 확인
- [ ] 실제 Supabase 계정으로 로그인 성공 테스트
- [ ] 새 이메일로 회원가입 + 온보딩 + 대시보드 진입 전체 흐름 테스트
- [ ] Supabase Dashboard에서 `businesses` 테이블에 레코드 생성 확인
- [ ] 브라우저 쿠키 삭제 후 `/dashboard` 직접 접근 시 `/auth/login` 리다이렉트 확인
- [ ] 모바일 뷰포트 (375px)에서 로그인/회원가입 폼 렌더링 확인
