# SPEC-LAUNCH-001: Production Launch Readiness

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-LAUNCH-001 |
| Title | 프로덕션 런칭 준비 — 보안 헤더 + 잔여 SEC 검증 |
| Priority | P0 (배포 차단) |
| Status | Active |
| Estimated | 반나절 |

## Background

P0 보안 항목 대부분 완료됨 (rate limiting, error boundary, CSRF, .env.example, sidebar 동적화).
잔여 미완료 항목: Security Headers, SEC 항목 실제 적용 여부 검증.

## Acceptance Criteria

### AC-1: Security Headers
- next.config.ts에 보안 헤더 추가
  - Content-Security-Policy (script-src, style-src, img-src 등)
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Strict-Transport-Security (HSTS)
  - Permissions-Policy

### AC-2: SEC 항목 검증
- SEC-01: insight_events/action_results INSERT 정책 — WITH CHECK(true) 제거 확인
- SEC-03: /api/reviews/[id]/reply, /api/reviews/[id]/publish — business 소유권 검증 확인
- SEC-04: ai_feedback 테이블 RLS 활성화 확인
- SEC-05: industry_types, regions, expense_benchmarks RLS 확인
- SEC-06: subscriptions.billing_key 암호화 여부 확인
- SEC-08: SECURITY DEFINER 함수 소유권 파라미터 확인

### AC-3: 잔여 배포 준비
- CRON_SECRET 환경변수 + cron 라우트 인증 로직 확인
- catch {} silent fail 주요 API 라우트 최소 로깅 추가 (최소 10건)

## Out of Scope
- 새 기능 개발 (관리자 페이지 등)
- 테스트 코드 작성 (SPEC-QUALITY-002)
- 모바일 최적화 (SPEC-MOBILE-001)
