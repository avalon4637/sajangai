# 기술 스택

## 전체 기술 스택

| 분류 | 기술 | 버전 | 역할 |
|------|------|------|------|
| 언어 | TypeScript | 5.x (strict mode) | 전체 코드베이스 타입 안전성 |
| 프레임워크 | Next.js | 16.1.6 | App Router, RSC, API Routes |
| 런타임 | React | 19.2.3 | UI 렌더링, Server Components |
| 데이터베이스 | Supabase | 최신 | PostgreSQL + Auth + RLS |
| AI | Vercel AI SDK | ^6.0.91 | AI 스트리밍, 모델 통합 |
| AI 모델 | Anthropic Claude | Sonnet 4.5 | 한국어 경영 분석 |
| AI SDK | @ai-sdk/anthropic | ^3.0.45 | Claude 연동 어댑터 |
| UI 컴포넌트 | shadcn/ui | new-york 스타일 | 복사-붙여넣기 컴포넌트 |
| CSS | Tailwind CSS | 4.x | 유틸리티 기반 스타일링 |
| 차트 | Recharts | 3.7 | KPI 시각화 (미구현) |
| 상태 관리 | Zustand | 5.x | 클라이언트 전역 상태 (미구현) |
| 폼 | React Hook Form | 7.x | 폼 상태 관리 |
| 유효성 검사 | Zod | 4.x | 스키마 기반 타입 검사 |
| 테이블 | TanStack React Table | 8.x | 데이터 테이블 |
| CSV | PapaParse | 5.x | CSV 파싱 |
| 아이콘 | Lucide React | 최신 | SVG 아이콘 |
| 테스트 | Vitest | 4.x | 단위/통합 테스트 |
| 테스트 | Testing Library | 최신 | React 컴포넌트 테스트 |
| 린터 | ESLint | 9.x | 코드 품질 |
| 린터 설정 | eslint-config-next | 최신 | Next.js 최적화 규칙 |
| 패키지 매니저 | pnpm | 9+ | 빠른 설치, 디스크 효율 |
| 배포 | Vercel | Serverless | 자동 스케일링, Edge Network |

## 프레임워크 선택 이유

### Next.js 15 App Router

Next.js App Router를 선택한 핵심 이유는 세 가지입니다.

첫째, **React Server Components(RSC)**를 통해 서버에서 Supabase 데이터를 직접 조회하고 HTML을 렌더링하여 클라이언트 번들 크기를 최소화합니다. 소상공인 사용자 중 모바일 환경 사용 비율이 높아 초기 로딩 성능이 중요합니다.

둘째, **API Routes**로 Claude AI 스트리밍 엔드포인트를 동일 프로젝트 내에 구현합니다. 별도 백엔드 서버 없이 `/api/ai`를 Serverless Function으로 배포합니다.

셋째, **Vercel 통합**이 Next.js와 가장 최적화되어 있습니다. 자동 CI/CD, Edge 캐싱, 스트리밍 응답 지원이 기본 제공됩니다.

### Supabase

Supabase를 선택한 이유는 다음과 같습니다.

**Row Level Security(RLS)**로 애플리케이션 레이어가 아닌 DB 레이어에서 데이터 격리를 보장합니다. 사장님별 데이터가 절대 혼재되지 않습니다.

**Auth 내장**으로 JWT 기반 세션 관리, 이메일/소셜 로그인을 즉시 사용 가능합니다. 인증 인프라를 직접 구축할 필요가 없습니다.

**SSR/RSC 지원 클라이언트** (`@supabase/ssr`)로 Next.js App Router의 서버/클라이언트 컴포넌트 양쪽에서 동일한 패턴으로 사용합니다.

### Vercel AI SDK + Claude Sonnet 4.5

**Vercel AI SDK**는 스트리밍 텍스트 응답을 Next.js API Route에서 가장 쉽게 구현하는 방법입니다. `streamText()` 함수 하나로 스트리밍 파이프라인이 완성됩니다.

**Claude Sonnet 4.5**는 한국어 이해와 생성 품질이 뛰어나며, 경영 분석처럼 맥락이 풍부한 응답 생성에 적합합니다. 소상공인 현장 언어(배달앱 용어, 업종별 관용어)에도 자연스럽게 반응합니다.

### Tailwind CSS v4

Tailwind v4는 PostCSS 대신 Vite 플러그인 기반으로 작동하여 빌드 속도가 크게 향상됩니다. CSS 변수 기반 테마 시스템으로 shadcn/ui와의 연동이 자연스럽습니다. `oklch` 색상 공간을 기본 지원하여 다크 모드 색상 일관성이 향상됩니다.

### shadcn/ui

컴포넌트를 npm 패키지로 설치하지 않고 소스코드를 직접 프로젝트에 복사합니다. 따라서 외부 버전 변경에 영향받지 않으며, 비즈니스 요구에 맞게 자유롭게 수정할 수 있습니다. `new-york` 스타일은 테두리와 그림자가 뚜렷하여 데이터 중심 대시보드에 적합합니다.

## 개발 환경 요구사항

### 필수 도구

- **Node.js**: 20.x LTS 이상 (Next.js 15 요구사항)
- **pnpm**: 9.x 이상 (`pnpm-workspace.yaml` 사용)
- **Git**: 2.x 이상

### 환경 변수

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 값을 설정합니다.

```
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
ANTHROPIC_API_KEY=sk-ant-[key]
```

- `NEXT_PUBLIC_` 접두사 변수는 브라우저에 노출됩니다. Supabase URL과 anon key는 공개해도 안전합니다(RLS로 보호).
- `ANTHROPIC_API_KEY`는 서버 전용입니다. 브라우저에 노출되지 않습니다.

`.env.local.example` 파일이 저장소에 포함되어 있어 필요한 변수 목록을 확인할 수 있습니다.

### Supabase 로컬 개발

```bash
# Supabase CLI 설치
npm install -g supabase

# 로컬 Supabase 스택 시작 (Docker 필요)
supabase start

# 마이그레이션 적용
supabase db push

# 타입 생성
supabase gen types typescript --local > src/types/database.ts
```

## 빌드 및 배포 설정

### 개발 서버 실행

```bash
pnpm install
pnpm dev
```

`http://localhost:3000`에서 개발 서버가 시작됩니다.

### 프로덕션 빌드

```bash
pnpm build
pnpm start
```

### Vercel 배포

Vercel에 GitHub 저장소를 연결하면 `main` 브랜치 푸시 시 자동 배포됩니다.

Vercel 프로젝트 설정에서 환경 변수를 등록합니다:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`

`next.config.ts`에 별도 설정 없이 Vercel이 Next.js 프로젝트를 자동 인식합니다.

### TypeScript 설정 (`tsconfig.json`)

- `strict: true` - 모든 엄격한 타입 검사 활성화
- `moduleResolution: "bundler"` - Next.js 15 권장 설정
- `@/*` 경로 별칭 - `src/` 디렉토리를 루트로 매핑
- `target: "ES2017"` - 현대 브라우저 지원

## 테스트 전략 (Vitest)

### 테스트 프레임워크 구성

Vitest 4.x를 사용하며, Testing Library로 React 컴포넌트를 테스트합니다. Jest API와 호환되어 마이그레이션이 용이합니다. ESM 모듈을 기본 지원하여 Next.js와 자연스럽게 통합됩니다.

### 테스트 우선순위 (예정)

**1단계 - 핵심 비즈니스 로직 단위 테스트**

- `src/lib/kpi/calculator.ts`: KPI 계산 정확성, 엣지 케이스(0 매출, 음수 이익 등)
- `src/lib/simulation/engine.ts`: 4가지 시나리오 유형 결과 검증
- `src/lib/csv/parser.ts`: 다양한 한국어 CSV 포맷 파싱 정확성

**2단계 - 통합 테스트**

- Supabase 클라이언트 + RLS 정책 동작 검증
- AI API Route 스트리밍 응답 형식 검증

**3단계 - 컴포넌트 테스트**

- Testing Library로 UI 컴포넌트 렌더링 및 상호작용 테스트

### 품질 목표

- 전체 코드 커버리지 85% 이상
- `src/lib/` 디렉토리(순수 비즈니스 로직) 100% 커버리지 목표

## 주요 의존성 상세

### Vercel AI SDK (`ai` ^6.0.91)

`streamText()` 함수로 Claude 스트리밍 응답을 생성하고, `StreamingTextResponse`로 클라이언트에 전달합니다. `useChat()` 훅(미구현)으로 클라이언트 사이드 채팅 UI를 구현할 예정입니다.

### @supabase/ssr

브라우저/서버 환경별 올바른 쿠키 처리를 제공합니다. `createBrowserClient`는 CSR, `createServerClient`는 SSR/RSC/미들웨어에서 사용합니다.

### React Hook Form 7 + Zod 4

`zodResolver`로 폼 유효성 검사 스키마를 Zod로 정의하고 React Hook Form에 연결합니다. 입력 데이터의 타입 안전성을 보장하며, 서버 액션과의 통합도 지원합니다.

### TanStack React Table 8

헤드리스(headless) 테이블 라이브러리로 UI를 직접 제어합니다. shadcn/ui의 `<Table>` 컴포넌트와 결합하여 정렬, 필터링, 페이지네이션이 가능한 데이터 테이블을 구현합니다.

### PapaParse 5

브라우저와 Node.js 양쪽에서 동작하는 CSV 파서입니다. 스트리밍 모드로 대용량 CSV를 처리하며, 헤더 자동 감지와 타입 변환을 지원합니다. 한국어 인코딩(EUC-KR, UTF-8) 처리도 지원합니다.

### Recharts 3.7

React 기반 차트 라이브러리로 SVG 렌더링을 사용합니다. KPI 추이 차트(LineChart), 비용 구조 차트(PieChart), 시뮬레이션 비교 차트(BarChart) 구현에 사용 예정입니다.

### Zustand 5

최소한의 보일러플레이트로 전역 상태를 관리합니다. Context API 대비 리렌더링 최적화가 뛰어납니다. 대시보드 필터 상태, CSV 업로드 상태, AI 분석 결과 캐시 등에 사용 예정입니다.
