---
name: evn-prd-review-checklist
description: >-
  Reviews an EVN PRD against the two-layer PdM/PjM template plus EVN Definition
  of Ready (Figma or no UI, RAID, User Types, BDD vs manual, numbered AC). Use
  when the user asks to review a PRD checklist, PRD quality, チェックリスト,
  レビューして, kiểm tra PRD, or Definition of Ready before In Review. Internal
  contradictions: evn-prd-review-consistency. Code fit:
  evn-prd-tech-lead-review.
---

# EVN PRD checklist review

Adapted from [payment-specs `review-prd-checklist`](https://github.com/raksul/payment-specs/blob/main/.claude/skills/review-prd-checklist/SKILL.md) plus EVN DoR. EVN does **not** score Payment NFR or system-sequence items on the PRD — those belong in TRD.

Read [../evn-prd-create/references/prd.md](../evn-prd-create/references/prd.md). Related PRDs live in Notion Docs (Tags `EVN`), not `specs/`.

## Steps

### 1. Load the PRD

Use the path, Notion URL, suggestion child, or chat draft. If none, ask. If the live page is 1–4 only, prefer the open suggestion for In Review scoring.

### 2. Score each item Pass / Fail

High-level PdM live page (**sections 1–4 only**, no 5–9) is **Pass-with-note** (“waiting PjM”), not a fail — except item 9 (leaked TRD content), which always fails if present. Score AC / phases / RAID as Pass-with-note when those sections are absent on a 1–4 page.

Run this checklist on the **full suggestion (1–9)** before In Review, not only on live 1–4.

**1. Related PRDs** — Search Docs for overlapping EVN/Directmail (or IHA) PRDs. Pass if no contradiction or none related. Fail with quotes if they conflict.

**2. Out of Scope** — Pass if Out of Scope has ≥1 concrete item with a why (not `-` or “later”). On 1–4-only live page, TBD is Pass-with-note.

**3. Product stance** — PdM layer is decision-grade enough to complete, not a title:

- Section 2: one-sentence problem (need, not “add a filter”). Evidence may be TBD on high-level live; required (or TBD explicit) on the full suggestion.
- Section 3: goals, why-now (or §2 why-now). Full suggestion: **one** primary KPI (fail six equal metric rows), product guardrail **or** TBD, at least one principle/non-negotiable **or** TBD.
- Assumptions in §2: present **or** explicit TBD (user/business only; fail Kafka/schema as an “assumption”)

Fail empty stance, a solution posing as the problem, or a KPI table with many undifferentiated rows on a **full** draft.

**4. Testable FR** — Must-haves are numeric, conditional, or yes/no. Fail “make it easier” / missing subject. Missing section 6 on live 1–4: Pass-with-note.

**5. Behavior Examples** — If date/money/state logic exists: need happy path + ≥1 boundary, each with condition / concrete example / expected behavior. If no such logic, Pass and say so. Missing on live 1–4: Pass-with-note.

**6. Release phases** — Section 5 has MVP vs later (or one phase named), whether it ships independently, **Audience** (User Types / CS vs sender), and **Appetite** (points or “fits one sprint / needs split”). Empty / `-` on a full draft: Fail. Absent on live 1–4: Pass-with-note.

**7. RAID / deps / points** — Section 7 names dependencies (UI Kit, Order Hub, Flipper, DTP, CS) or RAID; story points 1–8 or Open Question. Absent on live 1–4: Pass-with-note.

**8. EVN DoR** (thin)

- Why/What present (EN; JP summary OK)
- AC numbered (or TBD)
- Figma URL or “no UI” (or TBD)
- User-type impact (or TBD)
- BDD page or explicit manual ACs (or TBD)

**9. No TRD leak** — Fail if the PRD contains architecture/sequence Mermaid, `【新規】` diagrams, per-service implementation-scope table, technical NFR (response time, throughput, SLA, API versioning), or a repo-design checklist. Rewrite suggestion: move that block to TRD.

### 3. Report

```
## EVN PRD checklist

| # | Check | Result | Note |
|---|---|---|---|
| 1 | Related PRDs | Pass or Fail | |
| 2 | Out of Scope |  | |
| 3 | Product stance |  | |
| 4 | Testable FR |  | |
| 5 | Behavior Examples |  | |
| 6 | Release phases |  | |
| 7 | RAID / deps / points |  | |
| 8 | EVN DoR |  | |
| 9 | No TRD leak |  | |
```

Fail (and Pass-with-note) items: quote + rewrite suggestion.

### 4. Fixes

If anything failed, ask whether to edit. Fix one item at a time in the draft (chat or file). Do not publish to Notion. Do not add architecture back to “fix” a Payment-style sequence check.

## Guardrails

Judge quality, not just headings. Always give a concrete rewrite. Do not invent harness JSON.
