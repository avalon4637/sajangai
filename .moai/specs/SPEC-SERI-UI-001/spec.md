---
id: SPEC-SERI-UI-001
version: "1.0.0"
status: done
created: "2026-04-05"
updated: "2026-04-05"
author: avalon4637
priority: P1
---

# SPEC-SERI-UI-001: 세리 매출 분석 페이지 UI 버그 수정

## HISTORY

| 버전  | 날짜       | 작성자     | 변경 내용 |
| ----- | ---------- | ---------- | --------- |
| 1.0.0 | 2026-04-05 | avalon4637 | 초기 작성 |

---

## Overview

- **Title**: 세리 매출 분석 페이지 UI 버그 수정
- **Status**: Planned
- **Priority**: P1 (visible bug)
- **Estimated Effort**: S

## Problem Statement

매출 분석 페이지(세리)에 두 가지 레이아웃 버그가 존재한다:

1. **헤더 텍스트 세로 쌓임 (1-2)**: 데스크톱 뷰포트 1400px 이상에서 "매출분석" 텍스트가 글자 단위로 세로 쌓인다. flex/grid 컨테이너의 width 제약이 원인으로 추정된다.
2. **하단 빈 공간 (1-3)**: 페이지 하단에 수백px 정도의 의미 없는 빈 공간이 발생한다. 숨겨진 컴포넌트의 height 또는 min-height가 원인으로 추정된다.

두 버그 모두 사용자 신뢰도에 직접적으로 영향을 미치는 가시적인 문제다.

## Requirements

### Must Have

1. **WHEN** 데스크톱 뷰포트 너비가 1400px 이상일 **THEN** 매출 분석 페이지의 헤더 "매출분석" 텍스트가 한 줄로 정상 표시되어야 한다
2. **WHEN** 매출 분석 페이지를 스크롤하여 최하단에 도달할 **THEN** 마지막 콘텐츠 요소 아래에 불필요한 빈 공간(100px 초과)이 존재하지 않아야 한다
3. 시스템은 **항상** 320px ~ 2560px 범위의 모든 뷰포트에서 매출 분석 페이지가 정상 렌더링되어야 한다

### Nice to Have

4. 헤더 텍스트에 `text-nowrap` 또는 `whitespace-nowrap` 유틸리티 적용으로 재발 방지

## Technical Notes

### 영향 파일 (추정)

- `src/app/(dashboard)/analysis/page.tsx` - 매출 분석 메인 페이지
- `src/components/analysis/` - 분석 관련 컴포넌트
- 헤더 영역: flex 컨테이너의 `min-width` 또는 `flex-shrink` 속성 확인
- 하단 빈 공간: 숨겨진 컴포넌트의 `min-height`, `height`, 또는 빈 `div`의 존재 확인

### 디버깅 접근법

- Chrome DevTools로 1400px+ 뷰포트에서 헤더 요소의 computed style 확인
- 하단 빈 공간은 각 섹션의 height를 순차적으로 검사하여 원인 요소 특정

## Dependencies

- 없음 (독립적 버그 수정)

## Exclusions (What NOT to Build)

- Shall NOT redesign 매출 분석 페이지의 전체 레이아웃 (reason: 버그 수정 범위 한정)
- Shall NOT modify 다른 페이지의 헤더 스타일 (reason: 영향 범위 최소화)
