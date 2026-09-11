---
name: evn-prd-tech-lead-review
description: >-
  Reviews an EVN PRD against production code in local DirectMail, IHA,
  Order Hub, and BDD clones (not payment-specs git submodules). Use when the
  user asks for a Tech Lead review, 技術レビュー, implementation feasibility,
  or to pair the PRD with raksul-directmail before In Review. Checks AC and
  Behavior Examples vs code — not architecture diagrams (those are TRD).
  Do not modify production clones. PRD-only checks:
  evn-prd-review-checklist and evn-prd-review-consistency.
---

# EVN Tech Lead PRD review

Port of [payment-specs `tech-lead-review`](https://github.com/raksul/payment-specs/blob/main/.claude/skills/tech-lead-review/SKILL.md), scoped to the two-layer EVN PRD.

Read [../evn-prd-create/references/repositories.md](../evn-prd-create/references/repositories.md) and [../evn-prd-create/references/prd.md](../evn-prd-create/references/prd.md). Code lives at `/Users/v.nguyen/dev/<repo>`, **read-only**. Missing clone: skip that repo and say so.

If the user points at a live Docs page with only sections 1–4, fetch the open suggestion child (full 1–9) and review **that**. Do not review a high-level 1–4 page as if it were In Review.

This skill does **not** review architecture, sequence `【新規】`, technical NFR, or repo checklists on the PRD. If those are missing, recommend a **TRD**. If they leaked into the PRD, say so and do not nitpick the diagrams — move them to TRD.

## Steps

### 1. Grasp the PRD

Sections 3–7: product stance, stories, phases, FR / AC, Behavior Examples, delivery constraints (RAID, migration-at-requirement-level). Ignore release/rollback (out of PRD). Ignore leaked architecture if present except to flag “belongs in TRD”.

### 2. Explore code in parallel

Task explore on local clones that the AC / Behavior Examples imply (see repositories.md):

- Controllers / services / models / Vue routes the behavior would touch
- State machines / enums
- Call chains (DM → Order Hub → IHA → Enterprise / session) **as current facts**
- Schema facts already in the DB (do not propose table design in the PRD)
- Existing BDD coverage for the path

### 3. Gap list (keep internal until Step 4)

1. **AC feasibility** — a Must that current products/APIs cannot satisfy without an unstated product change
2. **Behavior Examples vs actual behavior** — rounding, timezone, boundaries, empty list, caps
3. **Assumed data** — tables/columns/enums/FKs the PRD treats as existing that do not, or the reverse
4. **User-visible compatibility** — existing clients (Order Hub, IHA, Enterprise, Flipper) that an AC would break
5. **Auth / PII** — only when an AC or principle implies it (who can see/do what), not a full security design
6. **Migration requirement** — who/which data in section 7 vs what exists in prod

Do **not** score: architecture diagrams, `【新規】` labels, performance SLAs, API versioning, repo checklists, column suffix conventions (Payment `review-prd-data-model` was not ported). Put those on the TRD recommendation.

### 4. One finding at a time

High → medium → low:

```
**Finding N [High/Med/Low] — [category]: [title]**

[Why it matters]

> PRD: [quote]

> Code (`/Users/v.nguyen/dev/<repo>/path:line`): [quote]

Options:
- **A**: Change the PRD to match code
- **B**: Keep the PRD; implement later
- **C**: Open Question (Product or Delivery)
- **D**: Defer to TRD (architecture / 【新規】 / technical NFR)
```

After a choice: edit the **PRD draft** if A/C requires it; never edit production. Then the next finding.

### 5. Summary

```
## Tech Lead review

- Target:
- Date:
- Findings: High x / Med y / Low z
- PRD edits / implement-later / skipped / defer-to-TRD

[One or two sentences on requirement feasibility]

TRD next (if needed): architecture, sequences with 【新規】, technical NFR, affected repos.
```

## Guardrails

- Evidence from code, not vibes
- Report diffs only
- No Spec Kit, no full TRD body, no production patches
- Do not add Mermaid back into the PRD to “complete” a Payment-style review
