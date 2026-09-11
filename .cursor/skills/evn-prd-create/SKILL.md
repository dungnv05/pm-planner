---
name: evn-prd-create
description: >-
  Completes an EVN PRD in Cursor after PdM has a high-level Notion page
  (sections 1–4). PjM fills 5–9 and may edit 1–4 when needed, then proposes a
  suggestion for s.nonaka. Use when the user asks to complete a PRD, điền AC,
  phases, RAID, hoàn thiện PRD, or finish a PdM draft. New high-level PRDs:
  Notion Skill “EVN PRD PdM high-level” (s.nonaka). Publish: evn-prd-publish
  Propose (not Create). Reviews: evn-prd-review-checklist,
  evn-prd-review-consistency, evn-prd-tech-lead-review.
---

# EVN PRD create (PjM complete)

PdM writes sections **1–4** on Notion (skill **EVN PRD PdM high-level**, `s.nonaka` only). This Cursor skill **completes** that page into a full 1–9 draft. Architecture / sequences / technical NFR stay in **TRD**.

**This skill does not create the Docs page.** After the draft is confirmed, use `evn-prd-publish` **Propose**. Do not Create. Do not treat Spec Kit as PRD creation.

Read [references/prd.md](references/prd.md), [references/repositories.md](references/repositories.md), [references/payment-specs-workflow.md](references/payment-specs-workflow.md), and [references/pdm-notion-skill.md](references/pdm-notion-skill.md) before writing.

If the user is `s.nonaka` asking for a **new** high-level PRD (no page yet), point them at the Notion Skill — do not run this pass.

## Workflow

### Step 1: Require the live PRD

Need a **Notion Docs URL** whose body already has sections 1–4.

No URL → ask. Do not interview as PdM. Do not invent a blank 1–4.

Fetch the live page. If it has only 1–4 (or 5–9 missing), that is expected. If it is empty, stop and send PdM to the Notion Skill.

### Step 2: Interview (PjM)

Ask **2–3 questions per turn**. Default: keep PdM wording in 1–4.

**Always**

1. Release phases (MVP vs later; what can ship independently)
2. Audience + appetite per phase (User Types / CS vs sender; points or “fits one sprint / needs split”)
3. Testable AC (Must / Should / Could)
4. Behavior branches (date, money, state, counts)
5. RAID / dependencies (UI Kit, Order Hub, Flipper, DTP, CS)
6. Story points (1–8); Figma or no UI; BDD vs manual

**Edit 1–4 when needed** (not forbidden): AC contradicts stance, audience wrong, missing assumption, KPI not measurable, journey too vague to accept. Ask about that gap; do not silently rewrite Why/What.

### Step 3: Research

Search Notion Docs (Tags `EVN`) for related PRDs.

Explore **in parallel** with Task explore on local clones `/Users/v.nguyen/dev/<repo>` so AC, Behavior Examples, and any 1–4 edits match current behavior. Do not use payment-specs `repos/` submodules. Do not modify those clones. Do **not** put architecture, sequences, repo checklists, or technical NFR in the PRD.

If a clone is missing, say which one and continue.

### Step 4: Generate

Follow [references/prd.md](references/prd.md) (9 sections). English body + JP executive summary + Words EN/JP.

- **1–4:** PdM baseline, or PjM-edited text when Step 2 found a gap. High-level TBD in 1–4 may stay TBD unless the edit was specifically to fill that gap.
- **5** Release phases with Audience + Appetite.
- **6** FR Must/Should/Could + numbered AC + Behavior Examples when logic branches.
- **7** RAID / deps / points / user-type / test notes / migration-at-requirement-level.
- **8** Risks; decided Q&A; open questions split Product vs Delivery.
- **9** References (live Notion URL, related PRDs, Figma, Linear, TRD/BDD after).

No release plan / rollback / Spec Kit / implementation design / architecture diagrams / technical NFR.

### Step 5: Confirm then Propose

Show the draft. Call out **product (1–4)** vs **delivery (5–7)** diffs vs the live page.

Then run / offer `evn-prd-publish` **Propose** immediately (still ask before any Notion write). Changelog must separate 1–4 edits from 5–7. Do not Create a new Docs page. Do not write the live body.

Reviews (on this **full** draft / suggestion, not on live 1–4 only): `evn-prd-review-checklist`, `evn-prd-review-consistency`, `evn-prd-tech-lead-review`. After `s.nonaka` approves: TRD, then BDD.

## Self-check

- [ ] Live Notion URL fetched; 1–4 used as baseline
- [ ] Full sections 1–9 in the draft
- [ ] 1–4: kept PdM text **or** edited with a stated reason
- [ ] FR testable; Behavior Examples when logic branches
- [ ] Release phases with Audience + Appetite
- [ ] RAID / deps / points
- [ ] No architecture, sequence, `【新規】` diagram, technical NFR, or repo-design table
- [ ] Next step is Propose, not live overwrite

## Guardrails

- Production clones: read-only
- Do not write Notion or Linear here (Propose skill does that)
- Do not create `specs/` in payment-specs or a new evn-specs repo
- Do not write TRD content into the PRD
- Do not mention `k.kuno` as EVN PRD approver
