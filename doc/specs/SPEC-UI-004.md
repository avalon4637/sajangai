# SPEC-UI-004: Design Quality Overhaul (5.4 → 8.0+)

## Goal
Professional-grade UI polish to achieve design score 8.0+ (from current 5.4).
Target: Korean SaaS tier (comparable to 채널톡, 뱅크샐러드 level).

## Score Gap Analysis

| Area | Current | Target | Gap | Priority |
|------|---------|--------|-----|----------|
| Visual Hierarchy | 5.0 | 8.0 | +3.0 | Phase 1+2 |
| Color System | 5.5 | 8.0 | +2.5 | Phase 1 |
| Spacing & Layout | 4.5 | 8.0 | +3.5 | Phase 1 |
| Component Quality | 5.0 | 8.0 | +3.0 | Phase 2+3 |
| Landing Conversion | 6.0 | 8.5 | +2.5 | Phase 2 |
| Dashboard UX | 6.5 | 8.0 | +1.5 | Phase 3 |
| Professional Polish | 5.0 | 8.0 | +3.0 | Phase 2+3 |

## Phase 1: Quick Wins (5.4 → 6.5) — 13 items

### P1-1. Bug fixes
- [ ] Review page ISO date format → "4월 4일 14:00"
- [ ] Survival gauge bar color: dynamic by score (0-30 red, 31-60 yellow, 61-100 green)

### P1-2. Spacing normalization
- [ ] Landing section gaps: normalize to 80px (currently 48px~160px)
- [ ] Hero bottom padding: 120px → 64px
- [ ] Insight showcase 4 cards: equal min-height

### P1-3. Icon upgrade
- [ ] Problem section emoji → Lucide icons (😰→Frown, 😫→Clock, 😤→TrendingDown, 🤔→HelpCircle)
- [ ] Feature number badges: emoji circles → styled number badges
- [ ] Settings tab icons: increase size 16px → 20px

### P1-4. CTA additions
- [ ] Add mid-page CTA after features section
- [ ] Add floating CTA button (mobile: bottom sticky)
- [ ] Landing pricing section: add price comparison table

### P1-5. Color consistency
- [ ] Unify accent: blue-600 primary only, remove green border on billing
- [ ] Dashboard KPI bar: simplify to 2 colors (green=up, red=down)

## Phase 2: Landing Redesign (6.5 → 7.5) — 8 items

### P2-1. KakaoTalk mockup redesign
- [ ] Realistic kakao chat background (#B2C7D9 gradient)
- [ ] Proper profile avatar with agent emoji
- [ ] Device frame (iPhone mockup) wrapping the chat
- [ ] Smooth shadow and rounded corners matching real kakao

### P2-2. Social proof section
- [ ] "현재 OO개 매장이 점장과 함께합니다" counter
- [ ] 3 persona-based testimonial cards (스크린골프장 사장님, 카페 사장님, 치킨집 사장님)
- [ ] Trust badges: "SSL 보안", "데이터 암호화", "언제든 해지"

### P2-3. Product screenshot section
- [ ] Dashboard screenshot in browser mockup frame
- [ ] Analysis page screenshot showing survival gauge
- [ ] "실제 대시보드를 미리 보세요" section between features and pricing

### P2-4. Section flow optimization
- [ ] Remove or merge redundant sections (problem + kick → one section)
- [ ] Clearer section transitions with subtle dividers
- [ ] Scroll-triggered fade-in animations (intersection observer)

## Phase 3: Dashboard Polish (7.5 → 8.0+) — 6 items

### P3-1. Empty state redesign
- [ ] Chat page: centered card-style suggested prompts (not bottom chips)
- [ ] Chat page: onboarding guide messages from 점장 on first visit
- [ ] All pages: proper empty states with illustrations

### P3-2. Component consistency
- [ ] Button variants: Primary(filled), Secondary(outlined), Ghost(text)
- [ ] Badge system: all rounded-full with uniform padding
- [ ] Card shadows: unified elevation system (sm, md, lg)

### P3-3. Sidebar refinement
- [ ] Agent icons: consistent 32x32 illustration style
- [ ] Active state: left border accent + background tint
- [ ] Section grouping visual hierarchy improvement

## Acceptance Criteria
- [ ] Design audit re-score >= 8.0
- [ ] All landing sections have consistent 80px spacing
- [ ] Zero emoji usage in UI (except chat content)
- [ ] Social proof section with 3+ testimonials
- [ ] KakaoTalk mockup in device frame
- [ ] All buttons follow 3-variant system
- [ ] Mobile 375px: no layout breaks

## Execution Strategy
- Phase 1: Direct fixes (sub-agent parallel)
- Phase 2: Landing components (sub-agent parallel)
- Phase 3: Dashboard components (sub-agent parallel)
- Each phase: build verify → deploy → re-audit
