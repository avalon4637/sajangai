---
id: SPEC-UI-002
version: "1.0.0"
status: planned
created: "2026-04-05"
updated: "2026-04-05"
author: avalon4637
priority: P2
---

# SPEC-UI-002: UI 디테일 개선 일괄

## HISTORY

| 버전  | 날짜       | 작성자     | 변경 내용 |
| ----- | ---------- | ---------- | --------- |
| 1.0.0 | 2026-04-05 | avalon4637 | 초기 작성 |

---

## Overview

- **Title**: UI 디테일 개선 일괄
- **Status**: Planned
- **Priority**: P2 (detail)
- **Estimated Effort**: M

## Problem Statement

서비스 곳곳에 사용자 혼란을 유발하는 UI 디테일 이슈 5건이 존재한다:

1. **성과 지표 카드 기간 미표시 (3-1)**: 대시보드 상단 KPI 카드에 "매출 1,247,000원"만 표시되고, 이것이 오늘/이번 주/이번 달 기준인지 불명확
2. **거래처 카드 기능 부재 (3-2)**: 거래처 목록이 카드로 표시되나 편집/삭제/상세 보기 기능이 없음
3. **계산서 매입 탭 empty state 없음 (3-3)**: 매입 탭에 데이터가 없을 때 빈 화면만 표시, 안내 메시지 없음
4. **대출금/고정비 연동 (3-5)**: 대출 상환금이 고정비에 반영되지 않거나 관계가 불명확

## Requirements

### Must Have

1. **WHEN** 대시보드 KPI 카드가 표시될 **THEN** 각 카드에 데이터 기간(예: "이번 달", "최근 7일")이 명시되어야 한다
2. **WHEN** 거래처 카드를 클릭할 **THEN** 편집/삭제 옵션이 표시되어야 한다
3. **WHEN** 거래처 카드에서 "상세"를 선택할 **THEN** 거래처 상세 정보(거래 내역 등)가 표시되어야 한다
4. **WHEN** 계산서 매입 탭에 데이터가 없을 **THEN** "아직 매입 계산서가 없습니다" empty state UI가 표시되어야 한다
5. **IF** empty state가 표시될 **THEN** 데이터 추가 방법을 안내하는 CTA가 함께 표시되어야 한다

### Nice to Have

6. KPI 카드 기간을 사용자가 변경할 수 있는 드롭다운 (이번 주/이번 달/최근 30일)
7. 거래처 삭제 시 확인 다이얼로그
8. 고정비에 "대출 상환" 카테고리 추가 및 연동 안내

## Technical Notes

### 3-1: KPI 카드 기간 명시

- 영향 파일: `src/components/dashboard/` 내 KPI 카드 컴포넌트
- 각 카드 하단 또는 우측에 "이번 달" 등 텍스트 라벨 추가

### 3-2: 거래처 카드 CRUD

- 영향 파일: `src/app/(dashboard)/vendors/` 또는 거래처 관련 페이지
- 카드에 DropdownMenu (점 3개 메뉴) 추가: 편집, 삭제, 상세
- 편집: 인라인 또는 Sheet/Dialog
- 삭제: AlertDialog로 확인

### 3-3: 계산서 매입 empty state

- 영향 파일: `src/app/(dashboard)/invoices/` 또는 계산서 관련 페이지
- shadcn/ui 패턴의 empty state: 아이콘 + 메시지 + CTA

### 3-5: 대출금/고정비 연동

- 고정비 카테고리에 "대출 상환" 항목 추가
- 안내 문구: "대출 상환금은 고정비로 등록하면 매월 자동 반영됩니다"

## Dependencies

- 없음 (모두 독립적 UI 개선)

## Exclusions (What NOT to Build)

- Shall NOT implement 거래처 관리 시스템 전체 리디자인 (reason: 기능 추가만, 디자인 유지)
- Shall NOT implement KPI 데이터 실시간 갱신 (reason: 기간 라벨 추가만)
- Shall NOT implement 대출 관리 전용 모듈 (reason: 고정비 카테고리 추가 수준)
