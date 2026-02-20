---
id: SPEC-IMPORT-001
version: "1.0.0"
status: draft
created: "2026-02-20"
priority: P0
depends_on:
  - SPEC-DATA-001
---

# SPEC-IMPORT-001: CSV 데이터 임포트 시스템

## 개요

카드사/배달앱/POS에서 다운로드한 CSV 파일을 업로드하여 매출/비용 데이터를 대량 임포트하는 시스템. 기존 `src/lib/csv/parser.ts` 엔진을 활용하여 한국어 헤더 자동 감지, 채널 자동 분류, 수입/지출 자동 판별 기능을 UI로 제공한다.

## 범위

- CSV 파일 업로드 UI (드래그 앤 드롭)
- 파싱 결과 미리보기 테이블
- 데이터 검증 및 오류 표시
- 일괄 임포트 실행 (revenues/expenses 테이블)
- 임포트 결과 요약 + 자동 KPI 재계산

## 범위 제외

- Excel(.xlsx/.xlsm) 파일 직접 파싱
- 카드사/배달앱 API 자동 연동 (SPEC-CONNECT-001, SPEC-DELIVERY-001)

---

## Requirements (EARS)

### REQ-01: CSV 파일 업로드

**Ubiquitous:**
- 시스템은 `/dashboard/import` 페이지에 CSV 파일 업로드 영역을 제공해야 한다.
- 시스템은 드래그 앤 드롭 또는 파일 선택 다이얼로그를 통해 CSV 파일을 받아야 한다.

**State-Driven:**
- IF 업로드된 파일이 CSV가 아니면 THEN "CSV 파일만 업로드 가능합니다" 오류를 표시해야 한다.
- IF 파일 크기가 5MB를 초과하면 THEN "파일 크기가 너무 큽니다" 오류를 표시해야 한다.

### REQ-02: 파싱 및 미리보기

**Event-Driven:**
- WHEN CSV 파일이 업로드되면 THEN 시스템은 기존 parseCsv() 엔진으로 파싱하여 결과를 테이블로 표시해야 한다.

**Ubiquitous:**
- 시스템은 파싱된 각 행에 날짜, 채널, 카테고리, 금액, 유형(수입/지출), 메모를 표시해야 한다.
- 시스템은 자동 분류 결과를 사용자가 수정할 수 있도록 해야 한다.

### REQ-03: 데이터 검증

**Ubiquitous:**
- 시스템은 파싱 오류가 있는 행을 빨간색으로 강조 표시해야 한다.
- 시스템은 파싱 성공/실패 건수를 요약으로 표시해야 한다.

**State-Driven:**
- IF 모든 행의 파싱이 실패하면 THEN "파싱할 수 있는 데이터가 없습니다. CSV 형식을 확인해주세요" 메시지를 표시해야 한다.

### REQ-04: 일괄 임포트

**Event-Driven:**
- WHEN 사용자가 "임포트" 버튼을 클릭하면 THEN 시스템은 유효한 행을 revenues/expenses 테이블에 일괄 삽입해야 한다.
- WHEN 임포트가 완료되면 THEN 시스템은 해당 월의 KPI를 자동 재계산해야 한다.

**Ubiquitous:**
- 시스템은 임포트 결과 요약(성공/실패/건너뜀 건수)을 표시해야 한다.

### REQ-05: 중복 방지

**Ubiquitous:**
- 시스템은 동일 날짜, 금액, 채널의 데이터가 이미 존재하면 중복 경고를 표시해야 한다.

---

## 기존 인프라

- `src/lib/csv/parser.ts`: parseCsv(), ParsedRow, ParseResult 타입
- `src/lib/actions/revenue.ts`, `expense.ts`: CRUD Server Actions
- `src/lib/actions/kpi-sync.ts`: recalculateMonthlyKpi()
- PapaParse 5.5.3 설치됨

<!-- TAG: SPEC-IMPORT-001 -->
