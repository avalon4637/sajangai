# SPEC-PAYMENT-001: Payment Flow Verification & Subscription Complete

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-PAYMENT-001 |
| Title | PortOne V2 결제 플로우 검증 + 구독 완성 |
| Priority | P0 (런칭 필수) |
| Status | Defined |
| Estimated | 1일 |
| Dependencies | None |

## Background

PortOne V2 결제 코드는 구현되어 있으나 (billing-key, subscribe, cancel) 실제 테스트 환경에서 검증되지 않음.
VIP 10곳 런칭 전 결제 플로우가 정상 동작해야 함.

## Acceptance Criteria

### AC-1: PortOne 테스트 환경 설정
- PortOne V2 테스트 채널 ID / API Key 설정
- .env에 PORTONE_API_KEY, PORTONE_CHANNEL_KEY 구성
- 테스트 카드번호로 결제 가능 확인

### AC-2: 구독 가입 플로우
- /billing 페이지 → 카드 등록 → 빌링키 발급 성공
- 빌링키로 9,900원 첫 결제 요청 성공
- subscriptions 테이블에 status='active' 기록
- 구독 활성화 후 유료 기능 접근 가능

### AC-3: 구독 해지 플로우
- /billing 페이지에서 해지 버튼 동작
- 빌링키 비활성화 + subscriptions status='cancelled'
- 현재 결제 기간 끝까지 서비스 유지 (즉시 차단 X)

### AC-4: 결제 실패 처리
- 잔액 부족 등 결제 실패 시 사용자에게 알림
- 자동 재시도 로직 (3일간 1일 1회)
- 3회 실패 시 구독 일시정지

### AC-5: 관리자 구독 관리 연동
- /admin에서 구독 상태 변경 시 실제 반영
- 강제 활성화/비활성화 가능

## Technical Notes

- PortOne V2 REST API (not SDK embed)
- 기존 코드: src/lib/billing/portone-client.ts, subscription.ts
- API routes: /api/billing/subscribe, /api/billing/issue-billing-key, /api/billing/cancel
