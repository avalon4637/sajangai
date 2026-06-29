---
name: Development Workflow Rule - MANDATORY
description: CRITICAL - NEVER skip any step. SPEC-Design-Code must always be in sync. Commit after each SPEC completion. Deploy via vercel --prod.
type: feedback
---

## MANDATORY 7-Step Development Cycle (NEVER SKIP)

1. **SPEC** - Write/update SPEC document with requirements
2. **Design** - Update pencil-new.pen to reflect SPEC UI requirements
3. **Design Verify** - Screenshot every screen, check for visual issues
4. **Code** - Implement code matching the VERIFIED design exactly
5. **Code Verify** - Build test + SPEC-Design-Code sync check + Cleanup
6. **Commit** - git add + commit + push to GitHub
7. **Deploy** - Run `vercel --prod` from project root

## Core Principle: SPEC = Design = Code (Always in Sync)

At any point in time, these 3 must match:
- SPEC document describes WHAT to build
- pencil-new.pen shows HOW it looks
- Code implements EXACTLY what design shows

If any one changes, the other two must be updated.

## Deployment Rule

- Deploy command: `vercel --prod` (from c:/Users/E16/sajang.ai)
- NEVER use GitHub push for deployment (Vercel auto-deploy is unreliable)
- Always deploy after commit
- Verify deployment at https://sajang.ai after deploy

## Commit Rule

- Commit after EACH completed SPEC (not batch multiple SPECs)
- Use descriptive commit messages with SPEC ID
- Push to GitHub: `git push origin main`
- Then deploy: `vercel --prod`

**Why:** User corrected this workflow MULTIPLE TIMES. Violations cause drift between spec, design, and code. Deployment via vercel --prod is the only reliable method.

**Violations to avoid:**
- Starting code before design is in pencil-new.pen
- Skipping design verification screenshots
- Batching multiple SPECs into one commit
- Forgetting to deploy after commit
- Using git push alone expecting Vercel auto-deploy
