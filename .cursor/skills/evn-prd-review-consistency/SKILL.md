---
name: evn-prd-review-consistency
description: >-
  Finds internal contradictions in an EVN PRD (FR vs Behavior Examples, phases
  vs Must, terms, numbers, Out of Scope vs Must). Use when the user asks for
  PRD consistency, 矛盾, 不整合, 整合性, mâu thuẫn PRD, or a pre-review quality
  pass. Template coverage: evn-prd-review-checklist. Code:
  evn-prd-tech-lead-review.
---

# EVN PRD consistency review

Port of [payment-specs `review-prd-consistency`](https://github.com/raksul/payment-specs/blob/main/.claude/skills/review-prd-consistency/SKILL.md), retargeted to the two-layer EVN PRD. Architecture / sequence / repo-checklist checks belong in TRD, not this skill.

Read [../evn-prd-create/references/prd.md](../evn-prd-create/references/prd.md) for section names.

## Steps

### 1. Load the full PRD

Path, Notion URL, **suggestion child**, or chat draft. If the live page is 1–4 only, fetch the open `Suggestion —` child (full 1–9) and review **that**. Do not fail a live high-level page for missing AC.

### 2. Collect contradictions (do not show them all at once)

1. **FR vs Behavior Examples** — AC values, conditions, and expected behavior must match the Behavior Examples table. A Must that the examples contradict is a contradiction.
2. **Phases vs Must** — something listed as MVP / Phase 1 in section 5 must not be “later only” in section 6 (or the reverse). Could-haves must not be required to ship the named MVP.
3. **Out of Scope vs Must** — section 3 non-goals must not reappear as Must AC. Product principles must not be contradicted by an AC.
4. **Open questions vs decided text** — Decided Q&A contradicted by an Open Question or AC; resolved Product/Delivery OQ not reflected in FR/phases; unresolved OQ written as decided FR or principle.
5. **Should/Could vs Must** — same requirement in two priority buckets with different wording.
6. **Terms** — same concept, different names (e.g. DirectMail vs DM vs ダイレクトメール) when it would confuse implementers. Ignore です/ます style.
7. **Numbers** — thresholds, counts, KPIs, dates used in more than one place (Goals vs AC vs Behavior Examples vs RAID).

Do **not** require repos vs sequences or text vs Mermaid. If architecture/sequence/technical NFR leaked into the PRD, mention once (“belongs in TRD”) and skip diagram-vs-FR matching — `evn-prd-review-checklist` item 9 owns that fail.

Skip Payment-only “data model section vs FR” unless the PRD actually contains a data model (it should not; design is out of PRD).

### 3. Resolve one at a time

Highest impact first. Format:

```
**Contradiction N: [title]**

[Where — section names]

> A: [quote]

> B: [quote]

[Why this is a contradiction]

Options:
- **A**: …
- **B**: …
- **C**: …
```

After the user picks: edit the draft everywhere it applies (text + tables), then the next contradiction.

When none remain, say so. Do not publish to Notion. Do not dump harness JSON.
