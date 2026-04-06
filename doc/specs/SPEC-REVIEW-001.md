# SPEC-REVIEW-001: Review Reply UX Enhancement

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-REVIEW-001 |
| Title | 답장이 리뷰 답글 UX 개선 — 복사 + 딥링크 |
| Priority | P1 (VIP 핵심 기능) |
| Status | Defined |
| Estimated | 1일 |
| Dependencies | SPEC-NAVER-001 (네이버 리뷰 포함 시) |

## Background

현재 답장이는 AI 답글을 생성하지만 사용자가 각 플랫폼에 직접 가서 붙여넣어야 함.
현장 피드백: "플랫폼마다 들어가서 쓰는 거 너무 힘들다"
복사 버튼 + 해당 플랫폼 리뷰 페이지 딥링크로 한 단계만 추가하면 체감 편의성 대폭 향상.

## Acceptance Criteria

### AC-1: 답글 복사 버튼
- 각 리뷰의 AI 생성 답글에 [복사] 버튼 추가
- 클릭 시 클립보드에 복사 + "복사됨" 토스트

### AC-2: 플랫폼 딥링크 버튼
- [답글 쓰러가기] 버튼 → 해당 플랫폼 리뷰 관리 페이지로 이동
- 플랫폼별 URL 매핑:
  - 배민: ceo.baemin.com (리뷰 관리)
  - 쿠팡이츠: store.coupangeats.com (리뷰 관리)
  - 요기요: ceo.yogiyo.co.kr (리뷰 관리)
  - 네이버: smartplace.naver.com (리뷰 관리)
- 새 탭으로 열기 (target="_blank")

### AC-3: 답글 상태 관리
- 답글 작성 완료 표시 (사용자가 "완료" 체크)
- 미답변 리뷰 필터링
- 답변 완료율 통계

### AC-4: 모바일 UX
- 모바일에서 복사 + 딥링크 정상 동작
- 앱 간 전환 (sajang.ai → 배민사장님 앱 등) 자연스러운 플로우

## Technical Notes

- Clipboard API: navigator.clipboard.writeText()
- 딥링크는 웹 URL 기반 (앱 딥링크 스킴은 추후)
- 기존 코드: src/app/(dashboard)/review/ 페이지 수정
