# 사장 AI — Agent Dashboard Design Specification
# Version: 1.0.0 | Date: 2026-04-03
# Designer: Agency Designer Agent

---

## 1. Design Tokens

### 1.1 Color Palette

```css
/* Core Brand */
--accent-blue:       #4B6BF5;   /* Primary action, active states */
--accent-blue-light: #EEF1FE;   /* Hover background, subtle highlight */
--accent-blue-dark:  #3451D1;   /* Pressed state, strong emphasis */

/* Backgrounds */
--bg-primary:        #FFFFFF;   /* Page background */
--bg-secondary:      #F8F9FA;   /* Section / sidebar background */
--bg-card:           #FFFFFF;   /* Card surface */
--bg-card-hover:     #F8F9FA;   /* Card hover */

/* Text */
--text-primary:      #18181B;   /* Headings, strong body text */
--text-secondary:    #71717A;   /* Labels, captions, secondary info */
--text-disabled:     #A1A1AA;   /* Disabled / placeholder */
--text-on-dark:      #F8FAFC;   /* Text on dark surfaces */

/* Borders */
--border-default:    #E4E4E7;   /* Card borders, dividers */
--border-strong:     #D4D4D8;   /* Input borders, stronger separation */

/* Semantic — Status */
--success:           #10B981;   /* 활성, 증가, 완료 */
--success-light:     #ECFDF5;   /* Success background */
--warning:           #F59E0B;   /* 주의, 이탈 위험 (중간) */
--warning-light:     #FFFBEB;   /* Warning background */
--error:             #EF4444;   /* 위험, 감소, 오류 */
--error-light:       #FEF2F2;   /* Error background */
--info:              #3B82F6;   /* 정보, 인사이트 */
--info-light:        #EFF6FF;   /* Info background */

/* Agent Brand Colors */
--agent-jeongjang:   #4B6BF5;   /* 점장 — Blue (authority, oversight) */
--agent-seri:        #10B981;   /* 세리 — Green (money, growth) */
--agent-dapjangi:    #F59E0B;   /* 답장이 — Amber (conversation, warmth) */
--agent-viral:       #8B5CF6;   /* 바이럴 — Purple (creativity, marketing) */

/* Dark Surface (브리핑 카드) */
--dark-surface:      #1E293B;   /* Dark card gradient start */
--dark-surface-2:    #334155;   /* Dark card gradient end */

/* ROI Highlight */
--roi-gold:          #D97706;   /* ROI 금액 강조 */
--roi-gold-light:    #FEF3C7;   /* ROI 배경 */
```

### 1.2 Typography Scale

```css
/* Font Family */
--font-base: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;

/* Scale — Desktop (1440px) */
--text-xs:   11px / line-height: 1.5;  /* 태그, 뱃지 레이블 */
--text-sm:   13px / line-height: 1.5;  /* 캡션, 보조 정보 */
--text-base: 14px / line-height: 1.6;  /* 기본 본문 */
--text-md:   15px / line-height: 1.6;  /* 강조 본문 */
--text-lg:   18px / line-height: 1.4;  /* 소제목 */
--text-xl:   22px / line-height: 1.3;  /* 섹션 제목 */
--text-2xl:  28px / line-height: 1.2;  /* KPI 숫자 */
--text-3xl:  36px / line-height: 1.1;  /* ROI KPI 강조 숫자 */
--text-4xl:  48px / line-height: 1.0;  /* 히어로 KPI */

/* Weights */
--weight-regular:   400;
--weight-medium:    500;
--weight-semibold:  600;
--weight-bold:      700;
```

### 1.3 Spacing System

```css
/* Base unit: 4px */
--space-1:   4px;
--space-2:   8px;
--space-3:   12px;
--space-4:   16px;
--space-5:   20px;
--space-6:   24px;
--space-8:   32px;
--space-10:  40px;
--space-12:  48px;
--space-16:  64px;

/* Component-specific */
--card-padding:      24px;
--section-gap:       24px;
--content-padding:   32px;
--sidebar-width:     240px;
```

### 1.4 Border Radius

```css
--radius-sm:    6px;    /* 버튼 (작은), 태그 */
--radius-md:    8px;    /* 버튼, 입력창 */
--radius-lg:    12px;   /* 카드 */
--radius-xl:    16px;   /* 큰 카드, 브리핑 블록 */
--radius-full:  9999px; /* 뱃지, 아바타 */
```

### 1.5 Shadows

```css
--shadow-xs:  0 1px 2px rgba(0,0,0,0.04);
--shadow-sm:  0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:  0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
--shadow-lg:  0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04);

/* Agent colored shadows */
--shadow-blue:   0 4px 16px rgba(75,107,245,0.18);
--shadow-green:  0 4px 16px rgba(16,185,129,0.18);
--shadow-purple: 0 4px 16px rgba(139,92,246,0.18);
```

---

## 2. Layout Grid

### 2.1 Page Layout (1440x900px, dashboard)

```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (240px)  │  MAIN CONTENT (1200px)           │
│                   │  padding: 32px                   │
│  ┌─────────────┐  │                                  │
│  │ Logo / Brand│  │  TOP BAR                         │
│  │             │  │  ─────────────────────           │
│  │ Agent Nav   │  │  CONTENT AREA                    │
│  │  · 점장      │  │                                  │
│  │  · 세리      │  │                                  │
│  │  · 답장이    │  │                                  │
│  │  · 바이럴    │  │                                  │
│  │             │  │                                  │
│  │ Data Nav    │  │                                  │
│  │  · 매출      │  │                                  │
│  │  · 지출      │  │                                  │
│  │  · 고정비    │  │                                  │
│  │             │  │                                  │
│  │ User Area   │  │                                  │
│  └─────────────┘  │                                  │
└─────────────────────────────────────────────────────┘
```

### 2.2 Sidebar Specification

```
Width: 240px
Background: #F8F9FA
Border-right: 1px solid #E4E4E7
Padding: 16px 12px

Sections:
  Brand area: height 56px, logo + "사장 AI" wordmark
  Nav divider label: 12px / semibold / #71717A / uppercase, margin-top 24px
  Nav item: 36px height, 10px radius, 12px horizontal padding
    - Default: text #18181B, background transparent
    - Hover: background #EAECF0
    - Active: background #EEF1FE, text #4B6BF5, font-weight 600
    - Active indicator: 3px left border, color = agent color
  Agent nav items (each with agent avatar circle, 24px):
    - 점장: avatar bg #EEF1FE, icon color #4B6BF5
    - 세리: avatar bg #ECFDF5, icon color #10B981
    - 답장이: avatar bg #FFFBEB, icon color #F59E0B
    - 바이럴: avatar bg #F3F0FF, icon color #8B5CF6
  User area: pinned to bottom, 72px height
    - Avatar (32px circle), 사업자명, plan badge ("점장 고용중")
    - Separator line above
```

---

## 3. Component Library

### 3.1 Buttons

```
PRIMARY BUTTON
  Background: #4B6BF5
  Text: #FFFFFF / 14px / semibold
  Padding: 8px 16px
  Radius: 8px
  Shadow: --shadow-blue
  Hover: background #3451D1
  Active: background #2A40BB

SECONDARY BUTTON
  Background: #FFFFFF
  Border: 1px solid #E4E4E7
  Text: #18181B / 14px / medium
  Padding: 8px 16px
  Radius: 8px
  Hover: background #F8F9FA

GHOST BUTTON
  Background: transparent
  Text: #4B6BF5 / 14px / medium
  Padding: 8px 16px
  Hover: background #EEF1FE

ICON BUTTON
  Size: 32x32px
  Background: transparent
  Border: 1px solid #E4E4E7
  Radius: 8px
  Hover: background #F8F9FA

CTA BUTTON (점장에게 질문)
  Background: #4B6BF5
  Text: #FFFFFF / 14px / semibold
  Padding: 8px 20px
  Radius: 8px
  Left icon: 💬 or chat icon
  Shadow: --shadow-blue
```

### 3.2 Cards

```
BASE CARD
  Background: #FFFFFF
  Border: 1px solid #E4E4E7
  Radius: 12px
  Padding: 24px
  Shadow: --shadow-sm
  Hover shadow: --shadow-md (transition 150ms)

KPI CARD
  Like base card, but:
  - Label: 13px / regular / #71717A, margin-bottom 8px
  - Value: 28px / bold / #18181B (large KPI)
  - Delta: 13px, color = success/error, prefix "+" or "↑↓"
  - Bottom: optional sparkline or sub-label

ROI KPI CARD (special — 점장 페이지 전용)
  Background: gradient (#F0F3FF → #FFFFFF)
  Border: 1.5px solid #C7D0FC
  Radius: 12px
  Padding: 24px
  Value: 36px / bold / #4B6BF5 (절약 금액)
  Shadow: --shadow-blue (subtle)
  Top accent: 3px top border, #4B6BF5
  Unit label: 13px / #71717A

AGENT STATUS CARD
  Background: #FFFFFF
  Border: 1px solid #E4E4E7
  Radius: 12px
  Padding: 20px
  Header: agent emoji (24px) + name (15px/semibold) + status badge
  Body: one-line summary, 13px / #71717A
  Footer: last updated time

BRIEFING CARD (dark)
  Background: linear-gradient(135deg, #1E293B 0%, #334155 100%)
  Radius: 16px
  Padding: 28px 32px
  Text: #F8FAFC
  Border: none
  Has: avatar circle (point agent), briefing text, CTA button

INSIGHT CARD
  Background: #FFFFFF
  Border-left: 4px solid (severity color)
  Radius: 10px (right side), 0 (left side)
  Padding: 16px 20px
  Types:
    - critical: border #EF4444, bg #FEF2F2 (subtle)
    - warning: border #F59E0B, bg #FFFBEB
    - info: border #4B6BF5, bg #EEF1FE
    - success: border #10B981, bg #ECFDF5

REVIEW CARD (답장이)
  Background: #FFFFFF
  Border: 1px solid #E4E4E7
  Radius: 10px
  Padding: 16px
  Left indicator: platform badge (배민/쿠팡/요기요 brand colors)
  Rating: star icons (filled/empty, amber)
  Status tag: right-aligned (미답변/AI완성/발행완료)

P&L CARD (세리)
  Background: #FFFFFF
  Border: 1px solid #E4E4E7
  Radius: 12px
  Padding: 24px
  Value: 28-36px / bold
  Very large number with unit (₩, 만, %)
  Delta row below value
```

### 3.3 Status Badges

```
ACTIVE (활동중)
  Background: #ECFDF5
  Text: #059669 / 12px / semibold
  Border: 1px solid #A7F3D0
  Radius: full
  Padding: 2px 10px
  Icon: green dot (8px, animated pulse)

WARNING (검토필요)
  Background: #FFFBEB
  Text: #B45309 / 12px / semibold
  Border: 1px solid #FDE68A

ERROR (이탈위험)
  Background: #FEF2F2
  Text: #DC2626 / 12px / semibold
  Border: 1px solid #FECACA

NEUTRAL (분석완료)
  Background: #F4F4F5
  Text: #52525B / 12px / semibold
  Border: 1px solid #D4D4D8

PLATFORM BADGE
  배달의민족: bg #1AC0FF (light), text #0A6EBD, "배민"
  쿠팡이츠: bg #FFF0E5, text #C75000, "쿠팡"
  요기요: bg #FFE8E8, text #CE1325, "요기요"
  카드: bg #F3F4F6, text #374151, "카드"
```

### 3.4 Navigation Top Bar

```
Height: 64px
Background: #FFFFFF
Border-bottom: 1px solid #E4E4E7
Padding: 0 32px
Contents:
  Left: Page title (18px / semibold / #18181B) + subtitle / agent label (13px / #71717A)
  Center: optional month selector (세리 페이지) or filter chips
  Right: notification bell icon + CTA button
```

### 3.5 Data Visualization

```
LINE CHART (세리 매출 트렌드)
  Background: transparent
  Grid: #E4E4E7 (horizontal only, dashed)
  Line: #4B6BF5, 2px stroke, smooth curve
  Area fill: gradient #4B6BF5 → transparent
  Dot: 6px circle, #4B6BF5 with white center
  X-axis: 12px / #71717A
  Y-axis: 12px / #71717A, right-aligned

BAR CHART (바이럴 채널별)
  Bar: rounded top (4px)
  Colors: agent color per category
  Gap between bars: 4px

DONUT CHART (답장이 감성 분포)
  Segments: success/warning/error colors
  Center: total count + label
  Legend: right-aligned, 13px

STAR RATING
  Filled: #F59E0B
  Empty: #E4E4E7
  Size: 16px
  Gap: 2px
```

---

## 4. Page Specifications

### 4.1 점장 대시보드 — Frame MQrgz

**Layout Overview (1440x900)**:
```
TOP BAR [64px]
  Left: "점장 · 종합 브리핑" (18px/semibold) | 2026년 4월 3일 목요일 (13px/#71717A)
  Right: [🔔 알림 (3)] [점장에게 질문 →] (primary button)

ROI KPI ROW [120px, 3 cards, full width]
  Card 1: 이번 달 절약 금액
    Value: ₩847,000 (36px/bold/#4B6BF5)
    Sub: 비용 최적화 + 리뷰 대응으로 절약
    Delta: ↑ 지난 달 대비 +₩123,000
    Icon: 💰
    Style: ROI KPI CARD (gradient border, blue top accent)
  Card 2: 절약 시간
    Value: 23시간 (36px/bold/#18181B)
    Sub: 리뷰 답글 + 매출분석 + 마케팅
    Delta: 이번 달 자동화
    Icon: ⏱️
    Style: ROI KPI CARD variant (success tone)
  Card 3: 처리한 업무
    Value: 142건 (36px/bold/#18181B)
    Sub: 인사이트 + 리뷰 + 메시지 발송
    Delta: 오늘 12건
    Icon: ✅
    Style: ROI KPI CARD variant

MAIN CONTENT AREA [remaining height, 2 columns: 65% left / 35% right]
  LEFT COLUMN:
    ── AGENT STATUS ROW [4 cards, horizontal scroll if needed]
      Each card (280px wide):
        Header: emoji + 에이전트명 + status badge
        Body: "오늘 리뷰 23건 자동 답글 완료" (13px/#71717A)
        Footer: "방금 전" timestamp (12px/#A1A1AA)
      Cards: 점장(blue), 세리(green), 답장이(amber), 바이럴(purple)

    ── MORNING BRIEFING CARD [dark, full width of left col]
      Background: gradient(135deg, #1E293B 0%, #334155 100%)
      Left: 점장 avatar (48px, blue circle, 🤖 emoji)
      Title: "오늘의 브리핑" (16px/semibold/#F8FAFC)
      Subtitle: "2026.04.03 오전 7:30" (12px/#94A3B8)
      Body: 3-4줄 분석 텍스트 (14px/1.6/#CBD5E1)
        "어제 배달 매출이 전주 대비 12% 증가했습니다. 특히 점심 피크타임 주문이 집중되고 있으니, 오늘은 런치 세트 메뉴를 배민 상단에 노출하는 것을 추천드립니다."
      CTA: "오늘 할 일 보기 →" (ghost button, white border)

  RIGHT COLUMN:
    ── INSIGHT FEED
      Title: "AI 인사이트" (15px/semibold) + "전체보기" link
      Insight cards (3):
        1. [error] "이탈 위험 고객 3명 감지됨"
           "14일 이상 방문 없음. 재방문 메시지 추천"
           [액션하기 →] button
        2. [warning] "이번 주 배달 수수료 급증"
           "배민 수수료가 목표 대비 18% 초과"
           [분석 보기 →] button
        3. [success] "리뷰 평점 0.3점 상승"
           "자동 답글 이후 긍정 리뷰 비율 증가"
           [세부 보기 →] button
```

**Design Notes for 점장**:
- ROI KPI row is the hero element — must feel premium and data-rich
- Briefing card provides the "AI is working for you" moment
- Insight feed shows actionable items, not just statistics
- Color coding: use agent colors for each agent status card header

---

### 4.2 세리 재무분석 — Frame MbKQm

**Layout Overview (1440x900)**:
```
TOP BAR [64px]
  Left: "세리 · 매출 분석" (18px/semibold) | 세리 badge (green dot, "분석완료")
  Center: [< 2025년 3월] [2026년 4월] [2026년 5월 >] month selector
  Right: [📊 리포트 다운로드] (secondary button)

P&L SUMMARY ROW [3 large cards, 120px]
  Card 1: 총 매출
    Value: ₩2,180만 (36px/bold/#18181B)
    Delta: +8.2% 전월 대비 (success, #10B981)
    Sub: 배달 ₩1,420만 | 카드 ₩760만
  Card 2: 순이익
    Value: ₩403만 (36px/bold/#10B981) ← green for profit
    Sub: 수익률 18.5%
    Delta: 목표 20% 대비 -1.5%p (warning)
    Micro progress bar: 18.5/20 filled (green)
  Card 3: 현금흐름
    Value: ₩312만 (36px/bold/#18181B)
    Sub: 30일 예측 기준
    Status badge: "안정" (success)

MAIN CONTENT [2 columns: 65% / 35%]
  LEFT:
    ── REVENUE CHART [full width of left col, 240px height]
      Title: "일별 매출 추이" (15px/semibold)
      Period selector: 7일/30일/90일 (chip tabs, default 30일)
      Line chart: blue line + area fill, daily data
      X-axis: 날짜 레이블
      Y-axis: 금액 (만원 단위)
      Hover tooltip: date + amount + delta

    ── COST BREAKDOWN [grid 2x2, 4 category cards]
      "비용 분석" section title
      Card 1: 인건비 — ₩680만 / 월
        Progress: 31.2% of 매출 (warning if >35%)
        Delta: +2.1% 전월
      Card 2: 재료비 — ₩420만 / 월
        Progress: 19.3% of 매출
        Delta: -1.2% 전월 (success)
      Card 3: 배달수수료 — ₩218만 / 월
        Progress: 10.0% of 매출
        Delta: +0.8% (neutral)
      Card 4: 임대료 — ₩220만 / 월
        Progress: 10.1% (fixed)
        Delta: — (고정비)

  RIGHT:
    ── SERI AI NARRATIVE CARD
      세리 avatar (40px, green circle)
      Title: "세리의 분석" (15px/semibold)
      Body text (14px/1.7, conversational):
        "이번 달 총 매출 2,180만원은 저번 달보다 8.2% 증가했어요.
        배달 앱 매출이 특히 강하게 올랐는데, 쿠팡이츠 주문이 전월 대비 15% 늘었습니다.
        다만 인건비가 목표 대비 살짝 높아지고 있어서 인력 스케줄 최적화를 추천드려요."
      CTA: "전체 리포트 보기 →"

    ── CASHFLOW FORECAST
      Title: "현금흐름 예측" + "AI 분석"
      3 rows:
        30일 후: ₩312만 (success badge)
        60일 후: ₩285만 (warning badge, "계절성 고려")
        90일 후: ₩340만 (info badge, "증가 예상")
      Small disclaimer: "배달앱 정산 주기 기준 예측"
```

**Design Notes for 세리**:
- Green color dominates (financial health)
- Large numbers must be immediately readable
- AI narrative card should feel warm and helpful, not robotic
- Cashflow forecast is actionable, not just informational

---

### 4.3 답장이 리뷰관리 — Frame f8NjC

**Layout Overview (1440x900)**:
```
TOP BAR [64px]
  Left: "답장이 · 리뷰 분석" (18px/semibold) | 답장이 badge (amber, "활동중")
  Center: filter chips [전체 (23)] [미답변 (5)] [AI대기 (3)] [발행완료 (15)]
  Right: [시작일 ~ 종료일] date range picker (secondary)

STATS ROW [4 cards, 80px]
  Card 1: 총 리뷰 — 23건 (이번 달)
    Sub: 일평균 2.3건
  Card 2: 평균 별점 — ★★★★☆ 4.2
    Visual: 5 star icons, filled/half/empty
    Delta: +0.3 전월 (success)
  Card 3: 감성 점수 — 78/100
    Sub: 긍정 68% / 중립 18% / 부정 14%
    Progress bar: three-segment (green/gray/red)
  Card 4: AI 자동답글률 — 91%
    Sub: 21/23건 자동 처리
    Mini badge: "절약 3.2시간"

MAIN CONTENT [2 columns: 45% / 55%]
  LEFT (Review Queue):
    Title: "리뷰 목록" + count badge
    Review list (scrollable, 5 visible):
      Each review item (hover highlight):
        [플랫폼 뱃지] [★★★★★] 김○○
        "음식이 정말 맛있었어요! 배달도 빠르고..."
        [시간] [상태 태그: 미답변/AI완성/발행완료]
        ─ separator
    Review items alternating selected state:
      Selected: background #EEF1FE, left border 3px #4B6BF5

  RIGHT (Review Detail + AI Reply):
    Selected review full text:
      [배민 뱃지] [★★★★★] 김철수 | 2일 전
      Full review text (14px, 1.7 leading)
      ─ divider
    "답장이 AI 추천 답글" section (amber accent):
      답장이 avatar + "답장이가 작성한 답글"
      Reply text box (editable, 14px):
        "안녕하세요! 맛있게 드셨다니 저도 기분이 좋네요 😊
        항상 신선한 재료로 정성껏 만들고 있습니다..."
      Action buttons:
        [✓ 발행하기] (primary/amber: #F59E0B bg, white text)
        [✏ 수정하기] (secondary)
        [↺ 재생성] (ghost)

BOTTOM ROW [2 sections side by side]
  Sentiment Distribution (donut chart, left):
    긍정 68% (#10B981)
    중립 18% (#E4E4E7)
    부정 14% (#EF4444)
    Center: "78점"

  Recurring Pattern Alert (right):
    Warning card (border-left amber):
    "반복 불만 키워드" badge
    Keyword tags: [배달 지연 ×5] [양이 적다 ×3] [포장 불량 ×2]
    CTA: "개선 액션 보기 →"
```

**Design Notes for 답장이**:
- Amber/warm color scheme (conversation, human touch)
- Review queue should feel like an email inbox
- AI reply area is the "money shot" — shows the core product value
- Sentiment donut chart is immediately scannable

---

### 4.4 바이럴 마케팅 — Frame 7xKDO

**Layout Overview (1440x900)**:
```
TOP BAR [64px]
  Left: "바이럴 · 마케팅" (18px/semibold) | 바이럴 badge (purple, "활동중")
  Right: [📢 메시지 보내기] (primary button, purple: #8B5CF6)

CHURN RISK SUMMARY [3 large alert cards, 110px]
  Card 1: 이탈 위험 고객 (critical)
    Value: 3명 (36px/bold/#EF4444)
    Sub: 21일+ 미방문 (위험)
    Background: subtle #FEF2F2
    Left accent: 4px #EF4444
  Card 2: 이탈 주의 고객
    Value: 5명 (36px/bold/#F59E0B)
    Sub: 14-21일 미방문
    Background: subtle #FFFBEB
    Left accent: 4px #F59E0B
  Card 3: 최근 재방문
    Value: 12명 (36px/bold/#10B981)
    Sub: 이번 주 재방문 성공
    Background: subtle #ECFDF5
    Left accent: 4px #10B981

MAIN CONTENT [2 columns: 55% / 45%]
  LEFT:
    ── CUSTOMER RISK LIST
      Title: "이탈 위험 고객 목록" + "전체 보기" link
      Table/card list:
        Headers: 고객 | 마지막 방문 | 위험도 | 채널 | 추천 액션
        Row 1 (critical): 김○○ | 25일 전 | [위험 🔴] | 배민 | [메시지 발송]
        Row 2 (critical): 이○○ | 22일 전 | [위험 🔴] | 쿠팡 | [메시지 발송]
        Row 3 (critical): 박○○ | 21일 전 | [위험 🔴] | 카드 | [쿠폰 발송]
        Row 4 (warning): 최○○ | 18일 전 | [주의 🟡] | 요기요 | [관찰 중]
        Row 5 (warning): 정○○ | 15일 전 | [주의 🟡] | 배민 | [관찰 중]
      Each row: hover highlight, click to select
      Selected row: highlighted in purple-tint

    ── CHANNEL PERFORMANCE
      Title: "채널별 활동"
      Horizontal bar chart:
        배민:   ████████░░ 42%
        쿠팡:   █████░░░░░ 28%
        요기요: ███░░░░░░░ 18%
        카드:   ██░░░░░░░░ 12%
      Colors: brand colors per platform

  RIGHT:
    ── MESSAGE PREVIEW PANEL (purple accent)
      Header: "바이럴 추천 메시지" + 바이럴 avatar
      Selected customer name: "김○○님에게"

      Message type tabs: [카카오 알림톡] [문자 (SMS)] [앱 푸시]

      Preview box (phone mockup frame):
        [카카오 알림톡 preview]
        발신: 맛있는 분식집 사장님
        "안녕하세요, 김○○ 고객님!
        오랫동안 뵙지 못했네요 😊
        이번 주 오시면 특별 할인 쿠폰을 드립니다.
        [지금 주문하기]"

      Estimated performance:
        예상 오픈율: 62% | 예상 방문율: 18%

      Action buttons:
        [📤 지금 발송하기] (primary/purple)
        [✏ 내용 수정] (secondary)
        [📅 예약 발송] (ghost)
```

**Design Notes for 바이럴**:
- Purple (#8B5CF6) dominates for creativity/marketing feel
- Churn risk cards use semantic colors urgently
- Message preview should feel like a real phone/kakao preview
- The "estimated performance" row adds data credibility to AI suggestions

---

## 5. Motion & Interaction Guidelines

```
TRANSITIONS
  Default: 150ms ease-out
  Card hover: 200ms ease (shadow lift)
  Page transition: 200ms fade + 8px slide up
  Number counter: 800ms ease-out (count up animation on load)

LOADING STATES
  Skeleton: #F4F4F5 base, #E4E4E7 shimmer, 1.5s loop
  Spinner: 20px, #4B6BF5, 1s linear infinite

MICRO-INTERACTIONS
  Button press: scale(0.97) 100ms
  Card select: border color transition + shadow lift
  Badge pulse (활동중): 0 0 0 0 rgba(16,185,129,0.6) → 0 0 0 6px transparent, 2s infinite

NUMBER FORMATTING (Korean)
  ₩847,000 → "₩84.7만" for large numbers
  Use 억/만 units consistently
  Always show won symbol (₩) for amounts
```

---

## 6. Accessibility

```
CONTRAST RATIOS (WCAG 2.1 AA minimum)
  Text on white: #18181B on #FFFFFF = 18.1:1 (AAA) ✓
  Secondary text: #71717A on #FFFFFF = 4.5:1 (AA) ✓
  White on blue: #FFFFFF on #4B6BF5 = 4.7:1 (AA) ✓
  White on green: #FFFFFF on #10B981 = 3.2:1 — use #FFFFFF on #059669 for AA compliance
  White on purple: #FFFFFF on #8B5CF6 = 3.5:1 — use #FFFFFF on #7C3AED for AA compliance

FOCUS STATES
  All interactive elements: 2px solid #4B6BF5, 2px offset
  Never remove outline completely

SEMANTIC HTML TARGETS
  Page title: <h1>
  Section titles: <h2>
  Card titles: <h3>
  Data labels: <label> or aria-label
  Status badges: role="status"
  Charts: aria-label describing the data
```

---

## 7. Korean UX Copy Guidelines

```
TONE
  점장 (Supervisor): 권위 있고 차분한 브리핑 톤
    "오늘 배달 매출이 전주 대비 12% 증가했습니다."
  세리 (Financial): 정확하고 친근한 분석가 톤
    "이번 달 수익률이 18.5%예요. 목표에 거의 다 왔어요!"
  답장이 (Review): 따뜻하고 공감하는 서비스 톤
    "고객이 배달 속도에 불만이 있었네요. 이런 답글 어떠세요?"
  바이럴 (Marketing): 활기차고 행동 지향적인 마케터 톤
    "김○○ 고객님이 3주째 안 오셨어요! 지금 잡을 수 있어요 🎯"

NUMBERS
  Use 만/억 for Korean large number formatting
  Always show percentage change with arrow: ↑8.2% or ↓3.1%
  Time relative: "방금 전", "3분 전", "2시간 전", "어제"

STATUS LABELS
  활동중 (Active — green)
  분석완료 (Analysis complete — neutral)
  검토필요 (Review needed — warning)
  이탈위험 (Churn risk — error)
  처리중 (Processing — blue)
```

---

## 8. Implementation Notes for Builder

### Technology Stack
- Next.js 16, React 19, Tailwind CSS 4.x, shadcn/ui (new-york)
- Recharts for data visualization
- Agent pages: `src/app/(dashboard)/agents/`
- Components: `src/components/agents/`

### Priority Order
1. 점장 대시보드 (core hub — highest impact)
2. 세리 재무분석 (most data-rich — core product)
3. 답장이 리뷰관리 (highest visible AI value)
4. 바이럴 마케팅 (retention focus)

### Responsive Considerations
- These specs are for 1440px desktop
- Mobile breakpoint (375px): sidebar collapses to bottom tab bar
- Tablet (768px): sidebar collapses, main content full-width
- KPI rows stack vertically on mobile

### Data State Strategy
- Use skeleton loading states while agent data loads
- All KPI numbers should support count-up animation on mount
- Agent status cards should show real-time "last updated" timestamps
- Mock data provided in spec can be used for initial implementation
```

---

*Generated by Agency Designer Agent | sajang.ai v1.0 | 2026-04-03*
