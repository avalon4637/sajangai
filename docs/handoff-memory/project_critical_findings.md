---
name: Critical Audit Findings (2026-04-03)
description: Security and quality issues found by critical review - must address before production deployment
type: project
---

CRITICAL security issues found that block production deployment.
**Why:** Audit revealed IDOR vulnerabilities, overly permissive RLS INSERT policies, missing rate limiting on AI API routes, and hardcoded UI elements.
**How to apply:** Always check doc/TODO.md P0 section before any deployment discussion. SEC items must be resolved first. When touching API routes, verify auth + business ownership. When adding tables, always include RLS.

Key findings:
- insight_events/action_results INSERT WITH CHECK(true) = anyone can insert to any business
- /api/insights/act has no business ownership check (IDOR)
- ai_feedback table has no RLS at all
- No rate limiting on Claude API routes (/api/chat, /api/ai)
- 51 silent catch {} blocks throughout codebase
- Sidebar hardcodes "김사장님" and "점장 고용 중" for all users
- Missing error boundaries (no error.tsx files)
- .env.local.example only has 3 of 12+ required env vars
