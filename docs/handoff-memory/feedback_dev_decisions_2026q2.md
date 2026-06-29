---
name: Q2 2026 Development Decisions
description: Key architecture and workflow decisions for sajang.ai Phase 0-4 development cycle
type: feedback
---

AI SDK maintained as agent framework; LangGraph conversion deferred until core features are production-ready.
**Why:** Current AI SDK (Vercel) works well for Supervisor + Sub-Agent pattern. Migration cost ~2-3 weeks not justified yet.
**How to apply:** Build all agent features with @ai-sdk/anthropic. Plan LangGraph migration as separate SPEC when core is stable.

SPEC-based management over weekly sprints.
**Why:** User finds weekly cadence too slow; prefers feature-complete deliverables.
**How to apply:** Each development unit = 1 SPEC with clear acceptance criteria. Track progress per SPEC, not per week.

Insight cards first, then KakaoTalk integration.
**Why:** User wants to see the "kick" (visual insight cards) working in-app before connecting external messaging.
**How to apply:** Prioritize F3 insight engine + UI cards. KakaoTalk report delivery is Phase 2+.

Hyphen API integration: last step after all other features work.
**Why:** Monthly cost ~110,000 KRW. Must ensure payment module and all features are fully working before incurring ongoing costs.
**How to apply:** Complete payment (PortOne), all core features, and QA first. Hyphen integration is the final development step. If API costs become excessive post-launch, consider self-built crawling as alternative.

App (native) conversion planned for last phase using Capacitor.
**Why:** Web app must be fully stable before wrapping. Only need push notifications + deep links from native shell.
**How to apply:** Build everything as responsive web-first. Add Capacitor SPEC after all web features are complete. No native-specific code until then.
