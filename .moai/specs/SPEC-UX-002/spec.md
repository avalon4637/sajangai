---
id: SPEC-UX-002
version: "1.0.0"
status: planned
created: "2026-04-05"
updated: "2026-04-05"
author: avalon4637
priority: P2
---

# SPEC-UX-002: UX 폴리시 일괄 개선

## HISTORY

| 버전  | 날짜       | 작성자     | 변경 내용 |
| ----- | ---------- | ---------- | --------- |
| 1.0.0 | 2026-04-05 | avalon4637 | 초기 작성 |

---

## Overview

- **Title**: UX 폴리시 일괄 개선
- **Status**: Planned
- **Priority**: P2 (polish)
- **Estimated Effort**: M

## Problem Statement

서비스 전반에 걸쳐 4가지 UX 이슈가 사용자 경험을 저해하고 있다:

1. **AI 응답 시간대 혼동 (2-3)**: AI 에이전트 응답에 표시되는 시간이 UTC인지 KST인지 불명확하여 사용자 혼란 유발
2. **사이드바 메뉴 구조 (2-4)**: 메뉴 항목이 평면적으로 나열되어 메뉴가 많아질수록 탐색이 어려움
3. **생존 점수 맥락 부족 (2-5)**: 생존 점수(세리)가 숫자만 표시되고, 이 점수가 의미하는 바와 개선 방법이 없음
4. **고정비/지출 관계 불명확 (2-6)**: 고정비와 일반 지출의 관계가 UI에서 명확하지 않아 이중 입력 우려

## Requirements

### Must Have

1. **WHEN** AI 에이전트가 시간을 포함한 응답을 생성할 **THEN** 모든 시간은 KST(한국 표준시)로 표시되어야 한다
2. **WHEN** 시간이 24시간 이내일 **THEN** "3시간 전", "어제" 등 상대 시간으로 표시되어야 한다
3. **WHEN** 사이드바 메뉴 항목이 5개 이상일 **THEN** 관련 메뉴를 그룹핑하여 아코디언 형태로 표시해야 한다
4. **WHEN** 생존 점수가 표시될 **THEN** 점수 하단에 1-2줄의 맥락 설명이 함께 표시되어야 한다
5. **WHEN** 생존 점수가 표시될 **THEN** "이 점수를 올리려면?" CTA 버튼이 함께 표시되어야 한다
6. **WHEN** 고정비 페이지에 진입할 **THEN** "고정비는 매월 자동으로 지출에 반영됩니다" 안내 문구가 표시되어야 한다

### Nice to Have

7. 사이드바 아코디언의 열림/닫힘 상태를 localStorage에 저장
8. 생존 점수 CTA 클릭 시 개선 제안 리스트(간단한 팁 3개) 표시
9. 고정비 → 지출 연동 관계를 시각적으로 표현 (화살표 또는 링크)

## Technical Notes

### 2-3: 시간대 통일

- AI 응답 메시지 렌더링 시 `date-fns`의 `formatDistanceToNow` (locale: ko) 적용
- 24시간 초과: "2026.04.05 14:30 (KST)" 형식
- 24시간 이내: "3시간 전", "방금 전" 형식
- 영향 파일: `src/components/agents/chat/`, 메시지 렌더링 컴포넌트

### 2-4: 사이드바 그룹핑

- 현재 사이드바: `src/components/sidebar/` 또는 `src/components/layout/`
- 메뉴 그룹 예시:
  - **매장 관리**: 매출, 지출, 고정비, 거래처
  - **AI 팀**: 점장, 채팅, 활동로그, 설정
  - **분석**: 대시보드, 매출분석, 시뮬레이션
- shadcn/ui `Collapsible` 또는 `Accordion` 컴포넌트 활용

### 2-5: 생존 점수 CTA

- 영향 파일: `src/components/seri/` 또는 생존 점수 게이지 컴포넌트
- 맥락 설명 예시:
  - 점수 80+ : "안정적인 상태입니다"
  - 점수 50-79: "주의가 필요합니다"
  - 점수 0-49: "위험 구간입니다. 지출을 점검해 주세요"

### 2-6: 고정비/지출 관계

- 고정비 페이지 상단에 `Alert` 컴포넌트로 안내 문구 삽입
- 영향 파일: `src/app/(dashboard)/fixed-costs/page.tsx`

## Dependencies

- shadcn/ui Collapsible/Accordion 컴포넌트 (이미 사용 가능)
- date-fns 라이브러리 (이미 설치됨으로 추정)

## Exclusions (What NOT to Build)

- Shall NOT implement 사이드바 전체 리디자인 (reason: 그룹핑만 추가, 기존 디자인 유지)
- Shall NOT implement 생존 점수 계산 로직 변경 (reason: UI 개선만, 로직은 SPEC-SERI-001 범위)
- Shall NOT implement AI 응답 시간대를 사용자 설정 가능하게 변경 (reason: KST 고정으로 충분)
