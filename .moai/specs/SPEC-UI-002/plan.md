# SPEC-UI-002 Implementation Plan

<!-- TAG: SPEC-UI-002 -->

## Overview

대시보드 KPI 기간 명시, 거래처 CRUD, 계산서 empty state, 대출금/고정비 연동 등 UI 디테일 5건을 일괄 개선한다.

---

## Phases

### Phase 1: KPI 카드 기간 표시 (Primary Goal)

- 대시보드 KPI 카드 컴포넌트에 기간 라벨 추가
- 각 카드의 데이터 소스에 맞는 기간 텍스트 표시
  - 매출: "이번 달"
  - 지출: "이번 달"
  - 순이익: "이번 달"

### Phase 2: 거래처 카드 편집/삭제/상세 (Primary Goal)

- 거래처 카드에 DropdownMenu (점 3개) 추가
- 편집: Sheet 또는 Dialog로 거래처 정보 수정 폼
- 삭제: AlertDialog 확인 후 삭제
- 상세: 거래처 상세 Sheet (거래 내역 요약)

### Phase 3: Empty State 추가 (Secondary Goal)

- 계산서 매입 탭에 empty state 컴포넌트 추가
  - 아이콘 (FileText)
  - "아직 매입 계산서가 없습니다"
  - CTA: "계산서 등록하기" 또는 "홈택스에서 가져오기"

### Phase 4: 대출금/고정비 연동 (Secondary Goal)

- 고정비 카테고리 옵션에 "대출 상환" 추가
- 고정비 등록 폼에서 대출 상환 선택 시 안내 문구 표시

## Affected Files

### 수정

- `src/components/dashboard/` - KPI 카드 기간 라벨
- `src/app/(dashboard)/vendors/` 또는 거래처 관련 컴포넌트 - CRUD 기능
- `src/app/(dashboard)/invoices/` 또는 계산서 관련 컴포넌트 - empty state
- `src/app/(dashboard)/fixed-costs/` - 대출 상환 카테고리

## Risk Assessment

- **Low Risk**: 모두 UI 레이어 수정, 비즈니스 로직 변경 최소
- **Low Risk**: 거래처 삭제는 기존 Server Action에 의존, 있으면 연결/없으면 스텁
