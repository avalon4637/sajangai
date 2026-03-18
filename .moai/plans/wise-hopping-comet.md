# Vercel 배포 설정 계획

## Context

sajang.ai는 Next.js 16 App Router 기반 프로젝트로, 현재 배포 인프라가 전혀 설정되어 있지 않음. Vercel을 배포 플랫폼으로 선택. GitHub 연동으로 자동 CI/CD 구성하고, 커스텀 도메인(sajang.ai) 연결까지 설정.

## 구현 계획

### Step 1: Vercel 프로젝트 연결

1. Vercel CLI 설치 및 로그인
   - `pnpm add -g vercel`
   - `vercel login`

2. 프로젝트 연결
   - `vercel link` (기존 GitHub 레포 연결)
   - framework: Next.js 자동 감지

### Step 2: 환경 변수 설정

Vercel Dashboard > Settings > Environment Variables에 추가:

```
# 필수 (현재 사용 중)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=

# Phase 1: 카카오 인증
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NTS_API_KEY=

# Phase 2: 하이픈
HYPHEN_API_KEY=
HYPHEN_API_SECRET=
CREDENTIAL_ENCRYPTION_KEY=

# Phase 5: 알림톡
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_PFID=

# Phase 7: 결제
PORTONE_STORE_ID=
PORTONE_API_SECRET=
PORTONE_CHANNEL_KEY=
PORTONE_WEBHOOK_SECRET=
```

### Step 3: next.config.ts 배포 최적화

수정 파일: `next.config.ts`
- `images.remotePatterns` 설정 (필요시)
- `headers()` 추가: .well-known 경로 CORS 설정 (딥링크용)

### Step 4: vercel.json 생성 (선택)

생성 파일: `vercel.json`
- Cron Job 설정 (일일 브리핑 생성, 데이터 동기화)
- .well-known 경로 리라이트

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-briefing",
      "schedule": "0 23 * * *"
    },
    {
      "path": "/api/cron/sync",
      "schedule": "0 */5 * * *"
    }
  ]
}
```

### Step 5: Cron API 라우트 생성

생성 파일:
- `src/app/api/cron/daily-briefing/route.ts` - 매일 아침 8시(KST=23시UTC) 점장 브리핑 생성
- `src/app/api/cron/sync/route.ts` - 5시간마다 하이픈 데이터 동기화

Cron 라우트는 `CRON_SECRET` 헤더로 Vercel만 호출 가능하도록 보호.

### Step 6: 도메인 연결

- Vercel Dashboard > Domains > `sajang.ai` 추가
- DNS 레코드 설정: A 레코드 또는 CNAME을 Vercel에 연결
- HTTPS 자동 발급 (Let's Encrypt)

### Step 7: capacitor.config.ts 업데이트

수정 파일: `capacitor.config.ts`
- `server.url`이 실제 Vercel 배포 URL과 일치하는지 확인

## 수정/생성 파일 목록

| 파일 | 작업 |
|------|------|
| `vercel.json` | 생성 - Cron 설정 |
| `next.config.ts` | 수정 - headers 추가 |
| `src/app/api/cron/daily-briefing/route.ts` | 생성 |
| `src/app/api/cron/sync/route.ts` | 생성 |
| `.gitignore` | 확인 - .vercel/ 추가 |

## 검증

1. `vercel build` 로컬 빌드 테스트
2. `vercel deploy --prod` 프로덕션 배포
3. `https://sajang.ai` 접속 확인
4. Cron 라우트 수동 호출 테스트
5. 환경 변수 동작 확인 (카카오 로그인 등)
