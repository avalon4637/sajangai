# SPEC-LANDING-001: Landing Page Rebuild

## Overview

| Field | Value |
|-------|-------|
| SPEC ID | SPEC-LANDING-001 |
| Title | Landing Page Full Rebuild (12-Section Conversion Page) |
| Phase | Phase 2 |
| Priority | P0 |
| Status | Planned |
| Reference | doc/sajangai_landing_page_plan.md |

## Problem Statement

The current landing page (`src/app/page.tsx`) has only 7 components (nav, hero, problem, solution, comparison, final-cta, footer) and uses outdated pricing (9,900 won/month). The plan calls for 12 high-conversion sections with KakaoTalk message mockups, scroll animations, ROI calculator visuals, agent team showcase, trial timeline, and FAQ. The page must be rebuilt to match the full conversion funnel design with updated pricing of **29,700 won/month (990 won/day)**.

### Existing Components Analysis

| Existing File | Plan Section | Status |
|---------------|-------------|--------|
| hero.tsx | S1 Hero | Rebuild (pricing update + mockup) |
| problem.tsx | S2 Problem | Rebuild (4-card layout) |
| solution.tsx | S3 Kick (body vs doctor) | Rebuild (comparison redesign) |
| comparison.tsx | (merged into S3) | Remove or merge |
| features.tsx | S4 Features | Rebuild (3-feature cards + mockups) |
| nav.tsx | Nav | Keep, minor update |
| final-cta.tsx | S11 Final CTA | Rebuild (pricing update) |
| footer.tsx | S12 Footer | Keep, minor update |
| mobile-cta.tsx | Floating CTA | Rebuild (pricing update) |
| revenue-preview.tsx | (not in plan) | Remove |
| trust.tsx | (not in plan) | Remove |
| ai-team.tsx | S7 Agent Team | Rebuild |
| faq.tsx | S10 FAQ | Rebuild (6 questions) |
| -- | S5 Insight Showcase | NEW |
| -- | S6 ROI Report | NEW |
| -- | S8 Pricing | NEW |
| -- | S9 Trial Timeline | NEW |
| -- | kakao-mockup.tsx | NEW (reusable) |

---

## Environment

- **Framework**: Next.js 16 App Router + React 19 Server Components
- **Styling**: Tailwind CSS 4.x + shadcn/ui (new-york)
- **Font**: Pretendard (Korean) via next/font or CDN
- **Target**: Mobile-first (375px base), responsive to desktop (1280px+)
- **Language**: Korean only (no English mixing in UI copy)
- **Colors**: Primary #1E40AF, Accent #F59E0B, Success #10B981, Danger #EF4444, BG #F8FAFC, Text #1E293B, Sub #64748B

## Assumptions

- A1: Users arrive via mobile (80%+); all layouts designed mobile-first
- A2: KakaoTalk message mockups are implemented in CSS/HTML, not images
- A3: Scroll animations use CSS/Intersection Observer, no heavy animation libraries
- A4: CTA navigates to `/signup` (existing auth flow)
- A5: No backend API calls from the landing page; it is a pure static page
- A6: shadcn/ui Accordion component is available for FAQ section

---

## Requirements (EARS Format)

### R1: Page Structure

**[Ubiquitous]** The landing page SHALL render 12 sections in the following order: S1 Hero, S2 Problem, S3 Kick, S4 Features, S5 Insight Showcase, S6 ROI Report, S7 Agent Team, S8 Pricing, S9 Trial Timeline, S10 FAQ, S11 Final CTA, S12 Footer.

**[Ubiquitous]** The landing page SHALL use Korean text exclusively; no English words in user-visible copy (use "AI 점장" not "AI Agent", "먼저 알려드려요" not "Proactive").

**[Ubiquitous]** All monetary amounts, percentages, and multipliers SHALL be displayed with `text-3xl font-bold` and Accent color (#F59E0B).

### R2: S1 Hero Section

**[Ubiquitous]** The hero section SHALL display the headline "하루 990원, 점장 한 명." with sub-copy "AI 점장이 매출 리뷰 비용을 매일 아침 카톡으로 챙겨드려요."

**[Ubiquitous]** The hero section SHALL contain a primary CTA button "7일 무료 체험 시작하기" linking to `/signup`.

**[Ubiquitous]** The hero section SHALL display "카드 등록 없이 바로 시작" below the CTA button as a reassurance message.

**[Ubiquitous]** The hero section SHALL include a KakaoTalk morning report mockup implemented in CSS (not an image).

**[Event-Driven]** WHEN the page loads, THEN the hero mockup image SHALL fade-in with a 0.5s delay.

### R3: S2 Problem Section

**[Ubiquitous]** The problem section SHALL display the heading "사장님, 혹시 이런 거 겪고 계시죠?" with 4 pain-point cards.

**[Ubiquitous]** The 4 pain-point cards SHALL be:
1. "배민 열어서 매출 확인하고 엑셀에 옮기고..." (time waste)
2. "리뷰 답글 하나하나 쓸 시간이 없어..." (review backlog)
3. "매출이 왜 떨어졌는지 모르겠어..." (no analysis)
4. "통신비가 왜 이렇게 많이 나오지..." (hidden costs)

**[Ubiquitous]** The section SHALL end with the summary line: "바빠서 못 챙기는 사이, 매출은 빠지고 리뷰는 쌓여요."

**[Event-Driven]** WHEN each card scrolls into view, THEN it SHALL animate with slide-up (stagger 0.15s between cards).

### R4: S3 Kick Section (Body Scale vs Doctor)

**[Ubiquitous]** The kick section SHALL display the heading "다른 서비스는 숫자만 보여줘요. 점장은 원인을 찾고, 해결까지 해요."

**[Ubiquitous]** The section SHALL show two comparison blocks:
- Top block (muted/gray): "다른 서비스 (체중계)" showing only "어제 매출 312,000원입니다." with "...끝."
- Bottom block (primary color border): "sajang.ai (주치의)" showing "매출이 32% 떨어졌어요. 원인은 리뷰 미답변 3건이에요. 지난달에도 같은 패턴이었어요. AI 답글 3건 준비했어요." with an action button.

**[Ubiquitous]** The section SHALL include the closing metaphor: "숫자만 보여주는 체중계가 아니라, 원인 진단 + 처방 + 약 타주는 주치의."

**[Event-Driven]** WHEN the section scrolls into view, THEN the top block (muted) SHALL appear first, followed by the bottom block (primary) sliding up after 0.5s.

### R5: S4 Features Section (3 Core Features)

**[Ubiquitous]** The features section SHALL display the heading "점장이 매일 하는 일" with 3 feature cards:
1. "매일 아침, 카톡으로 보고" -- auto-collect + KakaoTalk delivery
2. "문제가 생기면 먼저 알려줘요" -- proactive insight detection
3. "버튼 하나면 해결" -- one-click execution (review reply, SMS, promotion)

**[Ubiquitous]** Each feature card SHALL include a KakaoTalk/app mockup implemented in CSS.

**[Event-Driven]** WHEN each feature card scrolls into view, THEN it SHALL fade-in.

### R6: S5 Insight Showcase Section

**[Ubiquitous]** The insight showcase SHALL display the heading "점장이 이런 것까지 알려줘요" with 4 KakaoTalk message mockups in a horizontally scrollable container (mobile) or grid (desktop).

**[Ubiquitous]** The 4 showcase scenarios SHALL be:
1. Revenue drop + review correlation: "매출 -32%, 리뷰 미답변 3건 연관" with [답글 등록하기] button
2. Channel fee optimization: "쿠팡 비중 올리면 월 8만원 절감" with [프로모션 만들기] button
3. Regular customer churn: "단골 5명이 2주째 안 와요" with [문자 보내기] button
4. Labor cost ratio warning: "인건비 38%, 업종 평균 25%" with [시뮬레이션] button

**[Ubiquitous]** The section SHALL end with "...외 25가지 인사이트를 자동으로 감지해요".

**[State-Driven]** IF the viewport is mobile (< 768px), THEN the mockups SHALL be displayed in a horizontal scroll with snap behavior.

**[State-Driven]** IF the viewport is desktop (>= 768px), THEN the mockups SHALL be displayed in a 2x2 grid.

### R7: S6 ROI Report Section

**[Ubiquitous]** The ROI section SHALL display the heading "점장이 벌어준 돈, 매달 알려드려요".

**[Ubiquitous]** The ROI card SHALL show:
- Three metric blocks: "절약 47만원", "수익 28만원", "시간 6h"
- Cost line: "점장 월급 29,700원"
- Value line: "점장이 만든 가치 75만원"
- Highlight: "약 25배 회수" in Accent color (#F59E0B)

**[Ubiquitous]** The section SHALL include a footer note: "보수적 기준으로 계산해요. 과장 없이, 실제 데이터 근거로."

**[Event-Driven]** WHEN the ROI numbers scroll into view, THEN each number SHALL animate with a count-up effect (0 to target value).

### R8: S7 Agent Team Section

**[Ubiquitous]** The agent section SHALL display the heading "사장님을 위한 AI 직원 4명" with 4 agent cards in a 2x2 grid:
1. 점장 (Manager): 전체 조율, 리포트, 이상 알림
2. 답장이 (Review Manager): 리뷰 관리, AI 답글, 감성 분석
3. 세리 (Analyst): 매출 분석, 비용 감시, 시뮬레이션
4. 바이럴 (Marketer): 단골 관리, 문자 발송, 프로모션

**[Ubiquitous]** The section SHALL end with "4명이 24시간 사장님 매장을 지켜요."

### R9: S8 Pricing Section

**[Ubiquitous]** The pricing section SHALL display the heading "요금 안내" with a single pricing card.

**[Ubiquitous]** The pricing card SHALL show:
- Title: "점장 고용비"
- Price: "월 29,700원" (large) with "(하루 990원, 커피 한 잔 값)" subtitle
- Feature checklist (7 items with checkmarks):
  1. 매일 아침 카톡 리포트
  2. 매출 리뷰 비용 자동 분석
  3. 25가지 경영 인사이트
  4. AI 리뷰 답글 자동 생성
  5. 원클릭 실행 (답글/문자/프로모션)
  6. 월간 ROI 보고서
  7. 점장과 자유 대화
- CTA button: "7일 무료 체험 시작하기"
- Reassurance: "카드 등록 없이 자동 결제 없음 7일 후 직접 결정하세요"

**[Ubiquitous]** The section SHALL display the framing line: "구독료가 아니에요. 점장 월급이에요."

**[Unwanted]** The pricing section SHALL NOT use the word "구독" anywhere; use "점장 고용" or "점장 월급" instead.

### R10: S9 Trial Timeline Section

**[Ubiquitous]** The trial timeline SHALL display the heading "7일 동안 이런 경험을 하게 돼요" with a vertical timeline UI (left line + circle nodes).

**[Ubiquitous]** The timeline SHALL include 6 nodes:
- D+1: "첫 리포트" -- 어제 매출 + 미답변 리뷰 알림 -- "오 이게 되네"
- D+2: "첫 인사이트" -- "배달 느림 리뷰 2건, 답글 달까요?" -- "AI가 분석을 해주네"
- D+3: "재무 분석" -- 이번 주 매출 전주 대비 분석 -- "몰랐던 걸 알려주네"
- D+5: "마케팅" -- "단골 3명이 2주째 안 왔어요" -- "못 챙긴 걸 챙겨줌"
- D+6: "1주 성적표" -- 종합 리포트 + 점장 성과 요약 -- "이 정도면 쓸 만한데"
- D+7: "계약 종료" -- "오늘 자정에 점장이 퇴근해요" with [점장 계속 고용하기] button

**[Event-Driven]** WHEN timeline nodes scroll into view, THEN they SHALL appear sequentially with stagger animation.

**[State-Driven]** IF the timeline reaches D+6 and D+7 nodes, THEN those nodes SHALL use Accent color styling to emphasize conversion.

### R11: S10 FAQ Section

**[Ubiquitous]** The FAQ section SHALL use shadcn/ui Accordion component with 6 questions:
1. "배민/쿠팡 계정 정보 안전한가요?" -- 하이픈(금융보안 인증 업체)이 암호화 저장. sajang.ai는 비밀번호를 보관하지 않아요.
2. "매일 아침 카톡이 귀찮지 않을까요?" -- 사장님이 원하는 시간에, 원하는 스타일로 보내드려요. 설정에서 언제든 조정 가능해요.
3. "AI가 리뷰 답글을 잘 써주나요?" -- 사장님 매장 톤에 맞춰 작성하고, 등록 전에 항상 확인할 수 있어요. 마음에 안 들면 수정도 돼요.
4. "7일 체험 후 자동 결제되나요?" -- 아니요. 체험 끝나면 자동 종료. 사장님이 직접 고용 결정하셔야 해요.
5. "배달 안 하고 카드매출만 있어도 되나요?" -- 네. 카드매출만 연결해도 매출 분석, 비용 경고, 시뮬레이션 모두 사용 가능해요.
6. "ROI 보고서 숫자, 진짜인가요?" -- 보수적 기준으로 계산해요. 과장 없이 실제 데이터 근거로만 산출하고, 계산 방법도 투명하게 공개해요.

### R12: S11 Final CTA Section

**[Ubiquitous]** The final CTA SHALL display: "바쁜 사장님 대신 알아서 챙기는 AI 점장, 지금 만나보세요."

**[Ubiquitous]** The final CTA SHALL contain a large primary CTA button "7일 무료 체험 시작하기" with subtext "하루 990원 카드 등록 없음".

### R13: S12 Footer Section

**[Ubiquitous]** The footer SHALL display: "sajang.ai Agentra Inc." with links to Terms of Service, Privacy Policy, and Contact. Copyright: "2026 Agentra. All rights reserved."

### R14: Floating Mobile CTA

**[State-Driven]** IF the viewport is mobile (< 768px) AND the user has scrolled past the hero section, THEN a floating CTA button SHALL appear fixed at the bottom of the viewport.

**[Ubiquitous]** The floating CTA button SHALL display "7일 무료 체험 시작하기" and link to `/signup`.

### R15: CTA Placement Strategy

**[Ubiquitous]** The CTA "7일 무료 체험 시작하기" SHALL appear at least 5 times across the page:
1. S1 Hero (Primary)
2. S4 Features bottom (Secondary)
3. S8 Pricing (Primary)
4. S9 Trial bottom (Primary)
5. S11 Final CTA (Primary, large)
6. Floating mobile CTA (when applicable)

### R16: KakaoTalk Mockup Component

**[Ubiquitous]** A reusable KakaoTalk mockup component SHALL be implemented with:
- Chat background color: #B2C7D9
- Bubble color: #FEE500 (yellow)
- Profile icon + "점장" name
- Message content area (configurable via props)
- Action button area (configurable via props)

**[Unwanted]** KakaoTalk mockups SHALL NOT be implemented as static images; they must be HTML/CSS components.

### R17: Scroll Animations

**[Ubiquitous]** All scroll animations SHALL use Intersection Observer API or CSS `animation-timeline: view()` for performance.

**[Unwanted]** The landing page SHALL NOT use heavy animation libraries (e.g., framer-motion, GSAP) for scroll animations; CSS animations and Intersection Observer are sufficient.

**[Ubiquitous]** All animations SHALL be subtle: fade-in + slide-up only, with duration <= 0.6s.

### R18: Responsive Design

**[Ubiquitous]** All layouts SHALL be designed mobile-first (375px base) and scale up to desktop (1280px+).

**[Ubiquitous]** All CTA buttons SHALL have a minimum height of 48px (touch target).

**[Ubiquitous]** Body text SHALL use minimum 16px font size on mobile for readability.

**[Ubiquitous]** Korean text SHALL use `word-break: keep-all` to prevent mid-word line breaks.

### R19: SEO Metadata

**[Ubiquitous]** The page SHALL include the following metadata:
- title: "sajang.ai - 하루 990원, AI 점장이 매출 리뷰 비용을 챙겨드려요"
- description: "배민/쿠팡/요기요 매출 리뷰를 자동 분석하고, 문제가 생기면 먼저 알려주는 AI 경영 비서. 7일 무료 체험."
- og:image: KakaoTalk report mockup screenshot
- keywords: 소상공인 AI, 배달앱 매출 분석, 리뷰 자동 답글, AI 점장, 매장 관리 AI, 소상공인 경영 분석

### R20: Copy Standards

**[Unwanted]** The landing page SHALL NOT use English buzzwords (use Korean equivalents).

**[Unwanted]** The landing page SHALL NOT use exaggerated expressions ("혁신적", "세계 최초", "획기적").

**[Unwanted]** The landing page SHALL NOT expose technical jargon (no "AAAS", "LangGraph", "ROI" in copy; use "점장이 벌어준 돈" etc.).

**[Ubiquitous]** Each section's copy SHALL be 3 lines or fewer for the main message.

---

## Exclusions (What NOT to Build)

- Shall NOT implement server-side API calls from the landing page (pure static/SSG)
- Shall NOT include a blog, changelog, or documentation section on the landing page
- Shall NOT implement user authentication or dashboard preview on the landing page
- Shall NOT use stock images or illustrations; all visuals are CSS-rendered mockups
- Shall NOT implement i18n/multi-language support; Korean only
- Shall NOT implement A/B testing infrastructure in this SPEC (defer to separate SPEC)
- Shall NOT use framer-motion, GSAP, or any heavy animation library

---

## Milestones

### M1: Hero + Problem + Kick (S1-S3) -- First Impression
- Priority: High
- Rebuild hero-section.tsx with updated pricing (990 won/day)
- Rebuild problem-section.tsx with 4-card layout
- Merge solution.tsx + comparison.tsx into kick-section.tsx
- Create kakao-mockup.tsx reusable component
- Remove deprecated components (trust.tsx, revenue-preview.tsx)

### M2: Features + Insight Showcase (S4-S5) -- Product Demo
- Priority: High
- Rebuild features-section.tsx with 3 feature cards + KakaoTalk mockups
- Create insight-showcase.tsx with 4 scenario mockups
- Implement horizontal scroll with snap (mobile) / 2x2 grid (desktop)

### M3: ROI + Agents + Pricing (S6-S8) -- Conversion
- Priority: High
- Create roi-section.tsx with count-up animation
- Rebuild agent-team-section.tsx (from ai-team.tsx)
- Create pricing-section.tsx with updated 29,700 won pricing
- Verify "구독" word is never used

### M4: Trial + FAQ + CTA + Footer (S9-S12) -- Close
- Priority: Medium
- Create trial-timeline.tsx with vertical timeline UI
- Rebuild faq-section.tsx with shadcn Accordion (6 questions)
- Rebuild final-cta.tsx with updated pricing
- Update footer.tsx
- Rebuild floating-cta.tsx for mobile

### M5: Animations + Mobile Polish + SEO
- Priority: Medium
- Implement Intersection Observer scroll animations for all sections
- Verify mobile responsiveness at 375px, 390px, 414px breakpoints
- Update SEO metadata with new pricing
- Performance audit: page load < 3 seconds
- Update page.tsx to compose all 12 sections

---

## File Plan

```
src/app/page.tsx                        -- Landing page (Server Component, composes all sections)
src/components/landing/
  hero-section.tsx                       -- S1: Hero (REBUILD)
  problem-section.tsx                    -- S2: Problem cards (REBUILD)
  kick-section.tsx                       -- S3: Body scale vs Doctor (NEW, replaces solution + comparison)
  features-section.tsx                   -- S4: 3 core features (REBUILD)
  insight-showcase.tsx                   -- S5: KakaoTalk scenario showcase (NEW)
  roi-section.tsx                        -- S6: ROI report card (NEW)
  agent-team-section.tsx                 -- S7: 4 AI agents (REBUILD from ai-team.tsx)
  pricing-section.tsx                    -- S8: Pricing card (NEW)
  trial-timeline.tsx                     -- S9: 7-day trial timeline (NEW)
  faq-section.tsx                        -- S10: FAQ accordion (REBUILD)
  final-cta.tsx                          -- S11: Final CTA (REBUILD)
  footer.tsx                             -- S12: Footer (MINOR UPDATE)
  kakao-mockup.tsx                       -- Reusable KakaoTalk message component (NEW)
  floating-cta.tsx                       -- Mobile floating CTA button (REBUILD)
  nav.tsx                                -- Landing nav (MINOR UPDATE)
```

Files to remove:
- `src/components/landing/solution.tsx` (replaced by kick-section.tsx)
- `src/components/landing/comparison.tsx` (merged into kick-section.tsx)
- `src/components/landing/trust.tsx` (not in plan)
- `src/components/landing/revenue-preview.tsx` (not in plan)

---

## Technical Approach

### KakaoTalk Mockup Component API

```tsx
interface KakaoMockupProps {
  profileName?: string;        // default: "점장"
  messages: {
    icon?: string;             // emoji icon
    title?: string;            // bold title
    lines: string[];           // message lines
  }[];
  actions?: {
    label: string;             // button text
    variant?: "primary" | "secondary";
  }[];
  className?: string;
}
```

### Scroll Animation Strategy

- Use Intersection Observer with `threshold: 0.1`
- CSS classes: `opacity-0 translate-y-4` (initial) -> `opacity-100 translate-y-0` (visible)
- Stagger via `transition-delay` on child elements
- Count-up animation for ROI numbers via `requestAnimationFrame`

### Responsive Breakpoints

| Breakpoint | Target | Layout Notes |
|------------|--------|-------------|
| < 640px (sm) | Mobile phones | Single column, horizontal scroll for S5 |
| 640-768px (md) | Large phones / small tablets | 2-column where appropriate |
| 768-1024px (lg) | Tablets | 2-column grid for S5, S7 |
| >= 1280px (xl) | Desktop | Max-width container, wider spacing |

---

## Acceptance Criteria

### AC1: Page Structure

```gherkin
Given a user visits the landing page
When the page finishes loading
Then all 12 sections (S1-S12) are visible in order when scrolling
And the page load time is under 3 seconds (LCP)
```

### AC2: Pricing Accuracy

```gherkin
Given the landing page is rendered
When a user reads any pricing information
Then the price shown is "29,700원/월" or "990원/일"
And the word "구독" does not appear anywhere on the page
And the framing "점장 월급" or "점장 고용" is used instead
```

### AC3: CTA Functionality

```gherkin
Given a user is on the landing page
When the user clicks any CTA button
Then the user is navigated to /signup
And the CTA text reads "7일 무료 체험 시작하기"
```

### AC4: Mobile Responsiveness

```gherkin
Given a user views the page on a 375px mobile viewport
When the user scrolls through the page
Then no horizontal overflow exists
And all CTA buttons have minimum 48px touch height
And body text is at least 16px
And Korean text does not break mid-word
```

### AC5: KakaoTalk Mockups

```gherkin
Given the landing page renders KakaoTalk mockups
When a user views S4, S5, or S6 sections
Then the mockups are rendered in HTML/CSS (not images)
And the mockup background color is #B2C7D9
And the bubble color is #FEE500
And action buttons are visible within each mockup
```

### AC6: Scroll Animations

```gherkin
Given a user scrolls through the landing page
When a section enters the viewport
Then elements animate with fade-in and slide-up effects
And animation duration is <= 0.6s
And S2 pain-point cards stagger at 0.15s intervals
And S6 ROI numbers animate with count-up effect
```

### AC7: Floating Mobile CTA

```gherkin
Given a user is on a mobile viewport (< 768px)
When the user scrolls past the hero section
Then a floating CTA button appears fixed at the bottom
And the button text is "7일 무료 체험 시작하기"
And the button links to /signup
```

### AC8: Insight Showcase Responsiveness

```gherkin
Given a user views S5 Insight Showcase
When the viewport is mobile (< 768px)
Then 4 KakaoTalk mockups are horizontally scrollable with snap
When the viewport is desktop (>= 768px)
Then 4 KakaoTalk mockups are displayed in a 2x2 grid
```

### AC9: ROI Calculation Accuracy

```gherkin
Given the ROI section displays financial metrics
When a user reads the ROI card
Then the cost shows "점장 월급 29,700원"
And the value shows "점장이 만든 가치 75만원"
And the multiplier shows "약 25배 회수"
```

### AC10: SEO Metadata

```gherkin
Given a search engine crawls the landing page
When it reads the metadata
Then the title contains "990원" and "AI 점장"
And the description mentions "7일 무료 체험"
And og:image is defined
```

### AC11: FAQ Content

```gherkin
Given a user opens the FAQ section
When the user clicks an accordion item
Then the answer expands with animation
And all 6 FAQ questions are present
And the accordion uses shadcn/ui component
```

### AC12: No Heavy Dependencies

```gherkin
Given the landing page bundle is analyzed
When checking for animation libraries
Then framer-motion is not imported
And GSAP is not imported
And animations use CSS transitions and Intersection Observer only
```

---

## Design References

- **Toss**: Clean layout, number emphasis, whitespace, mobile-first
- **Danggeun Market**: Warm tone, everyday language, friendly feel
- **Cashknote**: SMB target audience UI (reference, but differentiate)

---

## Checklist (Post-Implementation)

- [ ] All 12 sections render without layout breaks on mobile (375px)
- [ ] Users understand the service within 3 seconds (S1 hero)
- [ ] KakaoTalk mockups look realistic (CSS, not images)
- [ ] Numbers (47만원, 25배, 990원) are visually prominent
- [ ] CTA buttons accessible during scroll at all times
- [ ] "7일 무료 체험" and "카드 등록 없음" are clearly visible
- [ ] Full page loads within 3 seconds
- [ ] Word "구독" appears zero times; "점장 고용/월급" used consistently
- [ ] All pricing reflects 29,700원/월 (990원/일)
- [ ] Old pricing (9,900원/330원) appears zero times
