# 프로젝트 구조

## 전체 디렉토리 트리

```
sajang.ai/
├── src/                          # 애플리케이션 소스코드
│   ├── app/                      # Next.js App Router 루트
│   │   ├── api/
│   │   │   └── ai/
│   │   │       └── route.ts      # AI 분석 API (Claude 스트리밍)
│   │   ├── globals.css           # Tailwind v4 + shadcn 전역 스타일
│   │   ├── layout.tsx            # 루트 레이아웃 (Geist 폰트)
│   │   └── page.tsx              # 홈 페이지 (기본 Next.js)
│   ├── components/
│   │   └── ui/                   # shadcn/ui 컴포넌트 (6종)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── table.tsx
│   │       └── tabs.tsx
│   ├── hooks/                    # 커스텀 훅 (미구현, 예정)
│   ├── lib/                      # 핵심 비즈니스 로직 라이브러리
│   │   ├── csv/
│   │   │   └── parser.ts         # CSV 파싱 엔진 (한국어 헤더 감지)
│   │   ├── kpi/
│   │   │   └── calculator.ts     # KPI 계산 엔진 (생존 점수 0~100)
│   │   ├── simulation/
│   │   │   └── engine.ts         # 시뮬레이션 엔진 (4가지 시나리오)
│   │   ├── supabase/
│   │   │   ├── client.ts         # 브라우저 클라이언트
│   │   │   ├── middleware.ts     # 세션 갱신 미들웨어
│   │   │   └── server.ts         # 서버 컴포넌트 클라이언트
│   │   └── utils.ts              # cn() 유틸리티 (tailwind-merge)
│   ├── middleware.ts             # Next.js 전역 미들웨어 (인증 리디렉션)
│   └── types/
│       └── database.ts           # TypeScript DB 타입 정의 (Supabase 자동생성)
├── supabase/
│   └── migrations/
│       └── 00001_initial_schema.sql  # 초기 DB 스키마 (6개 테이블, RLS)
├── tests/                        # 테스트 코드 (미구현, 예정)
├── doc/                          # 기존 설계 문서
│   ├── architecture.md           # 시스템 아키텍처 설명
│   ├── data-schema.md            # 데이터 스키마 상세
│   ├── readme.md                 # 개발 가이드
│   ├── roadmap.md                # 개발 로드맵
│   └── template_excel/           # Excel 템플릿 참고 자료
├── public/                       # 정적 파일 (이미지, 아이콘 등)
├── .moai/                        # MoAI-ADK 설정 및 프로젝트 문서
├── .claude/                      # Claude Code 에이전트/스킬 설정
├── supabase/                     # Supabase 로컬 개발 설정
├── CLAUDE.md                     # MoAI 실행 지시
├── next.config.ts                # Next.js 설정
├── tsconfig.json                 # TypeScript 설정 (strict mode)
├── eslint.config.mjs             # ESLint 9 설정
├── components.json               # shadcn/ui 설정
├── package.json                  # 의존성 정의
├── pnpm-lock.yaml                # pnpm 잠금 파일
└── pnpm-workspace.yaml           # pnpm 워크스페이스 설정
```

## 핵심 파일 역할

### 비즈니스 로직 (`src/lib/`)

| 파일 | 역할 | 특징 |
|------|------|------|
| `kpi/calculator.ts` | KPI 계산 | 순수 함수, 상태 없음. 입력(매출/비용/고정비) → 출력(6개 KPI + 생존 점수) |
| `simulation/engine.ts` | What-if 시뮬레이션 | 4가지 시나리오 타입, 변경 전/후 KPI 비교 |
| `csv/parser.ts` | CSV 파싱 | PapaParse 기반, 한국어 헤더 자동 감지, 배달앱 채널 자동 분류 |
| `supabase/client.ts` | 브라우저 클라이언트 | `createBrowserClient` 사용, CSR 환경 |
| `supabase/server.ts` | 서버 클라이언트 | `createServerClient` 사용, RSC/Server Actions 환경 |
| `supabase/middleware.ts` | 세션 미들웨어 | 쿠키 기반 세션 갱신 |
| `utils.ts` | 유틸리티 | `cn()` 함수 - clsx + tailwind-merge |

### API 레이어 (`src/app/api/`)

| 파일 | 역할 |
|------|------|
| `api/ai/route.ts` | POST /api/ai. KpiResult를 받아 Claude Sonnet 4.5로 스트리밍 분석 반환 |

### 타입 정의 (`src/types/`)

| 파일 | 역할 |
|------|------|
| `database.ts` | Supabase CLI로 자동 생성된 TypeScript DB 타입. 모든 테이블/뷰/함수 타입 포함 |

## 모듈 조직 원칙

### `lib/` 디렉토리 - 순수 비즈니스 로직

각 서브디렉토리는 단일 도메인 책임을 가집니다. `kpi/`, `simulation/`, `csv/`는 UI나 DB에 의존하지 않는 순수 함수로 구성되어 독립적으로 테스트 가능합니다. `supabase/`는 환경(브라우저/서버)에 따라 다른 클라이언트를 export합니다.

### `components/ui/` - shadcn/ui 컴포넌트

shadcn/ui CLI로 생성된 컴포넌트들입니다. `components.json` 설정에서 `new-york` 스타일, `oklch` 색상, `@/components/ui` 경로를 정의합니다. 컴포넌트를 직접 수정하여 프로젝트에 맞게 커스터마이징합니다.

### `app/` - Next.js App Router 페이지

파일 시스템 기반 라우팅을 사용합니다. `layout.tsx`는 루트 레이아웃(Geist Sans/Mono 폰트 적용), `page.tsx`는 각 라우트의 메인 UI, `route.ts`는 API 엔드포인트입니다.

## 데이터베이스 스키마 개요

Supabase PostgreSQL을 사용하며 모든 테이블에 RLS(Row Level Security)가 적용됩니다.

### 테이블 구조

```
auth.users (Supabase 내장)
    └── businesses           # 사업체 프로필 (사용자당 1개 이상)
            ├── revenues     # 매출 기록
            ├── expenses     # 비용 기록 (fixed/variable 타입)
            ├── fixed_costs  # 월 고정비 (is_labor 플래그로 인건비 구분)
            ├── monthly_summaries  # KPI 계산 캐시
            └── csv_uploads  # CSV 업로드 이력
```

### RLS 정책 원칙

모든 테이블의 SELECT/INSERT/UPDATE/DELETE 정책은 `auth.uid() = user_id` 조건으로 제한됩니다. 사용자는 자신의 사업체 데이터에만 접근 가능하며, 다른 사용자의 데이터는 읽기/쓰기가 불가능합니다.

## 아키텍처 패턴

### App Router + RSC (React Server Components)

`src/app/` 구조는 Next.js 15 App Router를 따릅니다. 서버 컴포넌트(기본)에서 Supabase 서버 클라이언트를 직접 사용하고, 클라이언트 컴포넌트에서는 `"use client"` 지시어를 명시합니다. 스트리밍 렌더링으로 TTFB(Time to First Byte)를 최소화합니다.

### Supabase RLS 기반 데이터 보안

미들웨어(`src/middleware.ts`)가 모든 요청에서 Supabase 세션을 갱신합니다. 서버 컴포넌트는 `src/lib/supabase/server.ts`의 클라이언트를 사용하여 쿠키 기반 인증을 처리합니다. 클라이언트 컴포넌트는 `src/lib/supabase/client.ts`를 사용합니다.

### Vercel Serverless 배포

API Route(`src/app/api/ai/route.ts`)는 Edge Runtime이 아닌 Node.js Runtime에서 실행됩니다(Anthropic SDK 호환성). 스트리밍 응답은 `StreamingTextResponse`(Vercel AI SDK)로 반환합니다.
