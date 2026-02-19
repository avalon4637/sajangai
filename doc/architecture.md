# Architecture

sajang.ai의 시스템 아키텍처 문서

---

## 시스템 개요

```
┌──────────────────────────────────────────────────┐
│                   클라이언트                        │
│         Next.js App Router (React SSR/CSR)        │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ Dashboard │ │  Input   │ │   Simulation     │  │
│  │  Charts   │ │  Forms   │ │   Before/After   │  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
└───────────┬──────────┬──────────┬────────────────┘
            │          │          │
            ▼          ▼          ▼
┌───────────────────────────────────────────┐
│         Vercel Serverless Functions        │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │ API Route│ │ AI Route │ │ Middleware│  │
│  │  (CRUD)  │ │ (Claude) │ │  (Auth)   │  │
│  └──────────┘ └──────────┘ └───────────┘  │
└───────────┬──────────┬───────────────────┘
            │          │
            ▼          ▼
┌───────────────────┐  ┌──────────────┐
│     Supabase      │  │ Anthropic    │
│  ┌─────────────┐  │  │ Claude API   │
│  │ PostgreSQL  │  │  └──────────────┘
│  │   + RLS     │  │
│  ├─────────────┤  │
│  │    Auth     │  │
│  ├─────────────┤  │
│  │   Storage   │  │
│  └─────────────┘  │
└───────────────────┘
```

---

## 레이어 구조

### 1. Presentation Layer

**기술**: Next.js 15 App Router + TailwindCSS + shadcn/ui

- **App Router**: 파일 기반 라우팅, 서버/클라이언트 컴포넌트 분리
- **Route Groups**: `(auth)` — 인증 페이지, `(dashboard)` — 보호된 페이지
- **UI**: shadcn/ui 컴포넌트 기반, 엑셀 느낌 유지를 위해 TanStack Table 사용
- **차트**: Recharts로 월별 추이, 비용 구조 시각화

### 2. Business Logic Layer

클라이언트 사이드에서 실행되는 순수 TypeScript 모듈.

| 모듈 | 위치 | 역할 |
|------|------|------|
| KPI Calculator | `src/lib/kpi/` | 매출총이익률, 인건비 비율, 고정비 비율, 생존 점수 계산 |
| Simulation Engine | `src/lib/simulation/` | 의사결정 시뮬레이션 (직원/매출/임대료 변동) |
| CSV Parser | `src/lib/csv/` | CSV 파싱, 자동 분류, 정규화 |

**설계 원칙**: 외부 의존성 없는 순수 함수로 구현하여 테스트 용이성 확보.

### 3. AI Layer

**기술**: Vercel AI SDK + Anthropic Claude API

- Vercel API Routes (`src/app/api/ai/`)에서 Claude 호출
- KPI 데이터를 입력으로 받아 자연어 경영 인사이트 생성
- 스트리밍 응답으로 UX 향상

### 4. Data Layer

**기술**: Supabase (PostgreSQL)

- **PostgREST**: 클라이언트에서 직접 CRUD (Supabase JS SDK)
- **Auth**: 이메일/비밀번호 + OAuth (Google) 인증
- **RLS (Row Level Security)**: 모든 테이블에 적용, 본인 데이터만 접근 가능
- **Storage**: CSV 파일 업로드 저장

### 5. Infrastructure

- **Vercel**: 프론트엔드 + Serverless Functions 호스팅, Edge Middleware
- **Supabase**: 매니지드 PostgreSQL, Auth, Storage
- **Vercel MCP**: 배포 자동화, 환경변수 관리

---

## 인증 흐름

```
사용자 → /login → Supabase Auth → JWT 발급
                                     ↓
               Next.js Middleware (src/middleware.ts)
               - 쿠키에서 세션 확인
               - 미인증 → /login 리다이렉트
               - 인증됨 → 요청 통과
                                     ↓
                RLS가 user_id 기반으로 데이터 격리
```

---

## 데이터 흐름

### 수동 입력
```
사용자 입력 → React Hook Form (유효성 검사)
           → Supabase SDK (INSERT)
           → KPI Calculator (재계산)
           → Dashboard 갱신
```

### CSV 업로드
```
파일 선택 → Papa Parse (클라이언트 파싱)
         → CSV Parser (자동 분류/정규화)
         → 미리보기 UI (사용자 확인)
         → Supabase Batch INSERT
         → KPI 재계산
```

### AI 분석
```
"AI 분석" 버튼 → KPI 데이터 수집
              → POST /api/ai
              → Claude API (스트리밍)
              → 인사이트 UI 렌더링
```

---

## 상태 관리

| 범위 | 기술 | 용도 |
|------|------|------|
| 서버 상태 | Supabase SDK (React Query 패턴) | DB 데이터 조회/변경 |
| 클라이언트 전역 상태 | Zustand | 현재 선택된 사업장, UI 상태 |
| 폼 상태 | React Hook Form + Zod | 입력 폼 유효성 검사 |

---

## 배포 파이프라인

```
코드 Push → Vercel 자동 빌드
         → Preview 배포 (PR 브랜치)
         → Production 배포 (main 브랜치)
```

Vercel MCP를 통해 Claude Code에서 직접 배포 상태 확인 및 환경변수 관리 가능.
