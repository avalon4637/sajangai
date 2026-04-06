# SPEC-MULTI-BIZ-001: Multi-Business Support

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-MULTI-BIZ-001 |
| Title | 1인 다사업장 지원 (사업장 전환) |
| Priority | P2 (VIP 런칭 후) |
| Status | Defined |
| Estimated | 3-5일 |
| Dependencies | None |

## Background

현장 피드백 (2026-04-06): 소상공인 중 1인 2~3개 업체 운영 사장님이 예상보다 많음.
현재 시스템은 1 user = 1 business 구조. 멀티 사업장 지원 필요.

## Acceptance Criteria

### AC-1: 사업장 추가 등록
- 설정 페이지에서 "사업장 추가" 기능
- 사업자등록번호 + 상호명 입력
- user_id 기준으로 여러 businesses 연결 가능

### AC-2: 사업장 전환 UI
- 사이드바 상단에 사업장 선택 드롭다운
- 전환 시 대시보드/데이터 해당 사업장으로 변경
- 현재 선택된 사업장 표시

### AC-3: 데이터 격리
- 모든 데이터(매출, 지출, 리뷰 등) business_id 기준 격리 (이미 구현)
- getCurrentBusinessId() 함수가 선택된 사업장 반환하도록 수정
- 세션/쿠키에 현재 선택 사업장 저장

### AC-4: 구독 모델
- 결정 필요: 계정당 과금 vs 사업장당 과금
- 초기안: 계정당 9,900원 (사업장 2개까지 포함), 추가 사업장당 +4,900원

## Out of Scope
- 사업장별 다른 에이전트 설정 (추후)
- 직원 초대/권한 관리 (추후)

## Technical Notes

- businesses 테이블 이미 user_id FK 있음 (unique constraint 제거 필요)
- getCurrentBusinessId()가 핵심 변경점
- RLS는 이미 user_id 기반이라 큰 변경 없음
