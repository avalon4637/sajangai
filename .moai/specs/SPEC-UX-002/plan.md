# SPEC-UX-002 Implementation Plan

<!-- TAG: SPEC-UX-002 -->

## Overview

서비스 전반의 UX 폴리시 4건(시간대 통일, 사이드바 그룹핑, 생존 점수 맥락, 고정비/지출 관계)을 일괄 개선한다.

---

## Phases

### Phase 1: AI 응답 시간대 통일 (Primary Goal)

- 시간 포맷팅 유틸 함수 생성 (`src/lib/utils/format-time.ts`)
  - 24시간 이내: `formatDistanceToNow` (ko locale)
  - 24시간 초과: "YYYY.MM.DD HH:mm (KST)" 형식
- AI 채팅 메시지 컴포넌트에 적용
- 기존 시간 표시 부분 일괄 교체

### Phase 2: 사이드바 메뉴 그룹핑 (Primary Goal)

- 메뉴 항목을 논리적 그룹으로 분류
- shadcn/ui Collapsible 적용하여 아코디언 메뉴 구현
- 현재 활성 메뉴가 속한 그룹은 자동 펼침
- localStorage에 열림/닫힘 상태 저장

### Phase 3: 생존 점수 맥락 + CTA (Secondary Goal)

- 생존 점수 컴포넌트에 점수 구간별 맥락 설명 추가
- "이 점수를 올리려면?" CTA 버튼 추가
- CTA 클릭 시 간단한 개선 팁 리스트 표시 (Popover 또는 Sheet)

### Phase 4: 고정비/지출 관계 안내 (Secondary Goal)

- 고정비 페이지 상단에 Alert 컴포넌트 삽입
- "고정비는 매월 자동으로 지출에 반영됩니다" 안내

## Affected Files

### 신규 생성

- `src/lib/utils/format-time.ts` - 시간 포맷팅 유틸

### 수정

- `src/components/agents/chat/` - 메시지 시간 표시 수정
- `src/components/layout/sidebar*.tsx` - 사이드바 그룹핑
- `src/components/seri/` - 생존 점수 맥락 + CTA
- `src/app/(dashboard)/fixed-costs/page.tsx` - 고정비 안내 문구

## Risk Assessment

- **Low Risk**: 모두 UI 레이어 수정으로 비즈니스 로직 변경 없음
- **Medium Risk**: 사이드바 그룹핑은 기존 네비게이션 UX에 영향, 충분한 테스트 필요
