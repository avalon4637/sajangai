# SPEC-ENGAGE-001: 체험→전환 — Personalization + Notification + Trial

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-ENGAGE-001 |
| Title | 체험→전환: 개인화 + 카톡 알림 + 7일 체험 퍼널 |
| Phase | Phase 2 |
| Priority | P0 |
| WBS Ref | F4.1~F4.2, F5.1, F6.1~F6.2 |
| Dependencies | SPEC-KICK-001 |
| Status | Draft |

## Milestones

### M1: AAAS Personalization v1
- Onboarding 3 questions (소통스타일/관심/알림시간)
- user_profiles table + migration
- Profile-based report/insight tone branching
- Memory v1: extract on chat end, inject on chat start

### M2: KakaoTalk Notification Pipeline
- Critical insight → 즉시 카톡 (active_hours 내)
- Daily insight digest (아침 리포트에 top 3 인사이트 포함)
- Action deep link (카톡 버튼 → 웹앱 해당 페이지)

### M3: 7-Day Trial Funnel
- Trial state management (subscriptions 활용)
- D+1~D+7 카톡 시퀀스 (날짜별 체험 메시지)
- Collection rate differentiation (무료=주1, 유료=일5)
- Trial expiration + 전환 CTA UI
