# Data Schema

sajang.ai 데이터베이스 스키마 정의서.
Supabase (PostgreSQL) 기반.

---

## ER 다이어그램

```
auth.users (Supabase Auth)
    │
    │ 1:N
    ▼
businesses ─────┬───────┬───────┬────────────┬──────────
    │           │       │       │            │
    │ 1:N       │ 1:N   │ 1:N  │ 1:N        │ 1:N
    ▼           ▼       ▼      ▼            ▼
revenues   expenses  fixed_costs  monthly_summaries  csv_uploads
```

---

## 테이블 상세

### businesses (사업장)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | uuid | PK, default gen_random_uuid() | 사업장 ID |
| user_id | uuid | FK → auth.users, NOT NULL | 소유자 |
| name | text | NOT NULL | 사업장명 |
| business_type | text | nullable | 업종 (음식점, 카페, 소매 등) |
| address | text | nullable | 주소 |
| created_at | timestamptz | default now() | 생성일 |
| updated_at | timestamptz | default now(), 트리거 자동갱신 | 수정일 |

**인덱스**: `user_id`

---

### revenues (매출)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | uuid | PK | 매출 ID |
| business_id | uuid | FK → businesses, NOT NULL | 사업장 |
| date | date | NOT NULL | 매출 발생일 |
| channel | text | nullable | 채널 (카드, 현금, 배달앱, 온라인) |
| category | text | nullable | 카테고리 (메뉴, 상품군) |
| amount | numeric(12,0) | NOT NULL | 금액 (원) |
| memo | text | nullable | 메모 |
| created_at | timestamptz | default now() | 생성일 |

**인덱스**: `(business_id, date)`

---

### expenses (지출/매입)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | uuid | PK | 지출 ID |
| business_id | uuid | FK → businesses, NOT NULL | 사업장 |
| date | date | NOT NULL | 지출일 |
| type | text | NOT NULL, CHECK ('fixed', 'variable') | 고정비/변동비 |
| category | text | NOT NULL | 카테고리 (식재료, 포장재, 소모품 등) |
| amount | numeric(12,0) | NOT NULL | 금액 (원) |
| memo | text | nullable | 메모 |
| created_at | timestamptz | default now() | 생성일 |

**인덱스**: `(business_id, date)`

---

### fixed_costs (고정비)

월별 반복 비용. 임대료, 인건비, 보험, 통신비 등.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | uuid | PK | 고정비 ID |
| business_id | uuid | FK → businesses, NOT NULL | 사업장 |
| category | text | NOT NULL | 카테고리 |
| amount | numeric(12,0) | NOT NULL | 월 금액 (원) |
| is_labor | boolean | default false | 인건비 여부 (생존점수 계산용) |
| start_date | date | nullable | 적용 시작일 |
| end_date | date | nullable | 적용 종료일 (null = 현재 진행 중) |
| created_at | timestamptz | default now() | 생성일 |

**인덱스**: `business_id`

---

### monthly_summaries (월별 요약)

KPI 계산 결과 캐시. 매월 재계산.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | uuid | PK | 요약 ID |
| business_id | uuid | FK → businesses, NOT NULL | 사업장 |
| year_month | text | NOT NULL, UNIQUE(business_id, year_month) | 대상 월 ('2026-01') |
| total_revenue | numeric(12,0) | default 0 | 총 매출 |
| total_expense | numeric(12,0) | default 0 | 총 지출 (변동비) |
| total_fixed_cost | numeric(12,0) | default 0 | 총 고정비 |
| total_labor_cost | numeric(12,0) | default 0 | 총 인건비 |
| gross_profit | numeric(12,0) | default 0 | 매출총이익 |
| net_profit | numeric(12,0) | default 0 | 순이익 |
| gross_margin | numeric(5,2) | default 0 | 매출총이익률 (%) |
| labor_ratio | numeric(5,2) | default 0 | 인건비 비율 (%) |
| fixed_cost_ratio | numeric(5,2) | default 0 | 고정비 비율 (%) |
| survival_score | numeric(5,1) | default 0 | 생존 점수 (0~100) |
| calculated_at | timestamptz | default now() | 계산 시점 |

**인덱스**: `(business_id, year_month)`

---

### csv_uploads (CSV 업로드 이력)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | uuid | PK | 업로드 ID |
| business_id | uuid | FK → businesses, NOT NULL | 사업장 |
| file_name | text | nullable | 원본 파일명 |
| file_path | text | nullable | Supabase Storage 경로 |
| row_count | integer | nullable | 파싱된 행 수 |
| processed | boolean | default false | 처리 완료 여부 |
| created_at | timestamptz | default now() | 업로드일 |

---

## RLS 정책

모든 테이블에 Row Level Security 적용.

| 테이블 | 정책 | 조건 |
|--------|------|------|
| businesses | 본인 사업장만 | `auth.uid() = user_id` |
| revenues | 본인 사업장 매출만 | `business_id`가 본인 소유 |
| expenses | 본인 사업장 지출만 | `business_id`가 본인 소유 |
| fixed_costs | 본인 사업장 고정비만 | `business_id`가 본인 소유 |
| monthly_summaries | 본인 사업장 요약만 | `business_id`가 본인 소유 |
| csv_uploads | 본인 사업장 업로드만 | `business_id`가 본인 소유 |

---

## 마이그레이션

마이그레이션 파일 위치: `supabase/migrations/`

```bash
# Supabase CLI로 마이그레이션 실행
supabase db push
```

## KPI 계산 공식

| 지표 | 공식 |
|------|------|
| 매출총이익 | 총매출 - 총지출(변동비) |
| 순이익 | 매출총이익 - 총고정비 |
| 매출총이익률 | (매출총이익 / 총매출) × 100 |
| 인건비 비율 | (총인건비 / 총매출) × 100 |
| 고정비 비율 | (총고정비 / 총매출) × 100 |
| 생존 점수 | 순이익(30) + 매출총이익률(25) + 인건비비율(20) + 고정비비율(25) = 100점 만점 |
