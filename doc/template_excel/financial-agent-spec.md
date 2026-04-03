# sajang.ai 재무 에이전트 — 엑셀 가계부 흡수 스펙 문서

> **원본**: 디어나 사업자 가계부 ver3.0.4 (.xlsm, 약 3MB)
> **목적**: 소상공인(F&B) 유료 엑셀 가계부(5만원)의 모든 로직을 sajang.ai 재무 에이전트가 완벽히 대체하도록 모듈화
> **실행 주체**: Claude Code
> **대상 스택**: Next.js 15 + Supabase (PostgreSQL + RLS) + Vercel AI SDK + Claude API

---

## 1. 원본 엑셀 전체 구조 개요

### 1.1 시트 구성 (21개 시트, ~75,000개 수식)

| 시트명 | 역할 | 행x열 | 수식 수 | 핵심 기능 |
|--------|------|-------|---------|----------|
| **설정** | 글로벌 설정 | 69x25 | ArrayFormula 다수 | 연도, 카테고리, 결제방법 정의 |
| **통합시트** | 연간 대시보드 | 120x17 | 993 | 12개월 매출/매입/순수익 집계 |
| **캘린더** | 달력 뷰 | 39x10 | 128 | 월별 캘린더 |
| **입출금 내역 관리** | 계좌 현금흐름 | 2009x15 | 2,032 | 입출금 기록 + 잔액 계산 |
| **계산서 관리** | 세금계산서 | 1010x19 | 4,006 | 매출/매입 세금계산서 추적 |
| **1월~12월** (x12) | 월별 매출/매입 | 1062x50 | 5,637/시트 | 일별 입력 + 소분류 집계 + 랭킹 + 그래프 |
| **대출관리** | 대출/상환 | 320x18 | 324 | 대출원금/이자/상환기록 |
| **거래처 관리** | 거래처 목록 | 104x11 | 100 | 거래처 정보 |
| **인건비 관리** | 급여 관리 | 310x15 | 636 | 직원별 급여/공제 |
| **요약 Data** | 그래프 데이터 | 33x42 | 355 | 랭킹, 컬러, 연간 그래프 |
| **Budget** | 예산 관리 | 42x13 | 2 (동적) | 목표 대비 실적 비교 |

### 1.2 데이터 흐름 아키텍처

```
설정 (Config)
  ├─ 연도, 카테고리 트리, 결제방법
  │
  ▼
데이터 입력 레이어
  ├─ 월별 시트 x12 (일별 매출/매입 트랜잭션)
  ├─ 입출금 내역 관리 (계좌 기반 현금흐름)
  ├─ 인건비 관리 (급여 기록)
  ├─ 대출관리 (대출/상환 기록)
  ├─ 계산서 관리 (세금계산서)
  └─ 거래처 관리 (거래처 마스터)
  │
  ▼
집계 엔진 레이어
  ├─ 통합시트 (연간 대시보드 — SUMIFS + VLOOKUP)
  ├─ 요약 Data (랭킹 엔진 — RANK + VLOOKUP)
  └─ Budget (예산 대비 실적 — OFFSET + INDIRECT)
  │
  ▼
시각화 레이어
  ├─ 매출/매입 비율 차트
  ├─ 카테고리 랭킹 차트
  ├─ 일별 누적매출 추이 그래프
  └─ 순수익/매입 비율 도넛 차트
```

---

## 2. 카테고리 시스템 (설정 시트 분석)

### 2.1 매출 카테고리

엑셀의 설정 시트 B10~Q19 영역에 정의됨.

```
매출 (대분류, 1개)
  ├─ 매장
  ├─ 테이크아웃
  ├─ 배민
  ├─ 쿠팡이츠
  ├─ 요기요
  └─ 단체주문
```

### 2.2 매입 카테고리

설정 시트 B22~Q41 영역. 대분류 9개, 소분류 총 34개.

```
고정비용 (대분류)
  ├─ 월세, 관리비, 대출이자, 대표 건보료, 대표 연금
  ├─ 보험료, 정기결제, 기장비, CCTV, 통신비
세금
  ├─ 직원4대보험, 부가세, 종소세, 인건비신고, 자동차세
인건비
  ├─ 고정알바, 단기알바, 직원식대, 회식비
식자재
  ├─ 커피원두, 유제품, 시럽
소모품
  ├─ 일회용컵, 홀더, 빨대, 티슈, 사무용품
운영비
  ├─ 인테리어, 수리비, 식기주방용품
마케팅
  ├─ 입간판, 포스터, 인스타광고, 협찬광고
대표교육비
  └─ 강의
수수료
  ├─ 카드수수료, 배달수수료
```

### 2.3 결제방법

```
매출 결제방법: 카드, 지역화폐, 현금 (최대 15개 확장 가능)
매입 결제방법: 카드1, 카드2, 지역화폐, 현금 (최대 15개 확장 가능)
```

### 2.4 특수 구분

```
입금 구분: 매출, 기타 입금, 예비비 설정
출금 구분: 매입, 기타 출금, 예비비 해제
```

### 2.5 → Supabase 구현

```sql
-- 카테고리 마스터 테이블
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  major_category TEXT NOT NULL,      -- 대분류 (매출, 고정비용, 세금 등)
  minor_category TEXT NOT NULL,      -- 소분류 (매장, 월세 등)
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 결제방법 마스터
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  name TEXT NOT NULL,                -- 카드, 현금, 지역화폐 등
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 기본 카테고리 시드 (F&B 기본값)
-- 회원가입 시 위의 엑셀 카테고리 구조를 기본 시드로 INSERT
```

---

## 3. 월별 시트 상세 분석 (핵심 데이터 입력)

### 3.1 입력 컬럼 구조 (B~K열)

| 열 | 헤더 | 타입 | 설명 | 필수 |
|----|------|------|------|------|
| B | No | 자동 (=ROW(A1)) | 행 번호 | 자동 |
| C | 날짜 | DATE | 거래 날짜 | * |
| D | 거래처 | TEXT | 거래처명 | |
| E | 내용 | TEXT | 거래 내용 | |
| F | 매입 금액 | NUMBER | 지출 금액 | * (매입시) |
| G | 매출 금액 | NUMBER | 수입 금액 | * (매출시) |
| H | 대분류 | DROPDOWN | 설정의 대분류 참조 | * |
| I | 소분류 | DROPDOWN | 설정의 소분류 참조 | * |
| J | 결제 방법 | DROPDOWN | 설정의 결제방법 참조 | |
| K | 태그 | TEXT | 사용자 태그 | |

**핵심 제약사항**:
- 매출은 G열(매출금액), 매입은 F열(매입금액)에 입력 — 한 행에 둘 중 하나만
- 날짜 범위: 해당 월의 시작일($AU$9)~마지막일($AU$10) 사이만 유효
- 데이터 유효성 검사: V, W열에서 카테고리 유효성 체크

### 3.2 카테고리 유효성 검사 수식

```excel
-- V열: 카테고리가 설정 시트에 존재하는지 체크 (1=유효, 0=무효)
V35 = IFERROR(
  IF(OR($B35="No", $H35=""), 1,
    COUNTIF(설정!$S$10:$S$41, $H35)
  ), 0)
```

이 수식은 대분류(H열)가 설정 시트의 통합 카테고리 목록(S10:S41)에 존재하는지 검증한다.

### 3.3 매출 소분류별 집계 수식 (P열, 행 48~56)

```excel
-- 매출 소분류별 합계 (SUMIFS 패턴)
P48 (매장) = SUMIFS(
  G1:G1057,              -- 합산 범위: 매출금액
  H1:H1057, M48,         -- 조건1: 대분류 = "매출"
  I1:I1057, O48,         -- 조건2: 소분류 = "매장"
  C1:C1057, ">=" & $AU$9,  -- 조건3: 날짜 >= 월 시작일
  C1:C1057, "<=" & $AU$10  -- 조건4: 날짜 <= 월 마지막일
)

-- P49 (테이크아웃), P50 (배민), P51 (쿠팡이츠) 등 동일 패턴
-- P54 = SUM(P48:P53)  -- 매출 소계
-- P56: 총 매출 = SUMIF(M48:M55, "=*합계", P48:P55)
```

### 3.4 매입 소분류별 집계 수식 (P열, 행 61~116)

```excel
-- 매입 소분류별 합계 (SUMIFS 패턴)
P61 (월세) = SUMIFS(
  F1:F1057,              -- 합산 범위: 매입금액
  H1:H1057, M61,         -- 조건1: 대분류 = "고정비용"
  I1:I1057, O61           -- 조건2: 소분류 = "월세"
)
-- 매입은 날짜 필터 없음 (해당 시트 자체가 월 단위이므로)

-- 대분류별 소계 합산 패턴
P71 = SUM(P61:P70)   -- 고정비용 합계
P78 = SUM(P73:P77)   -- 세금 합계
P84 = SUM(P80:P83)   -- 인건비 합계
P89 = SUM(P86:P88)   -- 식자재 합계
P96 = SUM(P91:P95)   -- 소모품 합계
P101 = SUM(P98:P100) -- 운영비 합계
P107 = SUM(P103:P106) -- 마케팅 합계
P110 = SUM(P109:P109) -- 대표교육비 합계
P114 = SUM(P112:P113) -- 수수료 합계

-- 총 매입 (대분류 합계행만 골라서 합산)
P116 = SUMIF(M61:M115, "=*합계", P61:P115)
```

### 3.5 결제방법별 집계 수식 (S열)

```excel
-- 매출 결제방법별 합계 (SUMPRODUCT 패턴)
S48 (카드 매출) = SUMPRODUCT(
  --(ISNUMBER(MATCH(H1:H1057, 설정!B10:B19, 0))),  -- 매출 대분류에 해당
  --(J1:J1057 = R48),      -- 결제방법 = "카드"
  --(C1:C1057 <> ""),       -- 날짜가 있는 행만
  --(V1:V1057 = 1),         -- 카테고리 유효
  --(W1:W1057 = 1),         -- 추가 유효성
  G1:G1057                   -- 매출금액 합산
)

-- 매입 결제방법별 합계
S55 (카드1 매입) = SUMPRODUCT(
  --(ISNUMBER(MATCH(H1:H1057, 설정!B22:B41, 0))),  -- 매입 대분류에 해당
  --(J1:J1057 = R55),      -- 결제방법 = "카드1"
  --(V1:V1057 = 1),
  --(W1:W1057 = 1),
  F1:F1057                   -- 매입금액 합산
)
```

### 3.6 매출 소분류 랭킹 엔진 (V~AB열)

이 랭킹은 대시보드의 핵심 차트 데이터를 생성한다.

```excel
-- 1단계: 카테고리 목록 생성 (ArrayFormula)
Y3 = IFERROR(
  IF($I$18 = "매출 대분류",
    INDEX(설정!$B$10:$B$19, ROWS($A$1:$A1)) & " 합계",
    INDEX(
      INDEX(설정!$C$10:$Q$19, MATCH($I$18, 설정!$B$10:$B$19, 0), 0),
      ROWS($A$1:$A1)
    )
  ), "")
-- $I$18이 "매출 대분류"이면 → 대분류별 합계 목록
-- 특정 대분류면 → 해당 대분류의 소분류 목록

-- 2단계: 해당 카테고리의 금액 조회
Z3 = IFERROR(
  IF($I$18 = "매출 대분류",
    VLOOKUP(Y3, M:P, 4, 0),    -- "매출 합계" 등으로 M열에서 찾아 P열(금액) 반환
    INDEX($P:$P,
      MATCH($I$18, $M:$M, 0) +
      MATCH(Y3, INDEX($O:$O, MATCH($I$18,$M:$M,0)):INDEX($O:$O, MATCH($I$18&" 합계",$M:$M,0)), 0) - 1
    )
  ), 0)

-- 3단계: 랭킹을 위한 고유값 생성 (금액 + 순번 보정)
W3 = IF(Z3 <> 0, Z3 + V3 * 0.001, "")
-- 동일 금액일 때 순번(V열)으로 미세 차이를 만들어 RANK 충돌 방지

-- 4단계: 랭킹 산출
X3 = RANK(W3, $W$3:$W$32)

-- 5단계: 랭킹 결과 문자열 생성
AA3 = IFERROR(
  VLOOKUP(V3+1, $X$3:$Z$32, 2, 0) &
  " (" & INT(AB3 / SUM($AB$3:$AB$32) * 100) & "%)",
  "-")
-- 결과 예: "매장 (45%)", "배민 (23%)"

AB3 = IFERROR(VLOOKUP(V3+1, $X$3:$Z$32, 3, 0), "0")
```

### 3.7 매입 대분류 랭킹 엔진 (AD~AJ열)

```excel
-- 카테고리 목록 (ArrayFormula)
AG3 = OFFSET(설정!B22:B41, -1, 0, 20, 1)
-- 설정의 매입 대분류 목록을 그대로 가져옴

-- 금액 조회
AH3 = IFERROR(VLOOKUP(AG3 & " 합계", M:P, 4, 0), 0)
-- "고정비용 합계", "세금 합계" 등으로 M열에서 찾아 P열 금액 반환

-- 랭킹 (매출과 동일 패턴)
AE3 = IF(AH3 <> 0, AH3 + AD3 * 0.001, "")
AF3 = RANK(AE3, $AE$3:$AE$23)
```

### 3.8 일별 누적매출 그래프 데이터 (AL~AR열)

```excel
-- 시작일/끝일
AU9 = DATE(설정!$C$2, AU8, 1)           -- 월 시작일 (예: 2026-01-01)
AU10 = DATE(설정!$C$2, AU8, DAY(EOMONTH(DATE(설정!$C$2, AU8, 1), 0)))  -- 월 마지막일

-- 날짜 시퀀스
AL3 = AU9                               -- 1일
AL4 = IF(AL3<>"", IF($AU$10 < AL3+1, "", AL3+1), "")  -- 2일 (마지막일 초과시 빈값)

-- 일일 매출 (ArrayFormula)
AM3 = {해당일의 매출 합계 - ArrayFormula로 SUMIFS}

-- 7일 이동평균
AN3 = IF(AL3<>"", AVERAGEA(AM3), "")
AN4 = IF(AL4<>"", AVERAGEA(AM3:AM4), "")
AN10 = IF(AL10<>"", AVERAGEA(AM4:AM10), "")  -- 7일 윈도우

-- 누적 매출
AO3 = IF('요약 Data'!$C$2 >= AL3, AM3, "")
AO4 = IF('요약 Data'!$C$2 >= AL4, AO3 + AM4, NA())  -- 누적 합산

-- 오늘까지 누적 (차트용 마커)
AP3 = IF(OR($AL3 = '요약 Data'!$C$2, $AL3 = $AU$10), AO3, "")
-- 오늘 날짜이거나 월말인 경우에만 값 표시 (차트의 마커 포인트)
```

### 3.9 순수익/매입 비율 (AT~AV열, 도넛차트용)

```excel
AT3 = "순 수익"
AU3 = P4                                    -- = E4 - I4 (총 매출 - 총 매입)
AV3 = IFERROR(IF(AU3 <= 0, 0, AU3 / (AU3 + AU4)), 0)  -- 순수익 비율

AT4 = "총 매입 (지출)"
AU4 = I4                                    -- 총 매입
AV4 = IFERROR(IF(AU3 <= 0, 1, AU4 / (AU3 + AU4)), 0)  -- 매입 비율
```

### 3.10 일평균 매출

```excel
E6 = E4 / IF(TODAY() >= AU10, DAY(AU10), DAY(TODAY()))
-- 월말이 지났으면 해당 월 일수로 나누고, 아직이면 오늘 일수로 나눔
```

### 3.11 → Supabase 구현

```sql
-- 핵심 트랜잭션 테이블 (월별 시트 통합)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  vendor TEXT,                              -- 거래처
  content TEXT,                             -- 내용
  debit NUMERIC(15,0) DEFAULT 0,            -- 매입(지출) 금액
  credit NUMERIC(15,0) DEFAULT 0,           -- 매출(수입) 금액
  category_major TEXT NOT NULL,             -- 대분류
  category_minor TEXT NOT NULL,             -- 소분류
  payment_method TEXT,                      -- 결제방법
  tag TEXT,                                 -- 태그
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_category ON transactions(user_id, category_major, category_minor);
CREATE INDEX idx_transactions_date_range ON transactions(user_id, date, category_major);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id);
```

---

## 4. 통합시트 분석 (연간 대시보드)

### 4.1 연간 매출/매입/순수익 집계 (행 36~38)

```excel
-- 연간 매출 (E36~P36: 1월~12월)
E36 = INDIRECT(E$35 & "!$E$4")
-- "1월!$E$4" → 1월 시트의 총 매출을 동적 참조
-- E$35 = "1월", F$35 = "2월", ... P$35 = "12월"

-- 연간 합계
D36 = SUM(E36:P36)

-- 월 평균 (동적 — 현재 진행 중인 연도 vs 과거 연도)
Q36 = IF(
  설정!$C$2 = YEAR(TODAY()),
  AVERAGE(E36:INDEX(E36:P36, MONTH(TODAY()))),  -- 올해면 현재 월까지만 평균
  IF(설정!$C$2 < YEAR(TODAY()),
    AVERAGE(E36:P36),                            -- 과거년도면 12개월 평균
    0                                              -- 미래년도면 0
  )
)
```

**이 월평균 로직은 매우 중요** — 재무 에이전트의 예측/시뮬레이션에서도 동일하게 적용해야 한다.

### 4.2 입출금 내역 기반 집계 (행 42~47)

```excel
-- 월별 매출 입금 (입출금 내역 관리 시트에서)
E42 = SUMIFS(
  '입출금 내역 관리'!$F:$F,              -- 합산: 입금액
  '입출금 내역 관리'!$C:$C, ">=" & DATE(설정!$C$2, E$41, 1),  -- 해당월 시작
  '입출금 내역 관리'!$C:$C, "<=" & EOMONTH(DATE(설정!$C$2, E$41, 1), 0),  -- 해당월 끝
  '입출금 내역 관리'!$G:$G, $C42          -- 구분 = "매출"
)

-- 월별 매입 출금
E45 = SUMIFS(
  '입출금 내역 관리'!$E:$E,              -- 합산: 출금액
  '입출금 내역 관리'!$C:$C, ">=" & DATE(설정!$C$2, E$41, 1),
  '입출금 내역 관리'!$C:$C, "<=" & EOMONTH(DATE(설정!$C$2, E$41, 1), 0),
  '입출금 내역 관리'!$G:$G, $C45          -- 구분 = "매입"
)

-- 총 입금 / 총 출금
E44 = SUM(E42:E43)    -- 매출 입금 + 기타 입금
E47 = SUM(E45:E46)    -- 매입 출금 + 기타 출금
```

### 4.3 매입 상세 집계 (행 62~108)

통합시트는 월별 시트의 소분류 집계를 12개월 가로로 펼친다.

```excel
-- 고정비용 > 월세 (1~12월)
E62 = '1월'!P61     -- 1월의 월세 합계
F62 = '2월'!P61     -- 2월의 월세 합계
...
P62 = '12월'!P61    -- 12월의 월세 합계
D62 = SUM(E62:P62)  -- 연간 합계

-- 고정비용 합계
E72 = SUM(E62:E71)   -- 1월 고정비용 합계

-- 총 매입 (대분류 합계행만 합산)
D108 = SUMIF(B62:B107, "=*합계", D62:D107)
```

### 4.4 결제방법별 집계 (행 112~120)

```excel
-- 매출 카드 결제 (1~12월)
E112 = '1월'!S48    -- 1월 카드 매출
F112 = '2월'!S48    -- 2월 카드 매출
...
```

### 4.5 → SQL 뷰 구현

```sql
-- 월별 매출/매입/순수익 집계 뷰
CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', date)::DATE AS month,
  SUM(credit) AS total_revenue,
  SUM(debit) AS total_expense,
  SUM(credit) - SUM(debit) AS net_profit,
  COUNT(*) AS transaction_count,
  CASE WHEN EXTRACT(DAY FROM MAX(date)) > 0
    THEN SUM(credit) / EXTRACT(DAY FROM MAX(date))
    ELSE 0
  END AS daily_avg_revenue
FROM transactions
GROUP BY user_id, DATE_TRUNC('month', date);

-- 대분류별 월별 집계
CREATE OR REPLACE VIEW v_category_monthly AS
SELECT
  user_id,
  DATE_TRUNC('month', date)::DATE AS month,
  category_major,
  category_minor,
  SUM(debit) AS expense,
  SUM(credit) AS revenue
FROM transactions
GROUP BY user_id, DATE_TRUNC('month', date), category_major, category_minor;

-- 결제방법별 월별 집계
CREATE OR REPLACE VIEW v_payment_method_monthly AS
SELECT
  user_id,
  DATE_TRUNC('month', date)::DATE AS month,
  payment_method,
  CASE WHEN credit > 0 THEN 'revenue' ELSE 'expense' END AS type,
  SUM(credit) AS revenue,
  SUM(debit) AS expense
FROM transactions
WHERE payment_method IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', date), payment_method,
  CASE WHEN credit > 0 THEN 'revenue' ELSE 'expense' END;
```

---

## 5. 입출금 내역 관리 시트 분석

### 5.1 입력 구조

| 열 | 헤더 | 설명 |
|----|------|------|
| B | No | =ROW(A1) 자동번호 |
| C | 날짜 | DATE |
| D | 내용 | TEXT |
| E | 출금액 | NUMBER |
| F | 입금액 | NUMBER |
| G | 구분 | DROPDOWN: 매출/기타입금/매입/기타출금/예비비설정/예비비해제 |
| H | 태그 | TEXT (현금영수증 필, 세금계산서 필 등) |

### 5.2 잔액 계산 수식

```excel
-- 구분별 합계
L10 = SUMIFS(F:F, G:G, "매출", C:C, "<>")           -- 매출 입금 합계
L11 = SUMIFS(F:F, G:G, "기타 입금", C:C, "<>")      -- 기타 입금 합계
L12 = SUM(L10:L11)                                    -- 총 입금

L13 = SUMIFS(E:E, G:G, "매입", C:C, "<>")            -- 매입 출금 합계
L14 = SUMIFS(E:E, G:G, "기타 출금", C:C, "<>")       -- 기타 출금 합계
L15 = SUM(L13:L14)                                    -- 총 출금

L16 = L12 - L15                                       -- 잔액 (예비비 포함)

-- 예비비 계산
L17 = SUMIFS(F:F, G:G, "예비비 설정", C:C, "<>")
    - SUMIFS(E:E, G:G, "예비비 해제", C:C, "<>")      -- 순 예비비
```

### 5.3 태그별 집계 수식

```excel
-- 태그별 금액 합산 (출금 + 입금 모두)
K21 = SUMIFS(E:E, H:H, J21, C:C, "<>")     -- 해당 태그의 출금액
    + SUMIFS(F:F, H:H, J21, C:C, "<>")      -- 해당 태그의 입금액
-- J21 = "현금영수증 필", J22 = "세금계산서 필" 등
```

### 5.4 → Supabase 구현

```sql
-- 입출금 내역 테이블 (계좌 기반)
CREATE TABLE cashflow_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  content TEXT,
  debit NUMERIC(15,0) DEFAULT 0,           -- 출금액
  credit NUMERIC(15,0) DEFAULT 0,          -- 입금액
  entry_type TEXT NOT NULL,                 -- 매출/기타입금/매입/기타출금/예비비설정/예비비해제
  tag TEXT,                                 -- 현금영수증필, 세금계산서필 등
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 잔액 + 예비비 계산 함수
CREATE OR REPLACE FUNCTION get_cashflow_balance(p_user_id UUID)
RETURNS TABLE(
  total_credit NUMERIC,
  total_debit NUMERIC,
  balance NUMERIC,
  reserve_fund NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN entry_type IN ('매출','기타 입금') THEN credit ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN entry_type IN ('매입','기타 출금') THEN debit ELSE 0 END), 0),
    COALESCE(SUM(credit) - SUM(debit), 0),
    COALESCE(
      SUM(CASE WHEN entry_type = '예비비 설정' THEN credit ELSE 0 END)
      - SUM(CASE WHEN entry_type = '예비비 해제' THEN debit ELSE 0 END), 0
    )
  FROM cashflow_entries
  WHERE user_id = p_user_id AND date IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. 인건비 관리 시트 분석

### 6.1 입력 구조

| 열 | 헤더 | 설명 |
|----|------|------|
| B | No | 자동번호 |
| C | 지급일 | DATE |
| D | 이름 | TEXT |
| E | 주민번호 | TEXT (암호화 필요) |
| F | 연락처 | TEXT |
| G | 지급액(세전) | NUMBER |
| H | 공제액 | NUMBER |
| I | 실지급액(세후) | =G-H (자동 계산) |
| J | 비고 | TEXT |

### 6.2 월별 자동 집계 (행 4~6)

```excel
-- 월별 지급액(세전)
D4 = SUMIFS(
  $G$10:$G9999,                                    -- 합산: 지급액
  $C$10:$C9999, ">=" & DATE(설정!$C$2, D$3, 1),   -- 해당월 시작
  $C$10:$C9999, "<" & DATE(설정!$C$2, D$3+1, 1)   -- 다음월 시작 전
)

-- 월별 공제액
D5 = SUMIFS($H$10:$H9999, ...)  -- 동일 패턴, H열(공제액)

-- 월별 실지급액
D6 = SUMIFS($I$10:$I9999, ...)  -- 동일 패턴, I열(실지급액)
```

### 6.3 → Supabase 구현

```sql
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  payment_date DATE NOT NULL,
  employee_name TEXT NOT NULL,
  resident_id_encrypted TEXT,              -- 암호화 저장
  phone TEXT,
  gross_pay NUMERIC(15,0) NOT NULL,        -- 세전
  deductions NUMERIC(15,0) DEFAULT 0,      -- 공제
  net_pay NUMERIC(15,0) GENERATED ALWAYS AS (gross_pay - deductions) STORED,  -- 세후 자동계산
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 7. 대출관리 시트 분석

### 7.1 대출 마스터 (행 8~17, 최대 10건)

| 열 | 헤더 | 설명 |
|----|------|------|
| C | 금융기관 | TEXT |
| D | 대출명 | TEXT (PK 역할) |
| E | 대출목적 | TEXT |
| F | 대출원금 | NUMBER |
| G | 금리 | PERCENT |
| H | 원금잔액 | 자동계산 |
| I | 누적이자 | 자동계산 |
| J~Q | 부가정보 | 납입일, 월납입금, 금리종류, 기간, 조건 등 |

### 7.2 핵심 자동계산 수식

```excel
-- 원금잔액 = 대출원금 - 해당 대출의 상환원금 합계
H8 = F8 - SUMIFS($E$21:$E$216, $D$21:$D$216, D8)
-- $E$21:$E$216 = 상환기록의 상환원금 열
-- $D$21:$D$216 = 상환기록의 대출명 열
-- D8 = 현재 대출명

-- 누적이자 = 해당 대출의 이자 합계
I8 = SUMIFS($F$21:$F$216, $D$21:$D$216, D8)

-- 총합
O4 = SUM(F8:F17)    -- 총 대출원금
P4 = SUM(H8:H17)    -- 총 원금잔액
Q4 = SUM(I8:I17)    -- 총 누적이자
```

### 7.3 상환 기록 (행 21~216)

| 열 | 헤더 |
|----|------|
| C | 날짜 |
| D | 대출명 (= 마스터의 D열과 매칭) |
| E | 상환원금 |
| F | 이자 |
| G | 비고 |

### 7.4 → Supabase 구현

```sql
-- 대출 마스터
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  institution TEXT,                   -- 금융기관
  loan_name TEXT NOT NULL,            -- 대출명
  purpose TEXT,                       -- 대출목적
  principal NUMERIC(15,0) NOT NULL,   -- 대출원금
  interest_rate NUMERIC(5,3),         -- 금리
  payment_day TEXT,                   -- 납입일
  monthly_payment NUMERIC(15,0),      -- 월 납입금
  rate_type TEXT,                     -- 금리종류 (변동/고정)
  loan_period TEXT,                   -- 대출기간
  repayment_type TEXT,                -- 상환조건
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 상환 기록
CREATE TABLE loan_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  repayment_date DATE NOT NULL,
  principal_paid NUMERIC(15,0) DEFAULT 0,   -- 상환원금
  interest_paid NUMERIC(15,0) DEFAULT 0,    -- 이자
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 대출 잔액 조회 뷰
CREATE OR REPLACE VIEW v_loan_balance AS
SELECT
  l.id,
  l.user_id,
  l.loan_name,
  l.principal,
  l.principal - COALESCE(SUM(r.principal_paid), 0) AS remaining_principal,
  COALESCE(SUM(r.interest_paid), 0) AS total_interest_paid,
  l.interest_rate,
  l.monthly_payment
FROM loans l
LEFT JOIN loan_repayments r ON r.loan_id = l.id
GROUP BY l.id;
```

---

## 8. Budget(예산) 시트 분석

### 8.1 구조

대분류별(매출, 고정비용, 세금, ...) x 12개월 매트릭스.

```excel
-- 카테고리 목록 (A열, ArrayFormula)
A1 = OFFSET(설정!$S$10:$S$31, 0, 0, 22, 1)
-- 설정의 통합 카테고리 목록(22개)을 동적으로 가져옴

-- 월별 목표금액 (수동 입력)
B3~M3: 매출 목표 (1~12월)
B4~M4: 고정비용 목표 (1~12월)
...

-- 실적 조회 (VLOOKUP + INDIRECT로 월별 시트 참조)
C1 = IFERROR(
  VLOOKUP($A3, INDIRECT(B$2 & "!$L$47:$N$564"), 2, 0),
  0)
-- B$2 = "1월" → "1월!$L$47:$N$564" 범위에서 대분류명으로 실적 조회
```

### 8.2 → Supabase 구현

```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  category_major TEXT NOT NULL,
  target_amount NUMERIC(15,0) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year, month, category_major)
);

-- 예산 vs 실적 비교 뷰
CREATE OR REPLACE VIEW v_budget_vs_actual AS
SELECT
  b.user_id,
  b.year,
  b.month,
  b.category_major,
  b.target_amount,
  COALESCE(SUM(t.debit), 0) + COALESCE(SUM(t.credit), 0) AS actual_amount,
  b.target_amount - (COALESCE(SUM(t.debit), 0) + COALESCE(SUM(t.credit), 0)) AS variance
FROM budgets b
LEFT JOIN transactions t ON
  t.user_id = b.user_id
  AND t.category_major = b.category_major
  AND EXTRACT(YEAR FROM t.date) = b.year
  AND EXTRACT(MONTH FROM t.date) = b.month
GROUP BY b.id;
```

---

## 9. KPI 계산 엔진 (재무 에이전트 핵심)

엑셀의 수식 로직을 기반으로, sajang.ai 재무 에이전트가 계산해야 할 KPI 목록.

### 9.1 기본 KPI

```typescript
interface MonthlyKPI {
  // 매출 관련
  totalRevenue: number;           // 총 매출 = SUM(credit WHERE type='매출')
  revenueByChannel: Record<string, number>;  // 소분류별 (매장, 배민 등)
  revenueByPayment: Record<string, number>;  // 결제방법별 (카드, 현금 등)
  dailyAvgRevenue: number;        // 일평균 매출

  // 매입 관련
  totalExpense: number;           // 총 매입
  fixedCosts: number;             // 고정비용 합계
  variableCosts: number;          // 변동비용 합계 (식자재+소모품+운영비+마케팅+수수료)
  laborCosts: number;             // 인건비 합계
  taxCosts: number;               // 세금 합계
  expenseByCategory: Record<string, number>;  // 대분류별

  // 수익성
  netProfit: number;              // 순수익 = 총매출 - 총매입
  profitMargin: number;           // 순수익률 = 순수익 / 총매출
  profitToExpenseRatio: number;   // 순수익/(순수익+총매입) — 도넛차트용

  // 현금흐름
  cashBalance: number;            // 잔액
  reserveFund: number;            // 예비비
}
```

### 9.2 랭킹 KPI

```typescript
interface RankingKPI {
  // 매출 소분류 랭킹 (엑셀 V~AB열 로직)
  revenueRanking: Array<{
    rank: number;
    category: string;        // "매장", "배민" 등
    amount: number;
    percentage: number;       // 전체 대비 비율
  }>;

  // 매입 대분류 랭킹 (엑셀 AD~AJ열 로직)
  expenseRanking: Array<{
    rank: number;
    category: string;        // "고정비용", "인건비" 등
    amount: number;
    percentage: number;
  }>;
}
```

### 9.3 트렌드 KPI

```typescript
interface TrendKPI {
  // 일별 누적매출 (엑셀 AL~AR열 로직)
  dailyCumulative: Array<{
    date: string;
    dailyRevenue: number;
    movingAvg7d: number;     // 7일 이동평균
    cumulativeRevenue: number;
  }>;

  // 월별 추이
  monthlyTrend: Array<{
    month: number;
    revenue: number;
    expense: number;
    netProfit: number;
  }>;

  // 동적 월평균 (엑셀 Q열 로직)
  dynamicMonthlyAvg: {
    revenue: number;
    expense: number;
    netProfit: number;
    // 현재 연도면 현재 월까지만, 과거면 12개월 전체 평균
  };
}
```

### 9.4 → KPI 계산 SQL 함수

```sql
-- 월별 KPI 전체 계산
CREATE OR REPLACE FUNCTION calculate_monthly_kpi(
  p_user_id UUID,
  p_year INT,
  p_month INT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  v_start_date DATE;
  v_end_date DATE;
  v_today DATE := CURRENT_DATE;
  v_days_in_month INT;
  v_days_elapsed INT;
BEGIN
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month - 1 day')::DATE;

  -- 일평균 계산용 일수
  IF p_year = EXTRACT(YEAR FROM v_today) AND p_month = EXTRACT(MONTH FROM v_today) THEN
    v_days_elapsed := EXTRACT(DAY FROM v_today);
  ELSE
    v_days_elapsed := EXTRACT(DAY FROM v_end_date);
  END IF;

  SELECT jsonb_build_object(
    'totalRevenue', COALESCE(SUM(credit), 0),
    'totalExpense', COALESCE(SUM(debit), 0),
    'netProfit', COALESCE(SUM(credit) - SUM(debit), 0),
    'profitMargin', CASE
      WHEN SUM(credit) > 0 THEN ROUND((SUM(credit) - SUM(debit))::NUMERIC / SUM(credit) * 100, 1)
      ELSE 0 END,
    'dailyAvgRevenue', CASE
      WHEN v_days_elapsed > 0 THEN ROUND(SUM(credit)::NUMERIC / v_days_elapsed)
      ELSE 0 END,
    'transactionCount', COUNT(*)
  ) INTO result
  FROM transactions
  WHERE user_id = p_user_id
    AND date BETWEEN v_start_date AND v_end_date;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 카테고리 랭킹 계산
CREATE OR REPLACE FUNCTION calculate_category_ranking(
  p_user_id UUID,
  p_year INT,
  p_month INT,
  p_type TEXT  -- 'revenue' or 'expense'
)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(row_data ORDER BY rank)
    FROM (
      SELECT
        jsonb_build_object(
          'rank', RANK() OVER (ORDER BY total DESC),
          'category', category,
          'amount', total,
          'percentage', ROUND(total::NUMERIC / NULLIF(SUM(total) OVER(), 0) * 100, 1)
        ) AS row_data,
        RANK() OVER (ORDER BY total DESC) AS rank
      FROM (
        SELECT
          CASE WHEN p_type = 'revenue' THEN category_minor ELSE category_major END AS category,
          CASE WHEN p_type = 'revenue' THEN SUM(credit) ELSE SUM(debit) END AS total
        FROM transactions
        WHERE user_id = p_user_id
          AND EXTRACT(YEAR FROM date) = p_year
          AND EXTRACT(MONTH FROM date) = p_month
          AND CASE WHEN p_type = 'revenue' THEN credit > 0 ELSE debit > 0 END
        GROUP BY CASE WHEN p_type = 'revenue' THEN category_minor ELSE category_major END
        HAVING CASE WHEN p_type = 'revenue' THEN SUM(credit) ELSE SUM(debit) END > 0
      ) sub
    ) ranked
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 일별 누적매출 + 7일 이동평균
CREATE OR REPLACE FUNCTION calculate_daily_cumulative(
  p_user_id UUID,
  p_year INT,
  p_month INT
)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(row_data ORDER BY day)
    FROM (
      SELECT jsonb_build_object(
        'date', d.day::TEXT,
        'dailyRevenue', COALESCE(t.daily_rev, 0),
        'movingAvg7d', ROUND(AVG(COALESCE(t.daily_rev, 0)) OVER (
          ORDER BY d.day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        )),
        'cumulativeRevenue', SUM(COALESCE(t.daily_rev, 0)) OVER (ORDER BY d.day)
      ) AS row_data,
      d.day
      FROM generate_series(
        make_date(p_year, p_month, 1),
        LEAST(
          (make_date(p_year, p_month, 1) + INTERVAL '1 month - 1 day')::DATE,
          CURRENT_DATE
        ),
        '1 day'
      ) AS d(day)
      LEFT JOIN (
        SELECT date, SUM(credit) AS daily_rev
        FROM transactions
        WHERE user_id = p_user_id AND credit > 0
        GROUP BY date
      ) t ON t.date = d.day
    ) sub
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 10. 재무 에이전트 활용 지침

### 10.1 에이전트 역할 정의

재무 에이전트는 AAA 프레임워크에 따라 동작한다:

**Aware (인지)**:
- 사용자의 매출/매입 데이터를 실시간으로 인지
- 카테고리 비율 변화, 이상 패턴 감지
- 업종 평균 대비 비교 (고정비용률, 인건비율, 식자재율 등)

**Act (행동)**:
- 자동 KPI 리포트 생성 (일/주/월)
- 이상 지출 알림 ("이번 달 식자재비가 지난달 대비 35% 증가했습니다")
- 의사결정 시뮬레이션 실행

**Adapt (적응)**:
- 사용자의 입력 패턴 학습 (매출 카테고리 자동 추천)
- 계절별 매출 패턴 학습 (여름 매출 상승 등)
- 피드백 기반 알림 임계값 조정

### 10.2 Survival Score 계산 (엑셀에 없는 sajang.ai 고유 기능)

엑셀 데이터를 기반으로 생존 점수를 산출한다.

```typescript
interface SurvivalScore {
  score: number;              // 0~100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';

  factors: {
    // 수익성 (30%)
    profitMargin: number;     // 순수익률 (목표: 15%+)

    // 고정비 안정성 (25%)
    fixedCostRatio: number;   // 고정비/매출 비율 (목표: 30% 이하)

    // 인건비 적정성 (20%)
    laborCostRatio: number;   // 인건비/매출 비율 (업종별 기준)

    // 현금 유동성 (15%)
    cashRunway: number;       // 현재 잔액으로 버틸 수 있는 개월 수

    // 성장성 (10%)
    revenueGrowth: number;    // 전월 대비 매출 증감률
  };
}
```

계산 로직:

```typescript
function calculateSurvivalScore(kpi: MonthlyKPI, history: MonthlyKPI[]): SurvivalScore {
  const { totalRevenue, totalExpense, netProfit, fixedCosts, laborCosts, cashBalance } = kpi;

  // 1. 수익성 점수 (30점)
  const profitMargin = totalRevenue > 0 ? netProfit / totalRevenue : 0;
  const profitScore = Math.min(30, Math.max(0,
    profitMargin >= 0.20 ? 30 :
    profitMargin >= 0.15 ? 25 :
    profitMargin >= 0.10 ? 20 :
    profitMargin >= 0.05 ? 15 :
    profitMargin >= 0 ? 10 : 0
  ));

  // 2. 고정비 안정성 점수 (25점)
  const fixedCostRatio = totalRevenue > 0 ? fixedCosts / totalRevenue : 1;
  const fixedCostScore = Math.min(25, Math.max(0,
    fixedCostRatio <= 0.25 ? 25 :
    fixedCostRatio <= 0.30 ? 20 :
    fixedCostRatio <= 0.40 ? 15 :
    fixedCostRatio <= 0.50 ? 10 : 5
  ));

  // 3. 인건비 적정성 점수 (20점)
  const laborRatio = totalRevenue > 0 ? laborCosts / totalRevenue : 1;
  const laborScore = Math.min(20, Math.max(0,
    laborRatio <= 0.20 ? 20 :
    laborRatio <= 0.25 ? 16 :
    laborRatio <= 0.30 ? 12 :
    laborRatio <= 0.35 ? 8 : 4
  ));

  // 4. 현금 유동성 점수 (15점)
  const monthlyBurn = totalExpense;
  const cashRunway = monthlyBurn > 0 ? cashBalance / monthlyBurn : 99;
  const cashScore = Math.min(15, Math.max(0,
    cashRunway >= 6 ? 15 :
    cashRunway >= 3 ? 12 :
    cashRunway >= 2 ? 8 :
    cashRunway >= 1 ? 4 : 0
  ));

  // 5. 성장성 점수 (10점)
  const prevMonth = history[history.length - 2];
  const revenueGrowth = prevMonth?.totalRevenue > 0
    ? (totalRevenue - prevMonth.totalRevenue) / prevMonth.totalRevenue
    : 0;
  const growthScore = Math.min(10, Math.max(0,
    revenueGrowth >= 0.10 ? 10 :
    revenueGrowth >= 0.05 ? 8 :
    revenueGrowth >= 0 ? 6 :
    revenueGrowth >= -0.05 ? 4 : 2
  ));

  const total = profitScore + fixedCostScore + laborScore + cashScore + growthScore;

  return {
    score: total,
    grade: total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : total >= 20 ? 'D' : 'F',
    factors: { profitMargin, fixedCostRatio, laborCostRatio: laborRatio, cashRunway, revenueGrowth }
  };
}
```

### 10.3 현금 고갈 예측 (엑셀에 없는 sajang.ai 고유 기능)

```typescript
function predictCashDepletion(
  currentBalance: number,
  monthlyHistory: MonthlyKPI[],
  months: number = 3
): CashDepletionPrediction {
  // 최근 3개월 평균 지출
  const recentExpenses = monthlyHistory.slice(-3);
  const avgMonthlyBurn = recentExpenses.reduce((sum, m) => sum + m.totalExpense, 0)
    / recentExpenses.length;

  const avgMonthlyRevenue = recentExpenses.reduce((sum, m) => sum + m.totalRevenue, 0)
    / recentExpenses.length;

  const monthlyNetCashflow = avgMonthlyRevenue - avgMonthlyBurn;

  // 시나리오별 예측
  const scenarios = {
    // 현상 유지
    baseline: {
      depletionMonth: monthlyNetCashflow >= 0
        ? null  // 고갈되지 않음
        : Math.ceil(currentBalance / Math.abs(monthlyNetCashflow)),
      balanceIn3Months: currentBalance + (monthlyNetCashflow * 3)
    },
    // 매출 10% 감소
    pessimistic: {
      netCashflow: avgMonthlyRevenue * 0.9 - avgMonthlyBurn,
      balanceIn3Months: currentBalance + ((avgMonthlyRevenue * 0.9 - avgMonthlyBurn) * 3)
    },
    // 매출 10% 증가
    optimistic: {
      netCashflow: avgMonthlyRevenue * 1.1 - avgMonthlyBurn,
      balanceIn3Months: currentBalance + ((avgMonthlyRevenue * 1.1 - avgMonthlyBurn) * 3)
    }
  };

  return {
    currentBalance,
    avgMonthlyBurn,
    avgMonthlyRevenue,
    monthlyNetCashflow,
    scenarios,
    isAtRisk: scenarios.baseline.balanceIn3Months < 0 || scenarios.pessimistic.balanceIn3Months < 0
  };
}
```

### 10.4 의사결정 시뮬레이션 (엑셀에 없는 sajang.ai 고유 기능)

엑셀 데이터를 기반으로 What-If 분석을 수행한다.

```typescript
type SimulationType =
  | { type: 'reduce_staff'; count: number }          // 직원 N명 줄이면?
  | { type: 'revenue_change'; percent: number }       // 매출 N% 변동하면?
  | { type: 'rent_change'; amount: number }           // 월세 N원으로 바뀌면?
  | { type: 'add_delivery'; platform: string }        // 배달앱 추가하면?
  | { type: 'cut_category'; category: string; percent: number }; // 특정 지출 N% 감축?

function simulate(
  currentKPI: MonthlyKPI,
  simulation: SimulationType
): SimulationResult {
  const projected = { ...currentKPI };

  switch (simulation.type) {
    case 'reduce_staff':
      // 인건비 관리 시트의 인당 평균 비용 기반
      const avgLaborPerPerson = projected.laborCosts / staffCount;
      projected.laborCosts -= avgLaborPerPerson * simulation.count;
      break;

    case 'revenue_change':
      projected.totalRevenue *= (1 + simulation.percent / 100);
      break;

    case 'rent_change':
      const currentRent = projected.expenseByCategory['고정비용']['월세'];
      projected.fixedCosts += (simulation.amount - currentRent);
      break;
    // ...
  }

  projected.netProfit = projected.totalRevenue - projected.totalExpense;

  return {
    before: currentKPI,
    after: projected,
    impact: {
      netProfitChange: projected.netProfit - currentKPI.netProfit,
      survivalScoreChange: calculateSurvivalScore(projected, []).score
        - calculateSurvivalScore(currentKPI, []).score,
      cashRunwayChange: /* ... */
    }
  };
}
```

### 10.5 AI 분석 프롬프트 컨텍스트 구성

재무 에이전트가 Claude API를 호출할 때 아래 데이터를 컨텍스트로 전달한다.

```typescript
function buildFinancialContext(userId: string): string {
  // 엑셀의 통합시트가 제공하던 모든 데이터를 JSON으로 구성
  return `
## 사장님 재무 현황

### 이번 달 요약
- 총 매출: ${kpi.totalRevenue.toLocaleString()}원
- 총 매입: ${kpi.totalExpense.toLocaleString()}원
- 순수익: ${kpi.netProfit.toLocaleString()}원 (순수익률: ${kpi.profitMargin}%)
- 일평균 매출: ${kpi.dailyAvgRevenue.toLocaleString()}원
- 생존 점수: ${survivalScore.score}/100 (${survivalScore.grade}등급)

### 매출 채널 랭킹
${ranking.revenueRanking.map(r => `${r.rank}. ${r.category}: ${r.amount.toLocaleString()}원 (${r.percentage}%)`).join('\n')}

### 지출 카테고리 랭킹
${ranking.expenseRanking.map(r => `${r.rank}. ${r.category}: ${r.amount.toLocaleString()}원 (${r.percentage}%)`).join('\n')}

### 고정비용 상세
- 월세: ${expenses.rent.toLocaleString()}원
- 인건비: ${expenses.labor.toLocaleString()}원 (매출 대비 ${laborRatio}%)
- 대출이자: ${expenses.loanInterest.toLocaleString()}원

### 현금 흐름
- 현재 잔액: ${cashBalance.toLocaleString()}원
- 예비비: ${reserveFund.toLocaleString()}원
- 3개월 후 예상 잔액: ${prediction.baseline.balanceIn3Months.toLocaleString()}원
${prediction.isAtRisk ? '⚠️ 3개월 내 현금 부족 위험 감지' : ''}

### 전월 대비 변동
- 매출: ${revenueGrowth > 0 ? '+' : ''}${(revenueGrowth * 100).toFixed(1)}%
- 매입: ${expenseGrowth > 0 ? '+' : ''}${(expenseGrowth * 100).toFixed(1)}%

### 대출 현황
- 총 대출잔액: ${loanBalance.toLocaleString()}원
- 월 상환액: ${monthlyPayment.toLocaleString()}원
  `;
}
```

---

## 11. CSV 자동 분류 엔진

엑셀 사용자들은 카드사/배달앱에서 CSV를 다운로드해서 수동으로 엑셀에 입력한다. sajang.ai는 이 과정을 자동화해야 한다.

### 11.1 CSV 파싱 → 트랜잭션 변환 규칙

```typescript
interface CSVParsingRule {
  source: 'card' | 'delivery_baemin' | 'delivery_coupang' | 'delivery_yogiyo' | 'bank';

  // 컬럼 매핑
  columnMapping: {
    date: string;            // 날짜 컬럼명
    content: string;         // 내용/가맹점명
    amount: string;          // 금액
    type?: string;           // 입금/출금 구분 (있는 경우)
  };

  // 자동 분류 규칙
  autoClassification: {
    // 키워드 → 카테고리 매핑
    rules: Array<{
      keywords: string[];
      categoryMajor: string;
      categoryMinor: string;
    }>;
  };
}

// 예시: 배민 CSV → 자동 분류
const baeminRule: CSVParsingRule = {
  source: 'delivery_baemin',
  columnMapping: {
    date: '결제일',
    content: '주문내역',
    amount: '결제금액',
  },
  autoClassification: {
    rules: [
      // 매출은 배달앱 정산 → 카테고리: 매출/배민
      { keywords: ['정산'], categoryMajor: '매출', categoryMinor: '배민' },
      // 배달 수수료
      { keywords: ['수수료', '광고비'], categoryMajor: '수수료', categoryMinor: '배달수수료' },
    ]
  }
};
```

---

## 12. 모듈 구조 요약

```
src/lib/kpi/
├── calculator.ts         -- MonthlyKPI 계산 (섹션 9.1~9.3)
├── ranking.ts            -- 카테고리 랭킹 엔진 (섹션 3.6~3.7)
├── trend.ts              -- 일별 누적/이동평균 (섹션 3.8)
├── survival-score.ts     -- 생존 점수 계산 (섹션 10.2)
├── cash-prediction.ts    -- 현금 고갈 예측 (섹션 10.3)
└── types.ts              -- 공통 타입 정의

src/lib/simulation/
├── engine.ts             -- What-If 시뮬레이션 (섹션 10.4)
└── scenarios.ts          -- 시나리오 타입 정의

src/lib/csv/
├── parser.ts             -- CSV 파싱 엔진 (섹션 11)
├── classifier.ts         -- 자동 분류 엔진
└── rules/
    ├── card.ts           -- 카드사 CSV 규칙
    ├── baemin.ts         -- 배민 CSV 규칙
    ├── coupang.ts        -- 쿠팡이츠 CSV 규칙
    └── bank.ts           -- 은행 거래내역 CSV 규칙

src/lib/ai/
├── financial-agent.ts    -- 재무 에이전트 메인
├── context-builder.ts    -- AI 컨텍스트 구성 (섹션 10.5)
└── prompts/
    ├── report.ts         -- 리포트 생성 프롬프트
    ├── alert.ts          -- 이상 감지 프롬프트
    └── simulation.ts     -- 시뮬레이션 해석 프롬프트

supabase/migrations/
├── 001_categories.sql    -- 카테고리/결제방법 (섹션 2.5)
├── 002_transactions.sql  -- 트랜잭션 테이블 (섹션 3.11)
├── 003_cashflow.sql      -- 입출금 내역 (섹션 5.4)
├── 004_payroll.sql       -- 인건비 (섹션 6.3)
├── 005_loans.sql         -- 대출관리 (섹션 7.4)
├── 006_budgets.sql       -- 예산 (섹션 8.2)
├── 007_kpi_functions.sql -- KPI SQL 함수 (섹션 9.4)
└── 008_seed_categories.sql -- F&B 기본 카테고리 시드
```

---

## 13. 엑셀 → sajang.ai 기능 매핑 요약

| 엑셀 기능 | 엑셀 수식 패턴 | sajang.ai 구현 | 에이전트 활용 |
|-----------|---------------|---------------|-------------|
| 소분류별 집계 | SUMIFS(금액, 대분류, 소분류, 날짜범위) | SQL GROUP BY + 필터 | 자동 리포트 |
| 결제방법별 집계 | SUMPRODUCT(카테고리매칭, 결제방법매칭, 금액) | SQL GROUP BY payment_method | 카드/현금 비율 분석 |
| 카테고리 랭킹 | RANK + VLOOKUP + 비율계산 | SQL RANK() OVER + percentage | 지출 우선순위 알림 |
| 일별 누적매출 | 날짜 시퀀스 + 누적SUM + 7일AVG | SQL window function | 매출 추이 차트 |
| 월평균 (동적) | IF(올해, 현재월까지AVG, 12개월AVG) | SQL 조건부 AVG | 예측 기반 |
| 예산 대비 실적 | VLOOKUP(카테고리, 월별시트) | budgets JOIN transactions | 과다지출 경고 |
| 잔액/예비비 | SUMIFS(입금) - SUMIFS(출금) | SQL SUM + 필터 | 현금 고갈 예측 |
| 대출 잔액 | 원금 - SUMIFS(상환기록) | SQL JOIN + SUM | 부채 비율 분석 |
| 인건비 월별 | SUMIFS(지급액, 월별날짜범위) | SQL GROUP BY month | 인건비율 경고 |
| **생존 점수** | ❌ 없음 | 복합 KPI 엔진 | **핵심 차별화** |
| **현금 고갈 예측** | ❌ 없음 | 3개월 시뮬레이션 | **핵심 차별화** |
| **What-If 시뮬레이션** | ❌ 없음 | 시나리오 엔진 | **핵심 차별화** |
| **CSV 자동 분류** | ❌ 없음 (수동 입력) | NLP 분류기 | **자동화 차별화** |
| **이상 지출 감지** | ❌ 없음 | 임계값 기반 알림 | **능동적 에이전트** |

---

## 14. 개발 우선순위 (Phase 0 MVP 기준)

MVP에서는 아래 3가지 코어 기능만 개발한다 (마스터플랜 Phase 0 참조).

1. **리포트 자동 생성** — 통합시트 + 요약 Data 수준의 월간 리포트를 AI가 자동 생성
2. **이상 지출 알림** — 카테고리별 전월 대비 비교, 업종 평균 대비 경고
3. **핵심 KPI 대시보드** — 생존 점수, 매출/매입/순수익, 랭킹 차트

이후 Phase에서 시뮬레이션, CSV 자동분류, 리뷰 연동을 추가한다.
