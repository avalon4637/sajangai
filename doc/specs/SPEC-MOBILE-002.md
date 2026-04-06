# SPEC-MOBILE-002: Mobile Responsive UI Fix

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-MOBILE-002 |
| Title | 모바일 반응형 UI 전면 수정 |
| Priority | P1 (VIP 런칭 전 필수) |
| Status | Defined |
| Estimated | 2-3일 |
| Dependencies | None |

## Background

모바일 감사(2026-04-06) 결과: CRITICAL 2건, HIGH 5건, MEDIUM 8건 발견.
기본 반응형 구조는 있으나 세부 최적화 부족. VIP 사장님들은 주로 모바일로 접근할 가능성 높음.

## Acceptance Criteria

### AC-1: CRITICAL 수정 (즉시)

#### 1-1: 관리자 KPI 카드 그리드
- 파일: `src/app/(admin)/admin/page-client.tsx`
- 현재: `grid grid-cols-3`
- 수정: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

#### 1-2: 로그인 모달 안전 너비
- 파일: `src/app/auth/login/page.tsx`
- 수정: 극소형 화면(320px) 대응 `max-w-[95vw] sm:max-w-[400px]`

### AC-2: HIGH 수정

#### 2-1: 채팅 메시지 너비
- 파일: `src/components/jeongjang/chat-message.tsx`
- 수정: `max-w-[90vw] sm:max-w-[620px]`

#### 2-2: 테이블 모바일 UX
- 매출/지출/거래 테이블에 가로 스크롤 힌트 추가
- 또는 모바일에서 카드 레이아웃으로 전환 (선택)

#### 2-3: 랜딩 페이지 풋터 패딩
- 파일: `src/components/landing/footer.tsx`
- 수정: `px-4 sm:px-6 lg:px-[120px]`

#### 2-4: AI 팀 섹션 그리드
- 파일: `src/components/landing/agent-team-section.tsx`
- 수정: `grid grid-cols-1 sm:grid-cols-2 gap-4`

#### 2-5: 관리자 필터 레이아웃
- 파일: `src/app/(admin)/admin/page-client.tsx`
- 수정: `flex flex-col sm:flex-row gap-2 sm:gap-4`

### AC-3: MEDIUM 수정

#### 3-1: 차트 모바일 반응형
- Recharts 컨테이너에 모바일 높이 제약 (250px)
- 축 레이블 겹침 방지

#### 3-2: 사이드바 시트 너비
- `max-w-[85vw]` 추가로 초소형 화면 대응

#### 3-3: 분석 탭 모바일
- 스크롤 가능한 탭 바 또는 텍스트 축약

#### 3-4: 바이럴 카드 그리드
- `sm:grid-cols-2 lg:grid-cols-3` 중간 단계 추가

#### 3-5: 터치 타겟 크기
- 모든 액션 버튼 최소 `h-10` (40px) 보장

### AC-4: 전체 모바일 QA
- Chrome DevTools 375px/414px/390px 뷰포트에서 전 페이지 확인
- 터치 스크롤, 터치 타겟, 텍스트 가독성 검증

## Technical Notes

- Tailwind 반응형 접두사: sm(640px), md(768px), lg(1024px)
- shadcn/ui 컴포넌트는 기본적으로 반응형 지원
- 대부분 CSS className 수정으로 해결 가능 (로직 변경 최소)
- 테이블→카드 전환은 선택사항 (공수 대비 효과 판단)
