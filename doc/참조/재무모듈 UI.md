# sajang.ai 화면기획서 — 재무 모듈 전체 UI 명세

> **버전**: v1.0 (2026.04.05)
> **대상**: Claude Code 개발용 — 화면 단위 기능명세
> **스택**: Next.js 15 App Router + TailwindCSS + shadcn/ui + Recharts + React Hook Form + Zod
> **디자인 톤**: Warm Neutral (배경 #FAFAF7, 테두리 #E8E6DF) + Indigo 포인트 (#6366F1)
> **폰트**: Pretendard (본문) + DM Mono (숫자/금액)

---

## 전체 화면 구조

```
앱 구조 (App Router)

src/app/
├── (auth)/
│   ├── login/                    # S-0.1 로그인
│   └── signup/                   # S-0.2 회원가입
├── onboarding/                   # S-1 온보딩 (4단계)
├── (dashboard)/
│   ├── page.tsx                  # S-2 메인 대시보드
│   ├── transactions/
│   │   ├── page.tsx              # S-3 거래 목록
│   │   └── new/page.tsx          # S-4 거래 입력
│   ├── report/page.tsx           # S-5 AI 리포트
│   ├── simulation/page.tsx       # S-6 시뮬레이션
│   ├── csv/page.tsx              # S-7 CSV 업로드
│   ├── notifications/page.tsx    # S-8 알림
│   ├── loans/page.tsx            # S-9 대출 관리
│   ├── payroll/page.tsx          # S-10 인건비 관리
│   ├── invoices/page.tsx         # S-11 계산서 관리
│   ├── vendors/page.tsx          # S-12 거래처 관리
│   ├── budget/page.tsx           # S-13 예산 관리
│   └── settings/page.tsx         # S-14 설정
└── api/
    ├── ai/                       # AI 분석 API Route
    ├── transactions/             # 거래 CRUD API
    ├── kpi/                      # KPI 계산 API
    └── csv/                      # CSV 파싱 API
```

### 글로벌 레이아웃

```
┌──────────────────────────────────┐
│  Header (sticky)                 │
│  로고 sajang.ai    [🔔알림] [👤] │
├──────────────────────────────────┤
│                                  │
│  Content Area                    │
│  (각 화면 컨텐츠)                │
│                                  │
│                                  │
│                                  │
│                                  │
├──────────────────────────────────┤
│  Bottom Nav (fixed)              │
│  📊홈  ✏️입력  📋내역  🤖AI  ⚙️설정│
└──────────────────────────────────┘
```

**Header 컴포넌트** (`src/components/layout/header.tsx`):
- 좌: 로고 "sajang.ai" (DM Mono, Indigo, font-weight 800)
- 우: 알림 벨 아이콘 (미읽음 카운트 빨간 뱃지), 프로필 아바타
- sticky top-0, 배경 white/95% + backdrop-blur

**Bottom Nav** (`src/components/layout/bottom-nav.tsx`):
- 5개 탭: 홈, 입력, 내역, AI, 설정
- fixed bottom-0, 활성 탭은 Indigo 컬러 + bold
- 안전영역(safe-area) 대응: pb-safe

---

## S-1. 온보딩

**경로**: `/onboarding`
**진입 조건**: 신규 가입 후 첫 접속 시 (user_settings.onboarding_complete = false)
**컴포넌트**: `src/app/onboarding/page.tsx`

### S-1.1 업종 선택 (Step 1/4)

```
┌──────────────────────────────────┐
│  ████░░░░░░░░░░░░  Step 1/4     │
│                                  │
│  사장님, 환영합니다! 👋           │
│  업종을 선택해주세요.             │
│  맞춤 분석 기준이 설정됩니다.     │
│                                  │
│  ┌────────────────────────────┐  │
│  │ ☕ 카페                     │  │
│  │    커피/음료/디저트          │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🍽️ 식당                    │  │
│  │    한식/중식/양식/일식       │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🍰 베이커리                 │  │
│  │    빵/케이크/제과            │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🍺 주점                     │  │
│  │    바/펍/포차                │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🏪 기타 F&B                 │  │
│  └────────────────────────────┘  │
│                                  │
│         [ 다음 → ]               │
└──────────────────────────────────┘
```

**동작**:
- 업종 카드 선택 시 border: 2px solid Indigo + 배경 EEF2FF
- 선택하지 않으면 "다음" 버튼 비활성(opacity 0.5)
- 선택값 → `user_settings.industry` 저장
- 업종별 `IndustryBenchmark` 기준값 자동 설정

**DB 연동**:
```sql
UPDATE user_settings SET industry = $1, onboarding_step = 2 WHERE user_id = $2;
```

### S-1.2 카테고리 확인 (Step 2/4)

```
┌──────────────────────────────────┐
│  ████████░░░░░░░░  Step 2/4     │
│                                  │
│  카테고리 확인 📂                 │
│  카페 기본값이 설정되었습니다.     │
│  필요시 수정하세요.               │
│                                  │
│  ── 매출 ─────────────────────   │
│  [매장] [테이크아웃] [배민]       │
│  [쿠팡이츠] [요기요] [+ 추가]    │
│                                  │
│  ── 고정비용 ─────────────────   │
│  [월세] [관리비] [대출이자]       │
│  [보험료] [통신비] [+ 추가]      │
│                                  │
│  ── 인건비 ───────────────────   │
│  [고정알바] [단기알바] [+ 추가]  │
│                                  │
│  ── 식자재 ───────────────────   │
│  [커피원두] [유제품] [시럽]       │
│  [+ 추가]                        │
│                                  │
│  ... (소모품, 운영비 등)          │
│                                  │
│      [ ← 이전 ]  [ 다음 → ]      │
└──────────────────────────────────┘
```

**동작**:
- 업종별 프리셋이 자동 채워져 있음 (PRESETS[industry])
- 각 소분류 칩에 X 버튼 → 삭제
- [+ 추가] → 인라인 텍스트 입력 → Enter로 추가
- 대분류 추가는 최하단에 "대분류 추가" 버튼
- 확인 시 → `categories` 테이블에 bulk insert

**DB 연동**:
```sql
INSERT INTO categories (user_id, type, major_category, minor_category, sort_order)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT DO NOTHING;
```

### S-1.3 데이터 임포트 (Step 3/4)

```
┌──────────────────────────────────┐
│  ████████████░░░░  Step 3/4     │
│                                  │
│  기존 데이터가 있으신가요? 📎     │
│  엑셀 가계부를 업로드하면         │
│  자동으로 가져옵니다.             │
│                                  │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │                            │  │
│  │    📎 엑셀 파일 업로드      │  │
│  │    .xlsx, .xlsm, .csv 지원 │  │
│  │                            │  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│         (dashed border)          │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 건너뛰기 — 처음부터 시작    │  │
│  └────────────────────────────┘  │
│                                  │
│      [ ← 이전 ]  [ 다음 → ]      │
└──────────────────────────────────┘
```

**동작**:
- 파일 업로드 → 파일 형식 자동 감지
- 디어나 가계부(.xlsm) 감지 시: 전용 파서로 정확한 데이터 추출
- 범용 .xlsx/.csv: 컬럼 매핑 UI 표시
- 업로드 중: 프로그레스 바 + "123건 처리 중..."
- 건너뛰기 → Step 4로 바로 이동
- 임포트 완료 시 결과 요약 표시: "거래 245건, 거래처 12개 가져왔습니다"

### S-1.4 완료 (Step 4/4)

```
┌──────────────────────────────────┐
│  ████████████████  Step 4/4     │
│                                  │
│            🎉                    │
│                                  │
│     설정 완료!                    │
│                                  │
│  사장님의 AI 경영 비서가          │
│  준비되었습니다.                  │
│  첫 거래를 입력하고               │
│  생존 점수를 확인해보세요.        │
│                                  │
│     [ 시작하기 → ]               │
│                                  │
└──────────────────────────────────┘
```

**동작**:
- `user_settings.onboarding_complete = true` 업데이트
- "시작하기" → 대시보드(`/`)로 리다이렉트

---

## S-2. 메인 대시보드

**경로**: `/` (dashboard/page.tsx)
**컴포넌트**: `src/components/dashboard/`

### 와이어프레임

```
┌──────────────────────────────────┐
│  sajang.ai              [🔔][👤] │
├──────────────────────────────────┤
│                                  │
│  ⚠️ 현 추세 시 2개월 후 현금부족  │
│  예상됩니다             [자세히]  │
│                                  │
│  ┌──────────────────────────┐    │
│  │  생존 점수                │    │
│  │     ╭───────╮            │    │
│  │     │  72   │  B등급     │    │
│  │     ╰───────╯            │    │
│  │  수익성 양호 · 고정비 주의 │    │
│  │  인건비 적정 · 유동성 위험 │    │
│  └──────────────────────────┘    │
│                                  │
│  ┌──────────┐  ┌──────────┐      │
│  │ 총 매출   │  │ 총 매입   │      │
│  │ 1,240만   │  │ 890만    │      │
│  │ ▲ +11%   │  │ ▲ +10%   │      │
│  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐      │
│  │ 순수익    │  │ 일평균    │      │
│  │ 350만     │  │ 41.3만   │      │
│  │ 률 28%   │  │ BEP 112% │      │
│  └──────────┘  └──────────┘      │
│                                  │
│  ── 매출 채널 랭킹 ──── 4월 ──   │
│  1. 매장      520만 (42%) ████   │
│  2. 배민      280만 (23%) ███    │
│  3. 쿠팡이츠  190만 (15%) ██     │
│  4. 테이크아웃 140만 (11%) █     │
│  5. 요기요     80만  (6%) █      │
│                                  │
│  ── 매입 카테고리 ─── [대분류▾]  │
│  1. 고정비용   320만 (36%) ████  │
│  2. 인건비     240만 (27%) ███   │
│  3. 식자재     180만 (20%) ██    │
│  4. 소모품      60만  (7%) █     │
│  5. 수수료      50만  (6%) █     │
│                                  │
│  ── 일별 매출 추이 ────────────  │
│  │    ▄  ▄▄ ▄ ▄▄▄▄             │
│  │▄▄▄████████████▄▄▄▄▄▄        │
│  │                              │
│  1    5    10   15   20         │
│  ■ 평균 이상  □ 평균 이하  ● 오늘│
│                                  │
│  ── 순수익 vs 매입 ────────────  │
│  │  ╭────╮  │                   │
│  │  │ 28%│  │  순수익  350만    │
│  │  ╰────╯  │  총매입  890만    │
│                                  │
├──────────────────────────────────┤
│  📊홈  ✏️입력  📋내역  🤖AI  ⚙️설정│
└──────────────────────────────────┘
```

### 컴포넌트 분해

| 컴포넌트 | 파일 | 데이터 소스 | 비고 |
|---------|------|-----------|------|
| AlertBanner | `dashboard/alert-banner.tsx` | notifications API | severity=critical만 표시 |
| SurvivalGauge | `dashboard/survival-gauge.tsx` | KPI calculate_survival_score | SVG 반원 게이지 |
| KPICardGrid | `dashboard/kpi-cards.tsx` | KPI calculate_monthly_kpi | 2x2 그리드 |
| RevenueRanking | `dashboard/revenue-ranking.tsx` | KPI calculate_category_ranking | 수평 바 차트 |
| ExpenseRanking | `dashboard/expense-ranking.tsx` | KPI calculate_category_ranking | 드릴다운 Select |
| DailyChart | `dashboard/daily-chart.tsx` | KPI calculate_daily_cumulative | Recharts BarChart |
| ProfitDonut | `dashboard/profit-donut.tsx` | KPI 순수익 비율 | Recharts PieChart |

### 데이터 페칭

```typescript
// src/app/(dashboard)/page.tsx
export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [kpi, ranking, daily, alerts] = await Promise.all([
    supabase.rpc('calculate_monthly_kpi', {
      p_user_id: user.id,
      p_year: new Date().getFullYear(),
      p_month: new Date().getMonth() + 1,
    }),
    supabase.rpc('calculate_category_ranking', {
      p_user_id: user.id,
      p_year: new Date().getFullYear(),
      p_month: new Date().getMonth() + 1,
      p_type: 'revenue',
    }),
    supabase.rpc('calculate_daily_cumulative', {
      p_user_id: user.id,
      p_year: new Date().getFullYear(),
      p_month: new Date().getMonth() + 1,
    }),
    supabase.from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return <DashboardContent kpi={kpi} ranking={ranking} daily={daily} alerts={alerts} />;
}
```

### KPI 카드 상세

| 카드 | 주요값 | 보조값 | 배경색 | 변동 표시 |
|------|--------|--------|--------|----------|
| 총 매출 | {totalRevenue}만 | 전월 대비 ±N% | #F0F9FF (Blue-50) | ▲/▼ 초록/빨강 |
| 총 매입 | {totalExpense}만 | 전월 대비 ±N% | #FFF7ED (Orange-50) | ▲ 빨강/▼ 초록 (반대) |
| 순수익 | {netProfit}만 | 순수익률 N% | #ECFDF5 (Green-50) | |
| 일평균 매출 | {dailyAvg}만 | BEP 달성률 N% | #FAFAF7 (Neutral) | |

**전월 대비 변동 계산**:
```typescript
const prevKpi = await supabase.rpc('calculate_monthly_kpi', {
  p_user_id: user.id,
  p_year: prevMonth.year,
  p_month: prevMonth.month,
});
const revenueChange = ((kpi.totalRevenue - prevKpi.totalRevenue) / prevKpi.totalRevenue * 100).toFixed(1);
```

### 매입 카테고리 드릴다운

드롭다운 셀렉트로 대분류별/소분류별 전환:

| 옵션 | 랭킹 대상 | API 파라미터 |
|------|----------|-------------|
| 대분류별 (기본) | 고정비용, 인건비, 식자재... | type=expense, level=major |
| 고정비용 상세 | 월세, 관리비, 대출이자... | type=expense, major=고정비용, level=minor |
| 인건비 상세 | 고정알바, 단기알바... | type=expense, major=인건비, level=minor |
| 식자재 상세 | 커피원두, 유제품... | type=expense, major=식자재, level=minor |

---

## S-3. 거래 목록

**경로**: `/transactions`
**컴포넌트**: `src/app/(dashboard)/transactions/page.tsx`

### 와이어프레임

```
┌──────────────────────────────────┐
│  거래 내역                 4월 ▾ │
│                                  │
│  [전체] [매출] [매입] [고정비]    │
│  [인건비] [식자재]               │
│                                  │
│  🔍 거래처, 내용 검색...          │
│                                  │
│  ── 04/03 ────────────────────   │
│  ↗ 매장 카드매출          +48.7만 │
│     04/03 · 매장                 │
│  ↙ 커피원두 납품          -32.0만 │
│     04/03 · 원두상사 · 식자재    │
│                                  │
│  ── 04/02 ────────────────────   │
│  ↗ 배민 정산              +31.2만 │
│     04/02 · 배민 · 배민          │
│  ↙ 일회용컵               -8.5만 │
│     04/02 · 패키지마트 · 소모품  │
│  ↙ 고정알바 급여         -120.0만 │
│     04/02 · 김OO · 인건비        │
│                                  │
│  ── 04/01 ────────────────────   │
│  ↗ 매장 카드매출          +52.3만 │
│  ↙ 월세                 -150.0만 │
│     04/01 · 건물주 · 고정비용    │
│  ↙ 관리비                -18.0만 │
│     04/01 · 관리사무소 · 고정비용│
│                                  │
│  ── 이번 달 합계 ──────────────  │
│  +1,240만 / -890만               │
│                                  │
│         [ 더 보기 ▾ ]            │
└──────────────────────────────────┘
```

### 상세 명세

**필터 칩**:
- 전체 / 매출 / 매입 / 고정비 / 인건비 / 식자재 / 소모품 / 마케팅 / 수수료
- 수평 스크롤, 활성 칩: Indigo border + 배경
- 복수 선택 불가 (단일 선택)

**기간 선택**:
- 우상단 "4월 ▾" 클릭 → 월 선택 바텀시트
- 연도 전환도 가능

**검색**:
- 거래처명, 내용 텍스트 검색
- debounce 300ms
- `WHERE content ILIKE '%keyword%' OR vendor ILIKE '%keyword%'`

**거래 항목 표시**:
- 좌: 아이콘 (매출 ↗ 초록배경 / 매입 ↙ 주황배경)
- 중: 내용(bold), 날짜 · 거래처 · 카테고리(소분류)
- 우: 금액 (매출 +초록, 매입 -빨강, DM Mono)

**스와이프 액션** (모바일):
- 좌 스와이프: 삭제 (빨간 배경, 확인 다이얼로그)
- 우 스와이프: 수정 (파란 배경, 수정 화면으로 이동)

**날짜별 그룹핑**:
- 날짜 구분선에 일자 표시
- 무한 스크롤 (페이지네이션 cursor 기반)

**API**:
```
GET /api/transactions?
  year=2026&
  month=4&
  category_major=식자재&
  search=원두&
  cursor=uuid&
  limit=20
```

---

## S-4. 거래 입력

**경로**: `/transactions/new` (신규) / `/transactions/[id]/edit` (수정)
**컴포넌트**: `src/app/(dashboard)/transactions/new/page.tsx`

### 와이어프레임

```
┌──────────────────────────────────┐
│  거래 입력                       │
│                                  │
│  ┌──────────────────────────┐    │
│  │ [ 매입 (지출) | 매출 (수입) ] │
│  └──────────────────────────┘    │
│                                  │
│  날짜 *                          │
│  ┌──────────────────────────┐    │
│  │ 2026-04-04           📅  │    │
│  └──────────────────────────┘    │
│                                  │
│  매입 금액 *                     │
│  ┌──────────────────────────┐    │
│  │                320,000 원 │    │
│  └──────────────────────────┘    │
│                                  │
│  대분류 *                        │
│  [고정비용] [세금] [인건비]       │
│  [식자재✓] [소모품] [운영비]     │
│  [마케팅] [수수료]               │
│                                  │
│  소분류 *        (식자재 선택시)  │
│  [커피원두✓] [유제품] [시럽]     │
│                                  │
│  거래처                          │
│  ┌──────────────────────────┐    │
│  │ 원두상사              🔍  │    │
│  └──────────────────────────┘    │
│  ┌ 추천: 원두상사, 원두나라 ─┐   │
│  └──────────────────────────┘    │
│                                  │
│  내용                            │
│  ┌──────────────────────────┐    │
│  │ 커피원두 납품              │    │
│  └──────────────────────────┘    │
│                                  │
│  결제방법           태그         │
│  ┌──────────┐  ┌──────────┐      │
│  │ 카드1  ▾ │  │ 선택   ▾ │      │
│  └──────────┘  └──────────┘      │
│                                  │
│  ┌──────────────────────────┐    │
│  │       저장하기             │    │
│  └──────────────────────────┘    │
│                                  │
│  ── 빠른 입력 (반복 거래) ─────  │
│  [⚡월세 150만] [⚡관리비 20만]  │
│  [⚡고정알바 120만] [⚡원두 32만] │
│                                  │
└──────────────────────────────────┘
```

### 상세 명세

**매입/매출 토글**:
- 세그먼트 컨트롤 (shadcn/ui Tabs)
- 전환 시: 금액 필드 라벨 변경, 대분류 목록 변경, 결제방법 목록 변경
- 매입 선택 시: 대분류 = [고정비용, 세금, 인건비, 식자재, 소모품, 운영비, 마케팅, 대표교육비, 수수료]
- 매출 선택 시: 대분류 = [매출] (고정), 소분류만 선택

**금액 입력**:
- 숫자 키패드 자동 표시
- 천단위 콤마 실시간 포맷팅
- "원" suffix 고정 표시
- 오른쪽 정렬, DM Mono 18px bold

**대분류/소분류 선택**:
- 칩 버튼 방식 (Wrap)
- 대분류 선택 → 소분류 영역 slide-down 애니메이션
- 선택된 칩: Indigo border + 배경
- 카테고리 목록: `categories` 테이블에서 user_id로 조회

**거래처 자동완성**:
- 입력 시 `vendors` 테이블에서 ILIKE 검색
- 과거 트랜잭션의 vendor에서도 검색
- 드롭다운으로 추천 표시
- 신규 거래처는 자동 등록

**빠른 입력 프리셋**:
- `recurring_transactions` 테이블에서 조회
- 탭 하면 해당 데이터로 폼 자동 채움
- 날짜만 오늘로 설정

**유효성 검사** (React Hook Form + Zod):
```typescript
const transactionSchema = z.object({
  date: z.date(),
  debit: z.number().min(0).optional(),
  credit: z.number().min(0).optional(),
  category_major: z.string().min(1, '대분류를 선택하세요'),
  category_minor: z.string().min(1, '소분류를 선택하세요'),
  vendor: z.string().max(100).optional(),
  content: z.string().max(200).optional(),
  payment_method: z.string().optional(),
  tag: z.string().max(50).optional(),
}).refine(
  data => (data.debit && data.debit > 0) || (data.credit && data.credit > 0),
  { message: '금액을 입력하세요' }
).refine(
  data => !(data.debit && data.debit > 0 && data.credit && data.credit > 0),
  { message: '매입과 매출을 동시에 입력할 수 없습니다' }
);
```

**저장 후 동작**:
- 성공 토스트: "거래가 저장되었습니다"
- KPI 캐시 무효화 (revalidatePath)
- 알림 규칙 트리거 체크 (예산 초과 등)
- 폼 초기화 (연속 입력 가능)

---

## S-5. AI 리포트

**경로**: `/report`
**컴포넌트**: `src/app/(dashboard)/report/page.tsx`

### 와이어프레임

```
┌──────────────────────────────────┐
│  AI 리포트                       │
│  2026년 3월 월간 분석            │
│                                  │
│  ┌─── 그라데이션 히어로 카드 ──┐ │
│  │  3월 생존 점수               │ │
│  │  ┌─────┐                    │ │
│  │  │  72  │  B등급             │ │
│  │  └─────┘                    │ │
│  │  전월 대비 +5점 상승         │ │
│  └─────────────────────────────┘ │
│                                  │
│  ┌─── AI 분석 ──────────────┐    │
│  │ 🤖 사장님께 드리는 분석    │    │
│  │                           │    │
│  │ 3월 매출 1,240만원으로     │    │
│  │ 전월 대비 11% 상승.        │    │
│  │ 배민 채널이 28% 증가.      │    │
│  │                           │    │
│  │ ⚠️ 식자재비 전월 대비      │    │
│  │ 32% 증가. 원두 단가 상승   │    │
│  │ 추정. 업체 비교 권장.      │    │
│  │                           │    │
│  │ 현재 잔액 기준 약 4.5개월  │    │
│  │ 운영 가능. 지난달보다      │    │
│  │ 0.5개월 감소.              │    │
│  └───────────────────────────┘    │
│                                  │
│  ┌─── 추천 액션 ─────────────┐   │
│  │ 💡                          │   │
│  │ ① 식자재 납품업체 비교      │   │
│  │   원두 단가 협상   [시뮬→]  │   │
│  │ ② 배민 광고 유지            │   │
│  │   현 ROI 양호               │   │
│  │ ③ 예비비 확보               │   │
│  │   6개월 목표      [시뮬→]   │   │
│  └─────────────────────────────┘  │
│                                  │
│  ┌─── 사장님 질문하기 ───────┐   │
│  │ 💬                         │   │
│  │ [이번달 배민매출?]          │   │
│  │ [식자재비 왜 올랐어?]      │   │
│  │ [알바 줄이면?]             │   │
│  │ [손익분기점?]              │   │
│  │                            │   │
│  │ ┌───────────────┐ [전송]  │   │
│  │ │ 궁금한 점...    │         │   │
│  │ └───────────────┘          │   │
│  └────────────────────────────┘   │
│                                  │
│  ── 리포트 이력 ───────────────  │
│  • 3월 월간 리포트  2026.04.01   │
│  • 2월 월간 리포트  2026.03.01   │
│  • 1월 월간 리포트  2026.02.01   │
│                                  │
└──────────────────────────────────┘
```

### AI 리포트 생성 API

```typescript
// src/app/api/ai/report/route.ts
export async function POST(req: Request) {
  const { userId, year, month, type } = await req.json();
  // type: 'daily' | 'weekly' | 'monthly'

  const context = await buildFinancialContext(userId, year, month);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: FINANCIAL_AGENT_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `다음 재무 데이터를 분석하여 ${type === 'monthly' ? '월간' : '일간'} 리포트를 작성해주세요.\n\n${JSON.stringify(context)}`
      }
    ],
  });

  return Response.json({ report: response.content[0].text });
}
```

### 자연어 질의 (채팅 인터페이스)

```typescript
// src/app/api/ai/chat/route.ts — function calling 지원
const tools = [
  {
    name: 'get_monthly_kpi',
    description: '특정 월의 매출/매입/순수익 KPI를 조회',
    input_schema: {
      type: 'object',
      properties: {
        year: { type: 'number' },
        month: { type: 'number' },
      },
      required: ['year', 'month'],
    },
  },
  {
    name: 'get_category_detail',
    description: '특정 카테고리의 상세 금액 조회',
    input_schema: {
      type: 'object',
      properties: {
        category_major: { type: 'string' },
        category_minor: { type: 'string' },
        year: { type: 'number' },
        month: { type: 'number' },
      },
      required: ['year', 'month'],
    },
  },
  {
    name: 'run_simulation',
    description: '가상 시나리오를 실행하여 영향 분석',
    input_schema: {
      type: 'object',
      properties: {
        scenario_type: { type: 'string', enum: ['reduce_staff', 'revenue_change', 'rent_change', 'cut_category'] },
        params: { type: 'object' },
      },
      required: ['scenario_type', 'params'],
    },
  },
  {
    name: 'compare_periods',
    description: '두 기간의 KPI를 비교',
    input_schema: {
      type: 'object',
      properties: {
        period1: { type: 'object', properties: { year: { type: 'number' }, month: { type: 'number' } } },
        period2: { type: 'object', properties: { year: { type: 'number' }, month: { type: 'number' } } },
      },
      required: ['period1', 'period2'],
    },
  },
];
```

---

## S-6. 시뮬레이션

**경로**: `/simulation`
**컴포넌트**: `src/app/(dashboard)/simulation/page.tsx`

### 와이어프레임

```
┌──────────────────────────────────┐
│  시뮬레이션 🧪                   │
│  현재 데이터 기반 가상 테스트     │
│                                  │
│  ┌───────┐  ┌───────┐           │
│  │ 👤     │  │ 📉     │           │
│  │ 직원   │  │ 매출   │           │
│  │ 줄이기 │  │ 감소   │           │
│  └───────┘  └───────┘           │
│  ┌───────┐  ┌───────┐           │
│  │ 🏠     │  │ 🛵     │           │
│  │ 월세   │  │ 배달앱 │           │
│  │ 변경   │  │ 추가   │           │
│  └───────┘  └───────┘           │
│  ┌───────┐  ┌───────┐           │
│  │ 🥬     │  │ 💰     │           │
│  │ 식자재 │  │ 가격   │           │
│  │ 절감   │  │ 인상   │           │
│  └───────┘  └───────┘           │
│                                  │
│  ═══ 시나리오 선택 후 ═══════    │
│                                  │
│  ── 파라미터 입력 ─────────────  │
│  직원 감축 인원: [1명 ▾]         │
│  (현재 고정알바 3명)             │
│                                  │
│  ── 결과 비교 ─────────────────  │
│  ┌──────────┐  →  ┌──────────┐  │
│  │  현재     │     │  예상     │  │
│  │  350만    │     │  470만    │  │
│  │  순수익   │     │  +120만   │  │
│  └──────────┘     └──────────┘  │
│                                  │
│  생존 점수: 72 → 80 (+8)        │
│  순수익률:  28% → 38%           │
│                                  │
│  ┌─── AI 분석 ──────────────┐   │
│  │ 🤖 인건비 절감 효과는     │   │
│  │ 크지만, 피크타임 서비스    │   │
│  │ 품질 저하 가능성을         │   │
│  │ 고려하세요.                │   │
│  └───────────────────────────┘   │
│                                  │
└──────────────────────────────────┘
```

### 시나리오별 파라미터 입력 UI

| 시나리오 | 파라미터 | UI 컴포넌트 | 범위 |
|---------|---------|-----------|------|
| 직원 줄이기 | 감축 인원 | 숫자 스테퍼 | 1~현재 인원 |
| 매출 변동 | 변동률 (%) | 슬라이더 + 입력 | -50% ~ +50% |
| 월세 변경 | 새 월세 금액 | 금액 입력 | 0 ~ 무제한 |
| 배달앱 추가 | 플랫폼 선택 | 드롭다운 | 미등록 플랫폼 목록 |
| 식자재 절감 | 절감률 (%) | 슬라이더 | 5% ~ 50% |
| 가격 인상 | 인상률 (%) | 슬라이더 + 입력 | 1% ~ 30% |

### 결과 표시

Before/After 카드 나란히 배치:
- 순수익 변화 (금액 + 증감)
- 생존 점수 변화 (점수 + 증감)
- 순수익률 변화 (% + 증감)
- 현금 고갈 예상 변화 (개월 수)

AI 분석 코멘트: 시뮬레이션 결과를 Claude API로 해석하여 실질적 조언 제공.

---

## S-7. CSV 업로드

**경로**: `/csv`
**컴포넌트**: `src/app/(dashboard)/csv/page.tsx`

### 플로우

```
Step 1: 업로드        Step 2: 분류 확인      Step 3: 완료
┌──────────┐         ┌──────────────┐       ┌──────────┐
│  📄 파일  │  ───→  │ 분류 결과     │  ───→ │  ✓ 완료  │
│  드래그   │         │ 테이블       │       │  5건 등록 │
│  & 드롭  │         │ (수정 가능)   │       │          │
└──────────┘         └──────────────┘       └──────────┘
```

### Step 2: 분류 확인 테이블 상세

```
┌──────────────────────────────────┐
│  ✓ 카드사 명세서 감지됨           │
│  5건 파싱 · 자동 분류 적용        │
│                                  │
│  ┌ 스타벅스원두도매 ────────────┐ │
│  │ -32.0만  04/01              │ │
│  │ → [식자재 › 커피원두]  95%  │ │
│  └─────────────────────────────┘ │
│                                  │
│  ┌ GS25 잠실점 ───── ⚠️노란 ──┐ │
│  │ -1.3만   04/01              │ │
│  │ → [소모품 › 사무용품]  45%  │ │
│  │ 다른 분류: [운영비] [마케팅] │ │
│  └─────────────────────────────┘ │
│                                  │
│  ┌ 배달의민족 정산 ────────────┐ │
│  │ +31.2만  04/02              │ │
│  │ → [매출 › 배민]        98%  │ │
│  └─────────────────────────────┘ │
│                                  │
│       [ 5건 일괄 등록 ]          │
│                                  │
└──────────────────────────────────┘
```

**분류 확인 규칙**:
- 신뢰도 80%+: 초록 뱃지, 수정 불필요
- 신뢰도 60~79%: 회색 뱃지, 확인 권장
- 신뢰도 60% 미만: 노란 배경 + 경고 뱃지, 대안 분류 버튼 표시

**대안 분류 선택 시**:
- 해당 행의 카테고리를 변경
- 변경 이력을 `classification_feedback` 테이블에 저장 → 학습 데이터

---

## S-8. 알림

**경로**: `/notifications`
**컴포넌트**: `src/app/(dashboard)/notifications/page.tsx`

### 알림 카드 디자인

| 심각도 | 배경색 | 테두리 | 뱃지 |
|--------|--------|--------|------|
| critical (긴급) | #FEF2F2 | #FECACA | 빨강 "긴급" |
| warning (주의) | #FFFBEB | #FDE68A | 노랑 "주의" |
| info (알림) | #EFF6FF | #BFDBFE | 파랑 "알림" |

**각 알림 카드 구성**:
- 뱃지 + 제목 + 시간 (우상단)
- 메시지 본문
- 액션 버튼: [자세히 보기] [해제]
- "자세히 보기" → 관련 화면으로 이동 (대시보드/시뮬레이션 등)

**알림 목록 정렬**: 최신순, 미읽음 우선

---

## S-9. 대출 관리

**경로**: `/loans`

```
┌──────────────────────────────────┐
│  대출 관리 🏦                    │
│                                  │
│  총 대출잔액     총 누적이자      │
│  9,898만         323만           │
│                                  │
│  ┌─── 담보대출 ───────────────┐  │
│  │ A은행 · 변동금리 4.3%      │  │
│  │ 원금 1억 → 잔액 9,898만    │  │
│  │ ████████████████░░ 99%     │  │
│  │ 월 납입 49.5만 · 매월 7일  │  │
│  │            [상환 기록 →]   │  │
│  └────────────────────────────┘  │
│                                  │
│  [+ 대출 추가]                   │
│                                  │
│  ── 상환 기록 ─────────────────  │
│  04/01  상환원금 2만 / 이자 12만 │
│  03/04  상환원금 100만 / 이자 20만│
│                                  │
│  [+ 상환 기록 추가]              │
│                                  │
└──────────────────────────────────┘
```

---

## S-10. 인건비 관리

**경로**: `/payroll`

```
┌──────────────────────────────────┐
│  인건비 관리 👥                   │
│                                  │
│  ── 월별 요약 ─────── 4월 ▾ ──  │
│  지급액(세전)  공제액   실지급    │
│  240만        24만     216만     │
│                                  │
│  ── 급여 기록 ─────────────────  │
│  ┌────────────────────────────┐  │
│  │ 김OO · 고정알바             │  │
│  │ 04/10 · 세전 120만          │  │
│  │ 공제 12만 → 실지급 108만    │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 이OO · 고정알바             │  │
│  │ 04/10 · 세전 120만          │  │
│  │ 공제 12만 → 실지급 108만    │  │
│  └────────────────────────────┘  │
│                                  │
│  [+ 급여 기록 추가]              │
│                                  │
└──────────────────────────────────┘
```

---

## S-11. 계산서 관리

**경로**: `/invoices`

```
┌──────────────────────────────────┐
│  계산서 관리 📄                   │
│                                  │
│  미발행 3건 · 미발행 합계 580만   │
│                                  │
│  [매출 세금계산서] [매입 세금계산서]│
│                                  │
│  ── 매출 세금계산서 ───────────  │
│  ┌────────────────────────────┐  │
│  │ 04/02 · A업체               │  │
│  │ 공급가 200만 / 세액 20만    │  │
│  │ 합계 220만     [미발행 ⚠️]  │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 04/01 · B업체               │  │
│  │ 공급가 150만 / 세액 15만    │  │
│  │ 합계 165만     [발행완료 ✓] │  │
│  └────────────────────────────┘  │
│                                  │
│  [+ 계산서 추가]                  │
│                                  │
└──────────────────────────────────┘
```

---

## S-12. 거래처 관리

**경로**: `/vendors`

```
┌──────────────────────────────────┐
│  거래처 관리 🏢                   │
│                                  │
│  🔍 거래처 검색...                │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 원두상사                    │  │
│  │ 식자재 · 010-1234-5678     │  │
│  │ 이번 달 거래: 64만원        │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 패키지마트                  │  │
│  │ 소모품 · 02-123-4567       │  │
│  │ 이번 달 거래: 17만원        │  │
│  └────────────────────────────┘  │
│                                  │
│  [+ 거래처 추가]                  │
│                                  │
└──────────────────────────────────┘
```

---

## S-13. 예산 관리

**경로**: `/budget`

```
┌──────────────────────────────────┐
│  예산 관리 📊         2026년     │
│                                  │
│  ── 이번 달 달성률 ────────────  │
│                                  │
│  매출    목표 1,500만            │
│  ████████████████░░░░ 83%        │
│  현재 1,240만                    │
│                                  │
│  고정비용  목표 300만             │
│  ████████████████████████ 107%⚠️ │
│  현재 320만 (20만 초과)          │
│                                  │
│  인건비   목표 250만             │
│  ████████████████████░░ 96%      │
│  현재 240만                      │
│                                  │
│  식자재   목표 150만             │
│  ████████████████████████ 120%⚠️ │
│  현재 180만 (30만 초과)          │
│                                  │
│  ── 월별 예산 설정 ────────────  │
│                                  │
│       1월   2월   3월   4월 ...  │
│  매출  1500  1500  1500  1500    │
│  고정  300   300   300   300     │
│  인건  250   250   250   250     │
│  식자  150   150   150   150     │
│  ...                             │
│                                  │
│  [저장]                           │
│                                  │
└──────────────────────────────────┘
```

---

## S-14. 설정

**경로**: `/settings`

### 설정 화면 구성

```
┌──────────────────────────────────┐
│  설정 ⚙️                         │
│                                  │
│  ── 사업장 정보 ───────────────  │
│  업종          카페 ☕            │
│  사용 연도     2026년            │
│  업종 기준값   카페 프리셋 적용중 │
│                                  │
│  ── 카테고리 관리 ──── [+ 추가]  │
│  ┌ 매출 ──────────────────────┐  │
│  │ [매장] [테이크아웃] [배민]  │  │
│  │ [쿠팡이츠] [요기요]        │  │
│  └────────────────────────────┘  │
│  ┌ 고정비용 ──────────────────┐  │
│  │ [월세] [관리비] [대출이자]  │  │
│  │ [보험료] [통신비]           │  │
│  └────────────────────────────┘  │
│  ...                             │
│                                  │
│  ── 반복 거래 ────── [+ 추가]   │
│  ⚡ 월세 150만        매월1일 🔵 │
│  ⚡ 관리비 20만       매월1일 🔵 │
│  ⚡ 고정알바 120만    매월10일 🔵│
│  ⚡ 대출 상환 49만    매월7일 🔵 │
│                                  │
│  ── 결제방법 관리 ─── [+ 추가]  │
│  매출: [카드] [지역화폐] [현금]  │
│  매입: [카드1] [카드2] [현금]    │
│                                  │
│  ── 데이터 관리 ───────────────  │
│  📥 엑셀 데이터 가져오기    ›    │
│  📤 데이터 내보내기          ›    │
│  📊 CSV 업로드               ›    │
│                                  │
│  ── 계정 ──────────────────────  │
│  비밀번호 변경               ›    │
│  로그아웃                    ›    │
│                                  │
└──────────────────────────────────┘
```

---

## 공통 컴포넌트

### 디자인 토큰

```typescript
// src/lib/design-tokens.ts
export const colors = {
  // Warm Neutral 베이스
  bg: {
    primary: '#FFFFFF',
    secondary: '#FAFAF7',
    tertiary: '#F1F0EB',
  },
  border: {
    default: '#E8E6DF',
    hover: '#D1CFC7',
    focus: '#6366F1',
  },
  text: {
    primary: '#3D3B35',
    secondary: '#5C5A53',
    tertiary: '#8C8A82',
    muted: '#A09E96',
  },
  // 기능 색상
  revenue: { bg: '#F0F9FF', border: '#BAE6FD', text: '#0C4A6E', accent: '#0369A1' },
  expense: { bg: '#FFF7ED', border: '#FED7AA', text: '#7C2D12', accent: '#C2410C' },
  profit: { bg: '#ECFDF5', border: '#A7F3D0', text: '#064E3B', accent: '#059669' },
  danger: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', accent: '#DC2626' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', accent: '#D97706' },
  indigo: { bg: '#EEF2FF', border: '#C7D2FE', text: '#4338CA', accent: '#6366F1' },
};

export const fonts = {
  sans: "'Pretendard', -apple-system, sans-serif",
  mono: "'DM Mono', monospace",
};
```

### 공통 UI 컴포넌트 목록

| 컴포넌트 | 파일 | 용도 |
|---------|------|------|
| Badge | `ui/badge.tsx` | 심각도/상태 뱃지 (critical/warning/info/success) |
| MiniBar | `ui/mini-bar.tsx` | 인라인 프로그레스 바 (랭킹용) |
| SurvivalGauge | `dashboard/survival-gauge.tsx` | SVG 반원 게이지 (0~100) |
| KPICard | `dashboard/kpi-card.tsx` | 매출/매입/순수익/일평균 카드 |
| CategoryChip | `input/category-chip.tsx` | 대분류/소분류 선택 칩 |
| AmountInput | `input/amount-input.tsx` | 금액 입력 (천단위 콤마, 원 suffix) |
| TransactionRow | `transactions/transaction-row.tsx` | 거래 목록 행 |
| AlertCard | `notifications/alert-card.tsx` | 알림 카드 |
| MonthPicker | `ui/month-picker.tsx` | 연/월 선택 바텀시트 |
| EmptyState | `ui/empty-state.tsx` | 데이터 없을 때 안내 |

---

## 상태 관리 (Zustand)

```typescript
// src/stores/dashboard-store.ts
interface DashboardStore {
  // 현재 선택된 기간
  selectedYear: number;
  selectedMonth: number;
  setMonth: (year: number, month: number) => void;

  // 랭킹 드릴다운 상태
  expenseRankingLevel: 'major' | 'minor';
  expenseRankingMajor: string | null;
  setExpenseRankingDrilldown: (level: string, major?: string) => void;

  // 로딩 상태
  isLoading: boolean;
}

// src/stores/transaction-store.ts
interface TransactionStore {
  filter: {
    category: string | null;
    search: string;
    dateRange: { from: Date; to: Date };
  };
  setFilter: (filter: Partial<TransactionStore['filter']>) => void;
}
```

---

## API 라우트 요약

| 경로 | 메서드 | 설명 | 관련 화면 |
|------|--------|------|----------|
| `/api/transactions` | GET/POST | 거래 목록/생성 | S-3, S-4 |
| `/api/transactions/[id]` | PUT/DELETE | 거래 수정/삭제 | S-3 |
| `/api/transactions/bulk` | POST | 일괄 등록 (CSV) | S-7 |
| `/api/kpi/monthly` | GET | 월별 KPI | S-2 |
| `/api/kpi/ranking` | GET | 카테고리 랭킹 | S-2 |
| `/api/kpi/daily` | GET | 일별 누적매출 | S-2 |
| `/api/kpi/survival` | GET | 생존 점수 | S-2 |
| `/api/kpi/bep` | GET | 손익분기점 | S-2, S-5 |
| `/api/kpi/cash-prediction` | GET | 현금 고갈 예측 | S-2, S-5 |
| `/api/simulation` | POST | 시뮬레이션 실행 | S-6 |
| `/api/ai/report` | POST | AI 리포트 생성 | S-5 |
| `/api/ai/chat` | POST | 자연어 질의 | S-5 |
| `/api/csv/parse` | POST | CSV 파싱 + 분류 | S-7 |
| `/api/csv/import` | POST | 엑셀 임포트 | S-1.3, S-14 |
| `/api/notifications` | GET | 알림 목록 | S-8 |
| `/api/notifications/[id]` | PUT | 알림 읽음/해제 | S-8 |
| `/api/payroll` | GET/POST | 인건비 관리 | S-10 |
| `/api/loans` | GET/POST | 대출 관리 | S-9 |
| `/api/loans/repayments` | POST | 상환 기록 | S-9 |
| `/api/invoices` | GET/POST | 계산서 관리 | S-11 |
| `/api/vendors` | GET/POST | 거래처 관리 | S-12 |
| `/api/budgets` | GET/PUT | 예산 관리 | S-13 |
| `/api/categories` | GET/POST/PUT/DELETE | 카테고리 관리 | S-14 |
| `/api/settings` | GET/PUT | 사용자 설정 | S-14 |
| `/api/recurring` | GET/POST/PUT/DELETE | 반복 거래 | S-14 |

---

## 개발 우선순위 (Phase 0 MVP)

### 1순위 (Week 1~2): 코어 데이터 + 입력

- [ ] DB 마이그레이션 전체 (001~012)
- [ ] S-1 온보딩 (4단계)
- [ ] S-4 거래 입력 (폼 + 유효성 + 저장)
- [ ] S-3 거래 목록 (필터/검색/무한스크롤)
- [ ] 공통 레이아웃 (Header + Bottom Nav)

### 2순위 (Week 3~4): 대시보드 + KPI

- [ ] KPI SQL 함수 전체
- [ ] S-2 대시보드 (KPI 카드 + 생존점수 + 랭킹 + 차트)
- [ ] 생존 점수 계산 엔진
- [ ] 알림 규칙 엔진 (10종)

### 3순위 (Week 5~6): AI + 시뮬레이션

- [ ] S-5 AI 리포트 (리포트 생성 + 자연어 질의)
- [ ] S-6 시뮬레이션 (6종 시나리오)
- [ ] S-8 알림 화면

### 4순위 (Week 7~8): 부가 기능

- [ ] S-7 CSV 업로드 (파서 + 분류 + 확인 UI)
- [ ] S-9 대출 관리
- [ ] S-10 인건비 관리
- [ ] S-13 예산 관리
- [ ] S-14 설정 (카테고리/반복거래/결제방법)

### Phase 1 이후

- [ ] S-11 계산서 관리
- [ ] S-12 거래처 관리
- [ ] 엑셀 임포트/내보내기
- [ ] AI CSV 분류 (Claude API)
- [ ] 카카오톡 알림
- [ ] 캘린더 히트맵 차트
- [ ] 연도별 비교 분석
