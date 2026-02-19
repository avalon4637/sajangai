---
id: SPEC-DATA-001
version: "1.0.0"
status: approved
created: "2026-02-19"
updated: "2026-02-19"
author: avalon4637
priority: P0
---

# SPEC-DATA-001: 매출/비용 데이터 입력 시스템

## HISTORY

| 버전  | 날짜       | 작성자      | 변경 내용                  |
| ----- | ---------- | ----------- | -------------------------- |
| 1.0.0 | 2026-02-19 | avalon4637  | 초기 작성                  |

---

## Environment (환경)

### 기술 스택

| 구분             | 기술                              | 버전       |
| ---------------- | --------------------------------- | ---------- |
| 프레임워크       | Next.js App Router                | 16.1.6     |
| UI 라이브러리    | React                             | 19.2.3     |
| 언어             | TypeScript strict                 | 5.x        |
| DB               | Supabase PostgreSQL (RLS 활성화)  | 16.x       |
| 폼 관리          | React Hook Form                   | 7.71.1     |
| 스키마 검증      | Zod                               | 4.3.6      |
| UI 컴포넌트      | shadcn/ui (new-york 테마)         | latest     |
| CSS              | Tailwind CSS                      | 4.x        |
| 상태 관리        | Zustand                           | 5.0.11     |
| 데이터 테이블    | TanStack React Table              | 8.21.3     |
| 아이콘           | Lucide React                      | 0.574.0    |
| 테스트           | Vitest                            | 4.x        |

### 기존 인프라 (SPEC-AUTH-001에서 구현 완료)

- `src/middleware.ts`: 미인증 사용자를 `/auth/login`으로 리다이렉트
- `src/lib/supabase/client.ts`: `createBrowserClient` 클라이언트 팩토리
- `src/lib/supabase/server.ts`: `createServerClient` 서버 팩토리
- `src/types/database.ts`: TypeScript DB 타입 정의 (Tables, InsertTables, UpdateTables 헬퍼 포함)
- `src/hooks/use-auth.ts`: useAuth 커스텀 훅 (user, session, loading, signOut)
- `src/lib/validations/auth.ts`: Zod 인증 스키마 (LoginSchema, SignupSchema, OnboardingSchema)
- `src/app/(dashboard)/layout.tsx`: 대시보드 레이아웃 (인증 검증 + 사이드바)
- `src/app/(dashboard)/sidebar.tsx`: 사이드바 네비게이션 컴포넌트
- `src/lib/kpi/calculator.ts`: KPI 계산 엔진 (calculateKpi 순수 함수)

### 데이터베이스 스키마 (이미 적용됨)

```sql
-- 매출 테이블
CREATE TABLE revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date date NOT NULL,
  channel text,
  category text,
  amount numeric(12,0) NOT NULL,
  memo text,
  created_at timestamptz DEFAULT now()
);

-- 지출 테이블 (매입 + 변동비)
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('fixed', 'variable')),
  category text NOT NULL,
  amount numeric(12,0) NOT NULL,
  memo text,
  created_at timestamptz DEFAULT now()
);

-- 고정비 테이블 (월별 반복 비용)
CREATE TABLE fixed_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category text NOT NULL,
  amount numeric(12,0) NOT NULL,
  is_labor boolean DEFAULT false,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

-- 월별 요약 테이블 (계산된 KPI 캐시)
CREATE TABLE monthly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  year_month text NOT NULL,
  total_revenue numeric(12,0) DEFAULT 0,
  total_expense numeric(12,0) DEFAULT 0,
  total_fixed_cost numeric(12,0) DEFAULT 0,
  total_labor_cost numeric(12,0) DEFAULT 0,
  gross_profit numeric(12,0) DEFAULT 0,
  net_profit numeric(12,0) DEFAULT 0,
  gross_margin numeric(5,2) DEFAULT 0,
  labor_ratio numeric(5,2) DEFAULT 0,
  fixed_cost_ratio numeric(5,2) DEFAULT 0,
  survival_score numeric(5,1) DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, year_month)
);
```

### KPI 계산 엔진 인터페이스

```typescript
interface KpiInput {
  totalRevenue: number;
  totalExpense: number;      // 변동비 (매입)
  totalFixedCost: number;    // 고정비 합계
  totalLaborCost: number;    // 인건비 (고정비 중 is_labor=true)
}

interface KpiResult {
  grossProfit: number;
  netProfit: number;
  grossMargin: number;       // 매출총이익률 (%)
  laborRatio: number;        // 인건비 비율 (%)
  fixedCostRatio: number;    // 고정비 비율 (%)
  survivalScore: number;     // 생존 점수 (0~100)
}
```

### 제약 사항

- 모든 금액은 정수 (원 단위, numeric(12,0))
- business_id 외래키 제약: 반드시 businesses 테이블에 레코드가 존재해야 삽입 가능
- RLS 정책: 사용자 본인의 사업장 데이터만 접근 가능 (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
- 모든 UI 텍스트는 한국어
- expenses 테이블의 type 필드는 'fixed' 또는 'variable' 값만 허용 (CHECK 제약)

---

## Assumptions (가정)

| 번호 | 가정                                                                          | 신뢰도 | 근거                                           | 검증 방법                                   |
| ---- | ----------------------------------------------------------------------------- | ------ | ---------------------------------------------- | ------------------------------------------- |
| A-01 | SPEC-AUTH-001이 완료되어 사용자 인증 및 사업장 등록이 정상 작동한다             | High   | SPEC-AUTH-001 status: approved, 커밋 이력 확인  | 로그인 후 대시보드 접근 테스트              |
| A-02 | 사용자당 하나의 사업장만 존재한다 (MVP 단계)                                    | High   | SPEC-AUTH-001 가정 A-04                        | businesses 테이블 조회                      |
| A-03 | 매출/비용 데이터는 수동 입력이 기본이며 CSV 업로드는 별도 SPEC으로 분리한다      | High   | product.md의 핵심기능 3번은 별도 기능           | SPEC 범위 정의                              |
| A-04 | 금액 입력은 원 단위 정수만 허용한다 (소수점 없음)                               | High   | DB 스키마 numeric(12,0)                        | Zod 스키마 검증                             |
| A-05 | 매출 채널 분류는 자유 입력 텍스트로 한다 (드롭다운 아님)                        | Medium | MVP 단계에서 카테고리 고정 불가                 | 사용성 테스트                               |
| A-06 | 고정비는 월 단위 반복 비용이며, 매월 자동 생성이 아닌 등록/관리 방식이다         | High   | fixed_costs 테이블 구조 (start_date, end_date)  | 비즈니스 요구사항 검토                      |
| A-07 | 월별 요약(monthly_summaries)은 데이터 입력 시 자동 재계산한다                   | High   | KPI 계산 엔진 존재, 캐시 테이블 구조            | calculateKpi 함수 호출 검증                  |

---

## Requirements (요구사항)

### REQ-01: 매출 데이터 입력 및 관리

#### Ubiquitous Requirements (항상 적용)

- 시스템은 항상 `/dashboard/revenue` 경로에서 매출 입력 폼과 매출 목록을 제공해야 한다.
- 시스템은 항상 날짜, 금액 필드를 필수 입력으로 검증해야 한다.
- 시스템은 항상 Zod 스키마를 통해 클라이언트 측 입력 검증을 수행해야 한다.
- 시스템은 항상 React Hook Form을 통해 폼 상태를 관리해야 한다.

#### Event-Driven Requirements (이벤트 기반)

- WHEN 사용자가 유효한 매출 데이터를 입력하고 저장 버튼을 클릭하면 THEN 시스템은 revenues 테이블에 레코드를 삽입하고 매출 목록을 갱신해야 한다.
- WHEN 사용자가 기존 매출 레코드의 수정 버튼을 클릭하면 THEN 시스템은 해당 레코드의 데이터를 입력 폼에 채워 수정 모드로 전환해야 한다.
- WHEN 사용자가 매출 레코드의 삭제 버튼을 클릭하면 THEN 시스템은 확인 다이얼로그를 표시하고 확인 시 해당 레코드를 삭제해야 한다.
- WHEN 매출 데이터가 생성/수정/삭제되면 THEN 시스템은 해당 월의 monthly_summaries를 자동 재계산해야 한다.

#### State-Driven Requirements (상태 기반)

- IF 금액 필드에 0 이하의 값이 입력되면 THEN 시스템은 "금액은 1원 이상이어야 합니다" 에러를 표시해야 한다.
- IF 날짜가 미래 날짜이면 THEN 시스템은 "미래 날짜는 입력할 수 없습니다" 에러를 표시해야 한다.
- IF 폼 제출이 진행 중이면 THEN 시스템은 저장 버튼을 비활성화하고 로딩 인디케이터를 표시해야 한다.
- IF 매출 목록에 데이터가 없으면 THEN 시스템은 "아직 등록된 매출 데이터가 없습니다" 빈 상태 메시지를 표시해야 한다.

#### Unwanted Requirements (금지 사항)

- 시스템은 인증되지 않은 사용자가 매출 데이터에 접근하는 것을 허용하지 않아야 한다.
- 시스템은 다른 사업장의 매출 데이터를 조회/수정/삭제하는 것을 허용하지 않아야 한다 (RLS 정책으로 보장).

---

### REQ-02: 비용(지출) 데이터 입력 및 관리

#### Ubiquitous Requirements (항상 적용)

- 시스템은 항상 `/dashboard/expense` 경로에서 비용 입력 폼과 비용 목록을 제공해야 한다.
- 시스템은 항상 날짜, 유형(fixed/variable), 카테고리, 금액 필드를 필수 입력으로 검증해야 한다.
- 시스템은 항상 비용 유형을 "고정비"와 "변동비" 중 선택하도록 제공해야 한다.

#### Event-Driven Requirements (이벤트 기반)

- WHEN 사용자가 유효한 비용 데이터를 입력하고 저장 버튼을 클릭하면 THEN 시스템은 expenses 테이블에 레코드를 삽입하고 비용 목록을 갱신해야 한다.
- WHEN 사용자가 기존 비용 레코드의 수정 버튼을 클릭하면 THEN 시스템은 해당 레코드의 데이터를 입력 폼에 채워 수정 모드로 전환해야 한다.
- WHEN 사용자가 비용 레코드의 삭제 버튼을 클릭하면 THEN 시스템은 확인 다이얼로그를 표시하고 확인 시 해당 레코드를 삭제해야 한다.
- WHEN 비용 데이터가 생성/수정/삭제되면 THEN 시스템은 해당 월의 monthly_summaries를 자동 재계산해야 한다.

#### State-Driven Requirements (상태 기반)

- IF 비용 유형이 "fixed"이면 THEN 시스템은 카테고리 필드에 고정비 관련 플레이스홀더(예: 임대료, 관리비)를 표시해야 한다.
- IF 비용 유형이 "variable"이면 THEN 시스템은 카테고리 필드에 변동비 관련 플레이스홀더(예: 식재료, 포장비)를 표시해야 한다.
- IF 금액 필드에 0 이하의 값이 입력되면 THEN 시스템은 "금액은 1원 이상이어야 합니다" 에러를 표시해야 한다.

#### Unwanted Requirements (금지 사항)

- 시스템은 expenses 테이블의 type 필드에 'fixed' 또는 'variable' 외의 값을 저장하지 않아야 한다.
- 시스템은 다른 사업장의 비용 데이터에 접근하는 것을 허용하지 않아야 한다.

---

### REQ-03: 고정비 관리

#### Ubiquitous Requirements (항상 적용)

- 시스템은 항상 `/dashboard/fixed-costs` 경로에서 고정비 목록과 등록/수정 기능을 제공해야 한다.
- 시스템은 항상 카테고리, 금액, 인건비 여부(is_labor) 필드를 필수 입력으로 검증해야 한다.
- 시스템은 항상 고정비 목록에서 인건비(is_labor=true)와 기타 고정비를 구분하여 표시해야 한다.

#### Event-Driven Requirements (이벤트 기반)

- WHEN 사용자가 고정비를 등록하면 THEN 시스템은 fixed_costs 테이블에 레코드를 삽입하고 목록을 갱신해야 한다.
- WHEN 사용자가 고정비를 수정하면 THEN 시스템은 해당 레코드를 업데이트하고 목록을 갱신해야 한다.
- WHEN 사용자가 고정비를 삭제하면 THEN 시스템은 확인 후 해당 레코드를 삭제하고 목록을 갱신해야 한다.
- WHEN 고정비 데이터가 변경되면 THEN 시스템은 관련 월의 monthly_summaries를 자동 재계산해야 한다.

#### State-Driven Requirements (상태 기반)

- IF is_labor 체크박스가 선택되면 THEN 시스템은 해당 고정비를 인건비로 분류하여 KPI 계산에 반영해야 한다.
- IF 고정비에 start_date가 설정되어 있으면 THEN 시스템은 해당 날짜 이후의 월만 계산에 포함해야 한다.
- IF 고정비에 end_date가 설정되어 있으면 THEN 시스템은 해당 날짜 이전의 월만 계산에 포함해야 한다.

#### Optional Requirements (선택 사항)

- 가능하면 고정비 카테고리에 자주 사용하는 항목(임대료, 인건비, 보험료, 관리비)을 기본 제안한다.
- 가능하면 고정비 총액과 인건비 총액을 목록 상단에 요약 표시한다.

---

### REQ-04: 데이터 목록 조회 및 필터링

#### Ubiquitous Requirements (항상 적용)

- 시스템은 항상 매출/비용 목록을 최신순(날짜 내림차순)으로 정렬하여 표시해야 한다.
- 시스템은 항상 TanStack React Table 기반의 데이터 테이블을 사용하여 목록을 렌더링해야 한다.

#### Event-Driven Requirements (이벤트 기반)

- WHEN 사용자가 월 필터를 변경하면 THEN 시스템은 해당 월의 데이터만 조회하여 목록을 갱신해야 한다.

#### State-Driven Requirements (상태 기반)

- IF 조회된 데이터가 없으면 THEN 시스템은 빈 상태 UI를 표시해야 한다.

#### Optional Requirements (선택 사항)

- 가능하면 매출/비용 목록에서 카테고리별 소계를 표시한다.

---

### REQ-05: 월별 KPI 자동 재계산

#### Ubiquitous Requirements (항상 적용)

- 시스템은 항상 매출/비용/고정비 데이터 변경 시 해당 월의 KPI를 자동 재계산해야 한다.
- 시스템은 항상 `calculateKpi` 함수를 사용하여 KPI를 계산해야 한다.

#### Event-Driven Requirements (이벤트 기반)

- WHEN 매출/비용/고정비 데이터가 생성, 수정 또는 삭제되면 THEN 시스템은 해당 데이터의 날짜에 해당하는 월의 revenues 합계, expenses 합계, fixed_costs 합계(전체, 인건비)를 집계하고 calculateKpi를 호출하여 monthly_summaries 테이블을 UPSERT해야 한다.

#### Unwanted Requirements (금지 사항)

- 시스템은 KPI 재계산을 위해 전체 데이터를 조회하지 않아야 한다 (해당 월 데이터만 집계).

---

### REQ-06: 사이드바 네비게이션 확장

#### Event-Driven Requirements (이벤트 기반)

- WHEN 사용자가 사이드바의 "매출 관리" 링크를 클릭하면 THEN 시스템은 `/dashboard/revenue` 페이지로 이동해야 한다.
- WHEN 사용자가 사이드바의 "비용 관리" 링크를 클릭하면 THEN 시스템은 `/dashboard/expense` 페이지로 이동해야 한다.
- WHEN 사용자가 사이드바의 "고정비 관리" 링크를 클릭하면 THEN 시스템은 `/dashboard/fixed-costs` 페이지로 이동해야 한다.

#### State-Driven Requirements (상태 기반)

- IF 현재 경로가 해당 메뉴 항목의 경로와 일치하면 THEN 시스템은 해당 메뉴 항목을 활성 상태로 강조 표시해야 한다.

---

### REQ-07: Server Actions 기반 데이터 변이

#### Ubiquitous Requirements (항상 적용)

- 시스템은 항상 Server Actions를 통해 데이터 생성/수정/삭제를 수행해야 한다.
- 시스템은 항상 Server Action 내에서 Supabase 서버 클라이언트를 사용하여 인증된 사용자의 business_id를 조회한 후 데이터를 조작해야 한다.

#### Event-Driven Requirements (이벤트 기반)

- WHEN Server Action이 실패하면 THEN 시스템은 클라이언트에 한국어 에러 메시지를 반환해야 한다.
- WHEN Server Action이 성공하면 THEN 시스템은 `revalidatePath`를 호출하여 해당 페이지의 데이터를 갱신해야 한다.

#### Unwanted Requirements (금지 사항)

- 시스템은 클라이언트 컴포넌트에서 직접 Supabase 서버 클라이언트를 사용하여 데이터를 변이하지 않아야 한다.
- 시스템은 Server Action에서 사용자가 소유하지 않은 business_id로 데이터를 조작하지 않아야 한다.

---

## Specifications (명세)

### 파일 구조

```
src/
├── app/(dashboard)/
│   ├── sidebar.tsx                    # [수정] 네비게이션 항목 추가
│   ├── revenue/
│   │   └── page.tsx                   # [신규] 매출 관리 페이지 (Server Component)
│   ├── expense/
│   │   └── page.tsx                   # [신규] 비용 관리 페이지 (Server Component)
│   └── fixed-costs/
│       └── page.tsx                   # [신규] 고정비 관리 페이지 (Server Component)
├── components/
│   ├── data-entry/
│   │   ├── revenue-form.tsx           # [신규] 매출 입력 폼 (Client Component)
│   │   ├── expense-form.tsx           # [신규] 비용 입력 폼 (Client Component)
│   │   ├── fixed-cost-form.tsx        # [신규] 고정비 입력 폼 (Client Component)
│   │   ├── revenue-table.tsx          # [신규] 매출 데이터 테이블 (Client Component)
│   │   ├── expense-table.tsx          # [신규] 비용 데이터 테이블 (Client Component)
│   │   ├── fixed-cost-table.tsx       # [신규] 고정비 데이터 테이블 (Client Component)
│   │   ├── month-picker.tsx           # [신규] 월 선택 필터 (Client Component)
│   │   └── delete-confirm-dialog.tsx  # [신규] 삭제 확인 다이얼로그 (Client Component)
│   └── ui/
│       ├── dialog.tsx                 # [신규] shadcn/ui Dialog 추가
│       ├── select.tsx                 # [신규] shadcn/ui Select 추가
│       ├── checkbox.tsx               # [신규] shadcn/ui Checkbox 추가
│       ├── calendar.tsx               # [신규] shadcn/ui Calendar 추가
│       ├── popover.tsx                # [신규] shadcn/ui Popover 추가
│       └── badge.tsx                  # [신규] shadcn/ui Badge 추가
├── lib/
│   ├── actions/
│   │   ├── revenue.ts                 # [신규] 매출 Server Actions (create, update, delete)
│   │   ├── expense.ts                 # [신규] 비용 Server Actions (create, update, delete)
│   │   ├── fixed-cost.ts              # [신규] 고정비 Server Actions (create, update, delete)
│   │   └── kpi-sync.ts                # [신규] KPI 재계산 Server Action
│   ├── validations/
│   │   └── data-entry.ts              # [신규] 매출/비용/고정비 Zod 스키마
│   └── queries/
│       ├── revenue.ts                 # [신규] 매출 조회 쿼리 함수
│       ├── expense.ts                 # [신규] 비용 조회 쿼리 함수
│       ├── fixed-cost.ts              # [신규] 고정비 조회 쿼리 함수
│       └── business.ts                # [신규] 현재 사용자의 business_id 조회
├── hooks/
│   ├── use-revenue-form.ts            # [신규] 매출 폼 상태 훅
│   ├── use-expense-form.ts            # [신규] 비용 폼 상태 훅
│   └── use-fixed-cost-form.ts         # [신규] 고정비 폼 상태 훅
└── types/
    └── data-entry.ts                  # [신규] 매출/비용/고정비 TypeScript 타입
```

### Zod 스키마 명세

```typescript
// src/lib/validations/data-entry.ts

// 매출 입력 스키마
export const RevenueSchema = z.object({
  date: z.coerce.date().max(new Date(), "미래 날짜는 입력할 수 없습니다"),
  amount: z.coerce.number().int().min(1, "금액은 1원 이상이어야 합니다").max(999999999999, "금액이 너무 큽니다"),
  channel: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  memo: z.string().max(500).optional(),
});

// 비용 입력 스키마
export const ExpenseSchema = z.object({
  date: z.coerce.date().max(new Date(), "미래 날짜는 입력할 수 없습니다"),
  type: z.enum(["fixed", "variable"], { message: "비용 유형을 선택해주세요" }),
  category: z.string().min(1, "카테고리를 입력해주세요").max(50),
  amount: z.coerce.number().int().min(1, "금액은 1원 이상이어야 합니다").max(999999999999, "금액이 너무 큽니다"),
  memo: z.string().max(500).optional(),
});

// 고정비 입력 스키마
export const FixedCostSchema = z.object({
  category: z.string().min(1, "카테고리를 입력해주세요").max(50),
  amount: z.coerce.number().int().min(1, "금액은 1원 이상이어야 합니다").max(999999999999, "금액이 너무 큽니다"),
  is_labor: z.boolean().default(false),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
});
```

### Server Actions 명세

```typescript
// src/lib/actions/revenue.ts
"use server"
export async function createRevenue(formData: RevenueFormData): Promise<ActionResult>
export async function updateRevenue(id: string, formData: RevenueFormData): Promise<ActionResult>
export async function deleteRevenue(id: string): Promise<ActionResult>

// src/lib/actions/expense.ts
"use server"
export async function createExpense(formData: ExpenseFormData): Promise<ActionResult>
export async function updateExpense(id: string, formData: ExpenseFormData): Promise<ActionResult>
export async function deleteExpense(id: string): Promise<ActionResult>

// src/lib/actions/fixed-cost.ts
"use server"
export async function createFixedCost(formData: FixedCostFormData): Promise<ActionResult>
export async function updateFixedCost(id: string, formData: FixedCostFormData): Promise<ActionResult>
export async function deleteFixedCost(id: string): Promise<ActionResult>

// src/lib/actions/kpi-sync.ts
"use server"
export async function recalculateMonthlyKpi(businessId: string, yearMonth: string): Promise<void>

// 공통 ActionResult 타입
interface ActionResult {
  success: boolean;
  error?: string;
}
```

### 쿼리 함수 명세

```typescript
// src/lib/queries/business.ts
export async function getCurrentBusinessId(): Promise<string>

// src/lib/queries/revenue.ts
export async function getRevenues(businessId: string, yearMonth?: string): Promise<Revenue[]>

// src/lib/queries/expense.ts
export async function getExpenses(businessId: string, yearMonth?: string): Promise<Expense[]>

// src/lib/queries/fixed-cost.ts
export async function getFixedCosts(businessId: string): Promise<FixedCost[]>
```

### 커스텀 훅 명세

```typescript
// src/hooks/use-revenue-form.ts
// React Hook Form + zodResolver(RevenueSchema) 래핑
// 생성/수정 모드 전환, Server Action 호출, 상태 관리

// src/hooks/use-expense-form.ts
// React Hook Form + zodResolver(ExpenseSchema) 래핑
// 비용 유형별 카테고리 플레이스홀더 전환

// src/hooks/use-fixed-cost-form.ts
// React Hook Form + zodResolver(FixedCostSchema) 래핑
// is_labor 체크박스 상태 관리
```

### 사이드바 네비게이션 확장

```typescript
// src/app/(dashboard)/sidebar.tsx 수정
// navItems에 추가:
{ href: "/dashboard/revenue", label: "매출 관리", icon: TrendingUp },
{ href: "/dashboard/expense", label: "비용 관리", icon: Receipt },
{ href: "/dashboard/fixed-costs", label: "고정비 관리", icon: Building },
```

---

## Traceability (추적성)

| 요구사항 ID | 구현 파일                                              | 테스트 파일                                   |
| ----------- | ------------------------------------------------------ | --------------------------------------------- |
| REQ-01      | `revenue/page.tsx`, `revenue-form.tsx`, `revenue-table.tsx`, `actions/revenue.ts` | `__tests__/revenue/page.test.tsx`      |
| REQ-02      | `expense/page.tsx`, `expense-form.tsx`, `expense-table.tsx`, `actions/expense.ts` | `__tests__/expense/page.test.tsx`      |
| REQ-03      | `fixed-costs/page.tsx`, `fixed-cost-form.tsx`, `fixed-cost-table.tsx`, `actions/fixed-cost.ts` | `__tests__/fixed-costs/page.test.tsx` |
| REQ-04      | `revenue-table.tsx`, `expense-table.tsx`, `month-picker.tsx` | `__tests__/components/data-table.test.tsx` |
| REQ-05      | `actions/kpi-sync.ts`, `queries/revenue.ts`, `queries/expense.ts`, `queries/fixed-cost.ts` | `__tests__/actions/kpi-sync.test.ts` |
| REQ-06      | `sidebar.tsx`                                          | `__tests__/dashboard/sidebar.test.tsx`        |
| REQ-07      | `actions/revenue.ts`, `actions/expense.ts`, `actions/fixed-cost.ts` | `__tests__/actions/server-actions.test.ts` |

<!-- TAG: SPEC-DATA-001 -->
