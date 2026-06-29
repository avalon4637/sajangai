---
name: No design-to-code sync
description: Do not sync Pencil designs with code unless explicitly requested - code is the source of truth
type: feedback
---

Do not synchronize Pencil (.pen) design files with developed code.

**Why:** At the current stage, code changes too fast (features added/removed/changed constantly). No external team reviews the designs. The code itself serves as the latest design document.

**How to apply:** Only use Pencil for NEW screen designs that don't exist yet. Never reverse-sync from code to Pencil. If design review is needed, use `npm run dev` screenshots instead.
