---
name: UI Redesign Progress (SPEC-UI-003)
description: Frontend full redesign progress - 4 agent pages design + evaluator feedback + user feedback for next session
type: project
---

## UI Full Redesign Status (2026-04-03, Updated)

**Why:** Backend (4 AI agents, insight engine, Hyphen API) is 100% complete but frontend only shows ~20% of capabilities. Full UI redesign needed.

### Current Status: CODE IMPLEMENTATION IN PROGRESS
- Evaluator: 1st 62(FAIL) → 2nd 77.5(PASS) → 3rd Final Fix List → P0 5건 Pencil 반영 완료
- Fix list saved: doc/specs/SPEC-UI-003-fix-list.md
- Key design decisions:
  - 점장 = Chat-first (ChatGPT style, proactive agent messages)
  - 세리 = Calendar-first (daily revenue input/view)
  - 바이럴 = 추후 재설계 (SNS 컨텐츠 생성 컨셉으로 변경 예정)
  - CTA policy: Indigo for execution, Gray for review, Red for danger, Green for confirm

### Code Implementation Progress
- [DONE] 점장 채팅 페이지 — 빌드 통과
  - src/components/jeongjang/roi-kpi-strip.tsx (ROI KPI 상단 스트립)
  - src/components/jeongjang/chat-message.tsx (채팅 메시지 컴포넌트: briefing/alert/text)
  - src/components/jeongjang/jeongjang-chat-hub.tsx (채팅 허브 클라이언트)
  - src/app/(dashboard)/dashboard/page.tsx (서버 페이지 — 기존 대시보드 교체)
  - src/app/(dashboard)/dashboard/page-legacy.tsx (기존 대시보드 백업)
- [TODO] 세리 달력 페이지
  - 기존 /analysis 경로에 구현
  - 달력 컴포넌트 + KPI 상단 + 우측 세리 AI 패널
  - 기존 getDailyRevenues 쿼리 재활용
- [TODO] 답장이 리뷰 페이지
  - 기존 /review 경로 강화
  - AI 답글 미리보기/발행/수정 기능
  - 감성 분포 바 + 반복 키워드 카드

**How to apply:** Resume from this state in next session. Load design-spec.md and Pencil file for context.

### Completed Work
1. SPEC-UI-002 infra: mobile-header dynamic name, not-found.tsx, sonner toast, settings tab layout
2. Backend-Frontend gap analysis (detailed report in evaluator agent output)
3. design-spec.md created at doc/specs/design-spec.md (full 4-page specification)
4. Pencil design: 4 agent pages drafted in pencil-new.pen (Pencil app default path)
   - Frame IDs: MQrgz (점장), MbKQm (세리), f8NjC (답장이), 7xKDO (바이럴)
5. Design exported to design/ folder as PNG

### Evaluator Score: 62/100 (FAIL)
5 Critical/High issues found:
1. CRITICAL: 세리 chart placeholder (no actual chart)
2. CRITICAL: 답장이 bottom section missing (sentiment + keywords) — partially fixed (sentiment bars added)
3. HIGH: CTA button color conflict (blue/yellow/purple per agent)
4. HIGH: 바이럴 channel activity chart missing
5. HIGH: 세리 cost analysis progress bars missing

### User Feedback (MUST incorporate in next iteration)

**Feedback 1 - 점장 = Chat-First UI:**
- NOT a simple dashboard. Must be chat-centric like ChatGPT/Claude
- Chat window is the primary interface where 점장 proactively reports
- Reports, risk notifications, daily briefings arrive IN the chat as messages
- User responds with selection-based actions (like Claude's tool use UI)
- Think: KakaoTalk-like chat where AI agent initiates conversations
- Current design (dashboard with cards) misses this core concept

**Feedback 2 - 세리 = Calendar-Based Revenue Input:**
- Calendar view showing daily revenue is the most basic/important feature
- Users need to SEE and INPUT daily revenue on a calendar
- This is more important than charts or AI narrative
- Think: Calendar with revenue amounts per day, click to edit

### Design Changes Needed (for next session)
1. Redesign 점장 page: Chat-first layout (70% chat / 30% sidebar summary)
   - Chat messages include: briefing cards, alert cards, action cards
   - Selection-based responses (approve/reject/defer buttons in chat)
   - Keep ROI KPI as header, but main area = chat
2. Redesign 세리 page: Calendar-first layout
   - Large calendar with daily revenue amounts
   - Click day to input/edit revenue
   - Summary stats around calendar edges
   - AI narrative as secondary panel
3. Fix 5 evaluator issues
4. Unify CTA color policy (recommend: all primary CTAs blue, agent colors for accents only)

### Files Modified (uncommitted)
- src/app/(dashboard)/layout.tsx — MobileHeader now receives businessName + subscriptionStatus
- src/app/(dashboard)/mobile-header.tsx — Dynamic user name + subscription badge
- src/app/not-found.tsx — New 404 page
- src/app/layout.tsx — Sonner Toaster added
- src/app/(dashboard)/settings/layout.tsx — New settings layout with tab nav
- src/app/(dashboard)/settings/settings-nav.tsx — Tab navigation component
- src/app/(dashboard)/settings/page.tsx — Removed duplicate header
- doc/specs/design-spec.md — Full design specification
- doc/specs/SPEC-UI-002.md — Original SPEC (superseded by redesign)
- design/*.png — Exported design screenshots
- pencil-new.pen (in Pencil app path) — 4 agent page designs

### Next Session Action Plan
1. Load this memory + design-spec.md
2. Redesign 점장 in Pencil: Chat-first UI with proactive agent messages
3. Redesign 세리 in Pencil: Calendar-first revenue view
4. Fix remaining evaluator issues (바이럴 chart, CTA colors)
5. Run evaluator again (target: 75+)
6. Write SPEC-UI-003 document
7. Implement in Next.js code
