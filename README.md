# sajang.ai

> 사장님의 생존을 분석하는 AI 경영 비서

소상공인을 위한 자동연동 + AI 경영 분석 SaaS.
엑셀/구글시트 기반 가계부 사용자를 위해 **의사결정과 생존 확률 분석**에 초점을 맞춘 서비스입니다.

## 핵심 기능

- **생존 점수 (Survival Score)** — 매출, 비용, 고정비 기반 0~100점 생존 확률
- **현금 고갈 예측** — 3개월 내 현금 부족 위험 감지
- **인건비/고정비 경고** — 업종 대비 과다 지출 자동 감지
- **의사결정 시뮬레이션** — "직원 1명 줄이면?", "매출 10% 감소하면?" 버튼 클릭으로 확인
- **CSV 자동 분류** — 카드/배달앱 매출 CSV 업로드 시 자동 정규화

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 15 (App Router) |
| UI | TailwindCSS + shadcn/ui + TanStack Table |
| Database | Supabase (PostgreSQL + Auth + RLS + Storage) |
| AI | Vercel AI SDK + Claude API |
| Chart | Recharts |
| State | Zustand |
| Form | React Hook Form + Zod |
| Deploy | Vercel |
| Package | pnpm |

## 시작하기

### 사전 요구사항

- Node.js 20+
- pnpm 9+
- Supabase 프로젝트 (https://supabase.com)

### 설치

```bash
pnpm install
```

### 환경 변수 설정

```bash
cp .env.local.example .env.local
# .env.local 파일에 Supabase 및 Anthropic API 키 입력
```

### 개발 서버 실행

```bash
pnpm dev
```

http://localhost:3000 에서 확인

### 빌드

```bash
pnpm build
```

### 린트

```bash
pnpm lint
```

### 테스트

```bash
pnpm test
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # 인증 (로그인/회원가입)
│   ├── (dashboard)/        # 대시보드, 매출, 지출, 리포트, 시뮬레이션
│   └── api/ai/             # AI 분석 API Route
├── components/
│   ├── ui/                 # shadcn/ui 기본 컴포넌트
│   ├── dashboard/          # 대시보드 위젯
│   ├── input/              # 데이터 입력 폼
│   └── simulation/         # 시뮬레이션 UI
├── lib/
│   ├── supabase/           # Supabase 클라이언트 (client/server/middleware)
│   ├── kpi/                # KPI 계산 엔진
│   ├── simulation/         # 시뮬레이션 엔진
│   ├── csv/                # CSV 파싱 엔진
│   └── ai/                 # AI 분석 모듈
├── types/                  # TypeScript 타입 정의
└── hooks/                  # Custom React Hooks
supabase/
└── migrations/             # DB 마이그레이션 SQL
```

## 문서

- [아키텍처](doc/architecture.md)
- [데이터 스키마](doc/data-schema.md)
- [로드맵](doc/roadmap.md)
- [기획서](doc/readme.md)

## 라이선스

Private - All rights reserved
