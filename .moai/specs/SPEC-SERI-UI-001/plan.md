# SPEC-SERI-UI-001 Implementation Plan

<!-- TAG: SPEC-SERI-UI-001 -->

## Overview

매출 분석 페이지의 두 가지 레이아웃 버그(헤더 텍스트 세로 쌓임, 하단 빈 공간)를 수정한다.

---

## Phases

### Phase 1: 헤더 텍스트 세로 쌓임 수정 (Primary Goal)

- 매출 분석 페이지의 헤더 영역 컴포넌트 식별
- flex/grid 컨테이너의 width 관련 속성 확인
- `whitespace-nowrap` 또는 `min-width` 적용으로 텍스트 쌓임 방지
- 320px ~ 2560px 범위에서 반응형 동작 확인

### Phase 2: 하단 빈 공간 제거 (Primary Goal)

- 페이지 하단 컴포넌트 트리에서 불필요한 height 발생 요소 탐색
- 숨겨진 컴포넌트의 `min-height`, `height`, 빈 `div` 제거 또는 수정
- 콘텐츠 영역이 실제 데이터 크기에 맞게 축소되는지 확인

### Phase 3: 크로스 뷰포트 검증 (Secondary Goal)

- 모바일(320px), 태블릿(768px), 데스크톱(1024px, 1400px, 1920px, 2560px)에서 확인
- 기존 레이아웃 깨짐 없는지 리그레션 체크

## Affected Files

- `src/app/(dashboard)/analysis/page.tsx`
- `src/components/analysis/` 내 관련 컴포넌트

## Risk Assessment

- **Low Risk**: CSS 수정만으로 해결 가능한 범위
- 다른 페이지에 영향 없도록 스코프 한정된 selector 사용
