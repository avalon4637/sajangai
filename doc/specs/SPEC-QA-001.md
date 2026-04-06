# SPEC-QA-001: Full Flow QA & Integration Verification

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-QA-001 |
| Title | 전체 플로우 QA + 통합 검증 |
| Priority | P0 (런칭 필수) |
| Status | Defined |
| Estimated | 1일 |
| Dependencies | SPEC-PAYMENT-001 |

## Background

개별 기능은 구현되어 있으나 가입부터 결제까지 전체 플로우 통합 테스트 미실시.
VIP 10곳에 제공하기 전 엔드투엔드 검증 필수.

## Acceptance Criteria

### AC-1: 가입 → 온보딩 플로우
- 이메일 가입 → 이메일 인증 → 사업자 등록 → 선호 설정
- 모든 단계에서 에러 없이 완료
- 가입 후 대시보드 진입 확인

### AC-2: 대시보드 + 데이터 입력
- CSV 업로드로 매출/지출 데이터 입력
- 대시보드 KPI 카드 정상 표시
- 캘린더 뷰 정상 렌더링

### AC-3: AI 에이전트 플로우
- 점장 채팅: 질문 → AI 응답 (streaming)
- 세리: 분석 리포트 생성
- 답장이: 리뷰 목록 + AI 답글 생성
- 바이럴: 마케팅 페이지 표시

### AC-4: 결제 → 구독 플로우
- 무료 상태에서 유료 전환
- 결제 완료 후 구독 상태 변경 확인
- 유료 기능 접근 가능 확인

### AC-5: 관리자 플로우
- /admin 접근 (admin 계정만)
- 사용자 목록 조회
- 구독 상태 변경
- 사업장 비활성화/재활성화

### AC-6: 랜딩 → 가입 전환
- 랜딩 페이지 모든 섹션 표시
- CTA 버튼 → 가입 페이지 이동
- 로그인 상태에서 랜딩 → 대시보드 리디렉션

## Technical Notes

- chrome-devtools MCP 또는 수동 브라우저 테스트
- 체크리스트 기반 검증 (자동화 테스트는 SPEC-QUALITY-002)
- dev 환경 (localhost:2000) + Supabase production DB
