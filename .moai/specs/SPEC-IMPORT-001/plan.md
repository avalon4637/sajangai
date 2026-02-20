---
id: SPEC-IMPORT-001
type: plan
version: "1.0.0"
---

# SPEC-IMPORT-001 구현 계획: CSV 데이터 임포트 시스템

## 개요

기존 `src/lib/csv/parser.ts` 엔진을 활용하여 CSV 파일 업로드, 미리보기, 검증, 일괄 임포트 기능을 구현한다.

---

## 마일스톤

### Primary Goal: 파일 업로드 + 파싱 미리보기

1. **CSV 업로드 컴포넌트** (`src/components/import/csv-upload.tsx`)
   - 드래그 앤 드롭 영역 + 파일 선택 버튼
   - 파일 유효성 검사 (CSV 형식, 5MB 제한)
   - FileReader API로 클라이언트 사이드 파싱

2. **미리보기 테이블** (`src/components/import/import-preview-table.tsx`)
   - TanStack React Table로 파싱 결과 표시
   - 행별 유효/오류 상태 표시
   - 채널/카테고리 인라인 수정 가능

3. **임포트 페이지** (`src/app/(dashboard)/import/page.tsx`)
   - 클라이언트 컴포넌트 (파일 처리 필요)
   - 단계별 워크플로: 업로드 → 미리보기 → 임포트

### Secondary Goal: 일괄 임포트 + KPI 재계산

4. **임포트 Server Action** (`src/lib/actions/import.ts`)
   - 일괄 insert (revenues/expenses 테이블)
   - 중복 검사 로직
   - 월별 KPI 자동 재계산

5. **결과 요약** (`src/components/import/import-result.tsx`)
   - 성공/실패/건너뜀 건수
   - 오류 상세 내역
   - 대시보드 바로가기

### Tertiary Goal: UX 강화

6. 사이드바에 "데이터 임포트" 메뉴 추가
7. CSV 템플릿 다운로드 기능
8. 임포트 이력 조회

---

## 파일 구조

```
src/
├── app/(dashboard)/import/
│   └── page.tsx                    # [신규] 임포트 페이지
├── components/import/
│   ├── csv-upload.tsx              # [신규] CSV 업로드 컴포넌트
│   ├── import-preview-table.tsx    # [신규] 미리보기 테이블
│   └── import-result.tsx           # [신규] 결과 요약
├── lib/actions/
│   └── import.ts                   # [신규] 임포트 Server Action
└── app/(dashboard)/sidebar.tsx     # [수정] 메뉴 추가
```

**수정 1개, 신규 5개**

---

## 의존성

- SPEC-DATA-001 (완료): revenues/expenses CRUD
- parser.ts: CSV 파싱 엔진
- PapaParse 5.5.3: 설치됨

### 후속 SPEC 연계

- SPEC-CONNECT-001: 카드매출 자동연계가 구현되면 CSV 임포트와 통합 데이터 채널 관리

<!-- TAG: SPEC-IMPORT-001 -->
