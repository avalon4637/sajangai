---
id: SPEC-UX-001
version: "1.0.0"
status: ready
created: "2026-02-24"
priority: P1
depends_on: []
---

# SPEC-UX-001: UI/UX 개선 - 반응형, 모바일, Empty State

## 개요

sajang.ai 대시보드의 반응형 레이아웃을 점검하고, 모바일 환경을 최적화하며, 데이터가 없는 상태(empty state)의 UX를 개선한다. 소상공인 사용자 대부분이 모바일로 접근할 가능성이 높으므로 모바일 우선 최적화가 핵심이다.

## 범위

- 대시보드 전체 페이지 반응형 레이아웃 점검 및 수정
- 모바일 뷰포트(375px~428px) 최적화
- 사이드바 모바일 대응 (햄버거 메뉴 또는 바텀 네비게이션)
- 각 페이지 empty state UX 개선 (일러스트 + CTA 안내)
- 차트/테이블 모바일 스크롤 대응

## 범위 제외

- 다크 모드
- PWA (Progressive Web App)
- 네이티브 앱 대응

---

## Requirements (EARS)

### REQ-01: 반응형 레이아웃

**Ubiquitous:**
- 시스템은 모든 페이지가 다음 브레이크포인트에서 정상 표시되어야 한다:
  - Mobile: 375px ~ 428px
  - Tablet: 768px ~ 1024px
  - Desktop: 1280px+
- 시스템은 차트 컴포넌트가 뷰포트에 맞게 리사이즈되어야 한다.
- 시스템은 테이블이 모바일에서 가로 스크롤 가능해야 한다.

### REQ-02: 모바일 네비게이션

**State-Driven:**
- IF 뷰포트가 768px 미만이면 THEN 사이드바는 숨겨지고 모바일 네비게이션을 제공해야 한다.

**Ubiquitous:**
- 모바일 네비게이션은 주요 메뉴(대시보드, 매출, 비용, 고정비, 임포트, 시뮬레이션)에 빠르게 접근 가능해야 한다.

### REQ-03: Empty State UX

**State-Driven:**
- IF 페이지에 표시할 데이터가 없으면 THEN 시스템은 의미 있는 안내 메시지와 행동 유도(CTA)를 표시해야 한다.

**Ubiquitous:**
- 각 페이지별 empty state 메시지:
  - 대시보드: "아직 등록된 데이터가 없습니다" + 매출 등록 또는 CSV 임포트 CTA
  - 매출/비용/고정비: "데이터를 등록해 보세요" + 등록 폼 안내
  - 시뮬레이션: "데이터를 먼저 등록하면 시뮬레이션을 사용할 수 있습니다" + 데이터 등록 CTA
  - AI 분석 위젯: "분석할 데이터가 아직 부족합니다" 안내

### REQ-04: 데이터 입력 폼 모바일 최적화

**Ubiquitous:**
- 매출/비용/고정비 입력 폼은 모바일에서 터치 친화적이어야 한다.
- 숫자 입력 필드는 `inputMode="numeric"`을 사용해야 한다.
- 날짜 선택은 네이티브 date picker를 활용해야 한다.

### REQ-05: CSV 임포트 모바일 대응

**State-Driven:**
- IF 모바일 환경이면 THEN 드래그앤드롭 대신 파일 선택 버튼을 강조 표시해야 한다.

**Ubiquitous:**
- 미리보기 테이블은 가로 스크롤 가능해야 한다.
- 인라인 편집은 모바일에서도 동작해야 한다.

---

## 기술 설계

### 점검 대상 페이지

| 페이지 | 파일 | 주요 점검 항목 |
|--------|------|--------------|
| 대시보드 | `src/app/(dashboard)/dashboard/page.tsx` | KPI 카드 그리드, 차트 리사이즈, AI 위젯 |
| 매출 | `src/app/(dashboard)/revenue/page.tsx` | 폼 레이아웃, 테이블 스크롤 |
| 비용 | `src/app/(dashboard)/expense/page.tsx` | 폼 레이아웃, 테이블 스크롤 |
| 고정비 | `src/app/(dashboard)/fixed-costs/page.tsx` | 폼 레이아웃, 테이블 스크롤 |
| 임포트 | `src/app/(dashboard)/import/page.tsx` | 업로드 존, 미리보기 테이블 |
| 시뮬레이션 | `src/app/(dashboard)/simulation/page.tsx` | 시나리오 카드 그리드, 결과 비교 |

### 사이드바 모바일 대응

- 현재: `src/app/(dashboard)/sidebar.tsx`
- 방안: Sheet(shadcn/ui) 기반 모바일 드로어 또는 하단 탭 바
- 트리거: 햄버거 버튼 (모바일 헤더)

### Empty State 컴포넌트

- 공통 컴포넌트: `src/components/ui/empty-state.tsx`
- Props: icon, title, description, actionLabel, actionHref

---

## 수용 기준

- [ ] 모든 페이지 모바일(375px)에서 깨짐 없이 표시
- [ ] 사이드바 모바일 대응 (드로어 또는 바텀 네비)
- [ ] 6개 페이지 empty state 구현
- [ ] 차트 반응형 리사이즈 정상 동작
- [ ] 테이블 가로 스크롤 정상 동작

<!-- TAG: SPEC-UX-001 -->
