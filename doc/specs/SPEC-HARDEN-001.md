# SPEC-HARDEN-001: Security Hardening + Quality Gates + UI Completion

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-HARDEN-001 |
| Title | 보안 강화 + 빠진 UI + 실행 기능 완성 |
| Priority | P0~P1 |
| Source | doc/TODO.md |
| Status | Active |

## Milestones

### M1: Security Fixes (P0-SEC) — 배포 차단 이슈
- RLS INSERT 정책 수정 (insight_events, action_results)
- IDOR 수정 (/api/insights/act, /api/insights/dismiss — business 소유권 검증)
- ai_feedback RLS 활성화
- API rate limiting (AI 라우트)
- Error boundary 추가
- .env.local.example 업데이트
- /api/insights/act businessId 빈값 수정

### M2: UI Pages (P1-UI) — 빠진 페이지 구현
- 대출 관리 페이지 (/settings/loans)
- 예산 관리 페이지 (/settings/budget)
- 사이드바 동적 사용자명 + 구독 상태
- 사이드바 네비게이션 보완 (매출/지출/고정비 접근 경로)

### M3: Action + Performance (P1-ACTION, P1-PERF)
- 마케팅 페이지 문자 발송 버튼
- Daily briefing cron 활성 구독자 필터링
- 인사이트 엔진 카테고리별 조기 종료
