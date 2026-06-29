---
name: User feedback - review reply workflow
description: Field user feedback on review management pain points and approved solution direction
type: project
---

Real user feedback collected 2026-04-06:

1. Users want to reply to reviews directly from sajang.ai without visiting each platform separately
2. Non-delivery restaurants want Naver Place review collection + reply support

Approved approach: AI draft + clipboard copy + deep link to platform review page
- No RPA/browser automation (too risky: account bans, maintenance burden)
- No Chrome extension for now (Phase 2 consideration)
- Deep link targets: ceo.baemin.com, store.coupangeats.com, ceo.yogiyo.co.kr, smartplace.naver.com

**Why:** Users' #1 pain point is switching between platforms to reply to reviews. Even without auto-posting, copy + direct link saves significant time.
**How to apply:** When improving 답장이 UI, add [Copy reply] + [Go to reply page] buttons per review. Include in SPEC for review management improvements.

## Naver Place Review Crawling (Differentiator)
- Hyphen does NOT support Naver Place → this is our unique selling point
- Public review pages (no login required) → low risk server-side crawling
- VIP beta: 10 stores total, 2 are non-delivery restaurants needing Naver Place support
- Crawl target: place.naver.com/restaurant/{id}/review (public page)
- Frequency: 1x/day per registered store
- Flow: Store registers Naver Place URL → server crawls → 답장이 generates reply → copy + smartplace deep link
- Priority: Develop and validate before launch with VIP 2 stores
- **Strategic value:** Strong first impression for non-delivery restaurants, covers gap Hyphen can't fill
