# SPEC-ADMIN-001: Admin Dashboard (MVP)

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-ADMIN-001 |
| Title | 관리자 대시보드 — 운영자용 최소 관리 페이지 |
| Priority | P1 (런칭 필수) |
| Status | Active |
| Estimated | 반나절~1일 |

## Background

운영 인원이 Supabase 직접 접근 불가. 사용자/구독/사업장 관리를 위한 웹 UI 필수.
시스템 모니터링(에러 로그, API 사용량, sync 현황)은 Vercel/Supabase/Anthropic 대시보드로 대체.

## Milestones

### M1: Admin 인프라

- user_profiles 테이블에 role 컬럼 추가 ('user' | 'admin', default 'user')
- avalon55@nate.com → role='admin' 설정 (마이그레이션)
- RLS 정책: role='admin'이면 businesses, subscriptions, payments, user_profiles SELECT/UPDATE 허용
- /admin 라우트 그룹 + layout (role 체크 → 비관리자 404)

### M2: 대시보드 + 사용자/구독 목록 (페이지 1개)

- KPI 카드 3개: 총 가입자 / 유료 전환 수 / MRR(월매출)
- 통합 테이블: 사업장명, 사용자 이메일, 가입일, 구독상태(뱃지), 업종
- 상태 필터: 전체 / trial / active / expired / cancelled
- 검색: 사업장명 또는 이메일로 검색

### M3: 구독 상태 변경

- 테이블 행 클릭 → 상세 패널 (Sheet 또는 Dialog)
- 구독 상태 변경: trial → active, active → cancelled 등 (드롭다운 선택)
- 변경 시 확인 다이얼로그 + 변경 사유 입력 (선택)
- 변경 결과 즉시 반영 (revalidate)

### M4: 사업장 비활성화/삭제

- 상세 패널에서 사업장 비활성화 버튼 (soft delete: is_active=false)
- 비활성화 시 해당 사업장 데이터 접근 차단 (RLS 반영)
- 삭제는 비활성화 후 30일 경과 시에만 가능 (안전장치)
- 비활성화된 사업장은 목록에서 회색 표시 + 복구 버튼

## Out of Scope (이번 스테이지)

- 역할 변경 (admin/user) — 최초 admin만 마이그레이션으로 설정
- 결제 환불 처리 — PortOne 대시보드
- 에러 로그 / API 사용량 / sync 현황 — Vercel/Supabase/Anthropic 대시보드
- 사용자 직접 생성 — Supabase Auth
- 사업장 상세 데이터 (수집 현황, 에이전트 활동) — 다음 스테이지
