---
id: SPEC-DATA-001
type: plan
version: "1.0.0"
---

# SPEC-DATA-001 구현 계획: 매출/비용 데이터 입력 시스템

## 개요

sajang.ai의 핵심 데이터 입력 시스템을 구현한다. 사용자가 매출, 비용(변동비/고정비), 고정비를 입력/수정/삭제할 수 있는 CRUD 인터페이스와, 데이터 변경 시 자동으로 월별 KPI를 재계산하는 시스템을 구축한다.

---

## 마일스톤

### Primary Goal: 기반 인프라 구축

**범위:** Zod 스키마, Server Actions, 쿼리 함수, 공통 컴포넌트, 사이드바 확장

**구현 항목:**

1. **Zod 검증 스키마 정의** (`src/lib/validations/data-entry.ts`)
   - RevenueSchema: date, amount(정수, 1 이상), channel(선택), category(선택), memo(선택)
   - ExpenseSchema: date, type(fixed/variable), category(필수), amount(정수, 1 이상), memo(선택)
   - FixedCostSchema: category(필수), amount(정수, 1 이상), is_labor(boolean), start_date(선택), end_date(선택)
   - 각 스키마에서 z.infer로 타입 추론

2. **TypeScript 타입 정의** (`src/types/data-entry.ts`)
   - RevenueFormData, ExpenseFormData, FixedCostFormData (Zod 추론)
   - ActionResult 공통 응답 타입
   - 기존 database.ts의 Tables 헬퍼 타입 활용

3. **사업장 조회 쿼리** (`src/lib/queries/business.ts`)
   - getCurrentBusinessId(): 현재 인증 사용자의 business_id를 반환
   - Supabase 서버 클라이언트 사용
   - 사업장 미등록 시 에러 처리

4. **shadcn/ui 컴포넌트 추가**
   - `pnpm dlx shadcn@latest add dialog select checkbox calendar popover badge`
   - 6개 컴포넌트를 `src/components/ui/`에 추가

5. **사이드바 네비게이션 확장** (`src/app/(dashboard)/sidebar.tsx`)
   - navItems에 매출 관리, 비용 관리, 고정비 관리 메뉴 추가
   - lucide-react 아이콘: TrendingUp, Receipt, Building

**완료 기준:**
- Zod 스키마 단위 테스트 통과
- getCurrentBusinessId 함수 동작 확인
- shadcn/ui 컴포넌트 정상 빌드
- 사이드바에 3개 메뉴 항목 렌더링

---

### Secondary Goal: 매출 관리 기능

**범위:** 매출 CRUD 전체 흐름 (입력 폼 + 데이터 테이블 + Server Actions + KPI 재계산)

**구현 항목:**

1. **매출 조회 쿼리** (`src/lib/queries/revenue.ts`)
   - getRevenues(businessId, yearMonth?): 매출 목록 조회
   - 월 필터 적용, 날짜 내림차순 정렬
   - Supabase 서버 클라이언트 사용

2. **매출 Server Actions** (`src/lib/actions/revenue.ts`)
   - createRevenue: Zod 검증 -> business_id 조회 -> revenues INSERT -> KPI 재계산
   - updateRevenue: ID 검증 -> Zod 검증 -> revenues UPDATE -> KPI 재계산
   - deleteRevenue: ID 검증 -> revenues DELETE -> KPI 재계산
   - revalidatePath("/dashboard/revenue") 호출

3. **KPI 재계산 Server Action** (`src/lib/actions/kpi-sync.ts`)
   - recalculateMonthlyKpi(businessId, yearMonth): 해당 월 데이터 집계
   - revenues SUM(amount) -> totalRevenue
   - expenses WHERE type='variable' SUM(amount) -> totalExpense
   - fixed_costs SUM(amount) -> totalFixedCost
   - fixed_costs WHERE is_labor=true SUM(amount) -> totalLaborCost
   - calculateKpi() 호출 후 monthly_summaries UPSERT

4. **매출 입력 폼** (`src/components/data-entry/revenue-form.tsx`)
   - React Hook Form + zodResolver(RevenueSchema)
   - 필드: 날짜(Calendar 팝오버), 금액, 채널(선택), 카테고리(선택), 메모(선택)
   - 생성/수정 모드 전환 (editingId prop)
   - 제출 중 로딩 상태
   - shadcn/ui Input, Button, Calendar, Popover 사용

5. **매출 데이터 테이블** (`src/components/data-entry/revenue-table.tsx`)
   - TanStack React Table 기반
   - 컬럼: 날짜, 채널, 카테고리, 금액, 메모, 액션(수정/삭제)
   - 금액은 천 단위 콤마 포맷
   - 빈 상태 UI

6. **월 선택 필터** (`src/components/data-entry/month-picker.tsx`)
   - 년-월 선택 UI (현재 월 기본)
   - URL 쿼리 파라미터 기반 (?month=2026-02)

7. **삭제 확인 다이얼로그** (`src/components/data-entry/delete-confirm-dialog.tsx`)
   - shadcn/ui Dialog 기반
   - "정말 삭제하시겠습니까?" 확인 메시지
   - 삭제 중 로딩 상태

8. **매출 관리 페이지** (`src/app/(dashboard)/revenue/page.tsx`)
   - Server Component: getRevenues 호출
   - RevenueForm + RevenueTable + MonthPicker 조합
   - URL 쿼리 파라미터로 월 필터 적용

**완료 기준:**
- 매출 생성/조회/수정/삭제 전체 CRUD 동작
- KPI 자동 재계산 확인
- 월 필터링 동작
- 빈 상태 UI 표시
- 폼 검증 에러 메시지 표시

---

### Tertiary Goal: 비용 관리 기능

**범위:** 비용 CRUD 전체 흐름 (매출과 동일한 패턴, type 필드 추가)

**구현 항목:**

1. **비용 조회 쿼리** (`src/lib/queries/expense.ts`)
   - getExpenses(businessId, yearMonth?): 비용 목록 조회
   - 월 필터, type 필터 지원

2. **비용 Server Actions** (`src/lib/actions/expense.ts`)
   - createExpense, updateExpense, deleteExpense
   - 매출 Server Actions와 동일한 패턴 (type 필드 추가)

3. **비용 입력 폼** (`src/components/data-entry/expense-form.tsx`)
   - type 선택 (고정비/변동비) -> 카테고리 플레이스홀더 동적 변경
   - 나머지 필드는 매출 폼과 유사

4. **비용 데이터 테이블** (`src/components/data-entry/expense-table.tsx`)
   - 컬럼: 날짜, 유형(Badge), 카테고리, 금액, 메모, 액션
   - 유형별 Badge 색상 구분

5. **비용 관리 페이지** (`src/app/(dashboard)/expense/page.tsx`)
   - 매출 페이지와 동일한 구조

**완료 기준:**
- 비용 생성/조회/수정/삭제 전체 CRUD 동작
- 고정비/변동비 유형 구분 표시
- 카테고리 플레이스홀더 동적 변경

---

### Final Goal: 고정비 관리 기능

**범위:** 고정비 CRUD (매월 반복 비용 관리, is_labor 구분)

**구현 항목:**

1. **고정비 조회 쿼리** (`src/lib/queries/fixed-cost.ts`)
   - getFixedCosts(businessId): 전체 고정비 목록 조회
   - is_labor 기준 정렬 (인건비 우선)

2. **고정비 Server Actions** (`src/lib/actions/fixed-cost.ts`)
   - createFixedCost, updateFixedCost, deleteFixedCost
   - 변경 시 관련 월 KPI 재계산

3. **고정비 입력 폼** (`src/components/data-entry/fixed-cost-form.tsx`)
   - is_labor 체크박스
   - start_date, end_date 선택(Calendar)
   - 자주 사용하는 카테고리 제안

4. **고정비 데이터 테이블** (`src/components/data-entry/fixed-cost-table.tsx`)
   - 컬럼: 카테고리, 금액, 인건비 여부(Badge), 시작일, 종료일, 액션
   - 상단 요약: 고정비 합계, 인건비 합계

5. **고정비 관리 페이지** (`src/app/(dashboard)/fixed-costs/page.tsx`)
   - Server Component
   - 고정비 합계/인건비 합계 요약 카드

**완료 기준:**
- 고정비 생성/조회/수정/삭제 전체 CRUD 동작
- 인건비/기타 고정비 구분 표시
- 고정비 합계 요약 표시
- KPI 재계산 정상 동작

---

## 기술적 접근 방식

### 아키텍처 패턴

```
[Page (Server Component)]
    ├── 데이터 조회 (queries/*.ts via Supabase Server Client)
    └── 렌더링
        ├── [Form Component (Client)] → Server Action → revalidatePath
        ├── [Table Component (Client)] → 수정/삭제 이벤트
        └── [MonthPicker (Client)] → URL 쿼리 파라미터 변경
```

**Server Component (Page):**
- Supabase 서버 클라이언트로 데이터 조회
- 인증 검증은 대시보드 레이아웃에서 처리 (이미 구현)
- 조회된 데이터를 Client Component에 props로 전달

**Client Component (Form/Table):**
- React Hook Form + Zod로 클라이언트 검증
- Server Action 호출로 데이터 변이
- useTransition으로 Server Action 호출 상태 관리

**Server Action:**
- "use server" 지시어
- Supabase 서버 클라이언트로 인증된 사용자 확인
- business_id 조회 후 CRUD 실행
- revalidatePath로 페이지 데이터 갱신
- KPI 재계산 트리거

### 데이터 흐름

```
사용자 입력 → Zod 클라이언트 검증 → Server Action 호출
  → Supabase 서버 클라이언트 인증 확인
  → business_id 조회
  → 데이터 INSERT/UPDATE/DELETE
  → recalculateMonthlyKpi(businessId, yearMonth)
    → revenues SUM → expenses SUM → fixed_costs SUM
    → calculateKpi(KpiInput)
    → monthly_summaries UPSERT
  → revalidatePath
  → 페이지 자동 갱신
```

### 코드 재사용 전략

- **폼 훅 패턴:** useRevenueForm, useExpenseForm, useFixedCostForm 모두 동일한 React Hook Form + zodResolver 패턴
- **테이블 패턴:** TanStack React Table 공통 설정 (정렬, 빈 상태, 금액 포맷)
- **Server Action 패턴:** 인증 확인 -> business_id 조회 -> CRUD -> KPI 재계산 -> revalidatePath
- **삭제 다이얼로그:** 공통 DeleteConfirmDialog 컴포넌트 재사용
- **월 선택 필터:** MonthPicker 컴포넌트를 매출/비용 페이지에서 공유

### 금액 포맷팅

```typescript
// 천 단위 콤마: 1234567 → "1,234,567원"
function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
```

---

## 리스크 및 대응 방안

| 리스크 | 영향도 | 대응 방안 |
| ------ | ------ | --------- |
| KPI 재계산 성능: 대량 데이터 집계 시 지연 | Medium | 해당 월 데이터만 집계 (전체 스캔 금지), 인덱스 활용 (idx_revenues_business_date, idx_expenses_business_date) |
| 동시 수정 충돌: 같은 월 데이터를 동시에 수정하면 KPI가 부정확할 수 있음 | Low | MVP 단계에서는 단일 사용자이므로 충돌 가능성 낮음, 향후 optimistic lock 고려 |
| Calendar 컴포넌트 한국어 로케일: 날짜 선택 UI가 영어로 표시될 수 있음 | Low | date-fns/locale/ko 또는 커스텀 로케일 적용 |
| fixed_costs의 start_date/end_date 기간 중첩: 동일 카테고리에 기간이 겹치는 고정비 등록 가능 | Low | MVP 단계에서는 허용, 향후 중복 검증 추가 |
| Server Action 에러 핸들링: Supabase 에러 메시지가 영어로 반환됨 | Medium | Server Action 내에서 에러 코드를 한국어 메시지로 매핑 |

---

## 전문가 상담 권장

이 SPEC은 다음 도메인에 대한 전문가 상담을 권장합니다:

- **expert-backend**: Server Actions 구조, KPI 재계산 로직, Supabase 쿼리 최적화
- **expert-frontend**: 폼 컴포넌트 설계, TanStack React Table 구성, shadcn/ui 통합 패턴

---

## 의존성

### 선행 조건

- SPEC-AUTH-001 구현 완료 (인증, 사업장 등록, 대시보드 레이아웃)

### 후속 SPEC 연계

- SPEC-CSV-XXX: CSV 업로드 시스템 (이 SPEC의 데이터 입력을 CSV로 대체)
- SPEC-DASHBOARD-XXX: 대시보드 KPI 위젯 (이 SPEC에서 계산된 monthly_summaries 활용)
- SPEC-AI-XXX: AI 경영 분석 (monthly_summaries 기반 분석 요청)
- SPEC-SIMULATION-XXX: What-if 시뮬레이션 (KPI 데이터 기반 시나리오 실행)

<!-- TAG: SPEC-DATA-001 -->
