# EVN PRD template

EVN two-layer PRD (PdM Why/What + PjM phase/AC/RAID). Inspired by [payment-specs `.claude/rules/prd.md`](https://github.com/raksul/payment-specs/blob/main/.claude/rules/prd.md) and [PRD for DM * VN dev](https://app.notion.com/p/2fb41a31f12d80f096e6eb334d4acba0). **Not** a 1:1 Payment port: architecture, sequences, technical NFR, and repo checklists belong in **TRD**, not this PRD.

**SoT for Payment process:** GitHub payment-specs. **SoT for an EVN PRD document:** Notion Docs (not git).

## Language

- Body: **English** (tickets and AC are English per EVN DoR).
- **Japanese executive summary** at the top of Overview (PdM: `s.nonaka`).
- Words EN/JP glossary in Overview (keep from [PRD for DM * VN dev](https://app.notion.com/p/2fb41a31f12d80f096e6eb334d4acba0); do **not** apply that template as-is).

## Ownership

One Notion URL, two states. PdM (`s.nonaka` only) writes **live 1–4** via the Notion Skill **EVN PRD PdM high-level**. PjM completes **1–9** in Cursor and **Proposes**; `s.nonaka` approves. `k.kuno` is not in this EVN PRD workflow.

PjM **may edit 1–4** in the suggestion when needed (stance vs AC, audience, assumptions, measurable KPI). Changelog must split product (1–4) vs delivery (5–7). PjM never writes the live body.

| Sections | Owner | Live after PdM | Suggestion after PjM |
|---|---|---|---|
| 1–4 | `s.nonaka` first; PjM may edit via suggestion | Required, high-level, TBD OK | Same or PjM-edited |
| 5–7 | PjM (`v.nguyen` / `ly.hkk`) via suggestion | **Absent** (do not paste TBD 5–9) | Required |
| 8–9 | Shared on the full draft | Absent on live high-level | Required |
| TRD | Tech Lead | After approved full PRD | Architecture, `【新規】`, technical NFR, repos |

## Do not put in the PRD

Release plan, rollback, Spec Kit scope, table design, migration **steps**, batch design, implementation method.

Also **do not** put (these go to TRD — see appendix):

- Mermaid architecture or sequence diagrams, including `【新規】` labels
- Implementation-scope table (New / Existing reuse / Out of scope **per service**)
- Technical NFR (response time, throughput, API versioning, SLA)
- Affected-repository checklist and constraints from existing code
- Schema / batch / backfill design

Product-facing constraints stay in the PRD (principles, out of scope, RAID, who/which data is in a migration). Do not specify how to implement.

Do not write Created / Author / Notion URL into the Notion **body** — those are page properties. Chat/file drafts may keep a short header; strip it before publish.

## EVN DoR (ticket may enter sprint)

From [QA / BDD Hub](https://app.notion.com/p/3c141a31f12d8147b453cedebac49d0f):

- Why / What in PRD or Linear (EN; JP source OK if EN summary exists)
- Acceptance criteria numbered and testable
- Figma or “no UI” stated
- Dependencies named (UI Kit, Order Hub, Flipper, DTP, CS) and unblocked or RAID’d
- Story points (1–8; split if 8+)
- Test notes: BDD page or explicit manual ACs
- User-type impact vs User Types on the [EVN dashboard](https://app.notion.com/p/1c0b3184c9e84518a5a0c8510cdcc7dd)

RAID: [EVN RAID Log](https://app.notion.com/p/cb0893f95d1d451a8ce2ab9438420b11).

PdM high-level live page is **sections 1–4 only**. PjM fills 5–9 (and may edit 1–4) on a suggestion. Sequence `【新規】` and feasibility of **how** to build live in the TRD, not this PRD.

## Status (Payment analogue)

There is no Status select on EVN Docs. Track review in Linear comments + suggestion accept/reject. Payment statuses for context only: Draft → In Review → Approved → In Development → Done.

## Template (two states; Notion body starts at section 1)

**Live after PdM:** paste **sections 1–4 only** (through Users and stories). Do not add 5–9 headings, even as `TBD`.

**Suggestion after PjM:** full sections 1–9 below. High-level TBD inside 1–4 is OK on the PdM page; PjM tightens them in the suggestion when delivery needs it.

Draft in chat uses the full 9-section form. Strip any chat header before publish.

````markdown
# PRD - [project code] - [full name]

## 1. Overview

PdM. No diagrams.

### Executive summary (日本語)

（PdM向け。2〜4文。何を作るか、なぜ今、誰が使うか。）

（2–3 sentences in English: what this feature does.）

### Words

| Word | Word (JP) | Description |
|---|---|---|
|  |  |  |

## 2. Background and problem

PdM. Problem first, then evidence — not a solution.

### Problem (one sentence)

Need, solution-agnostic. NG: “add a filter.”

### Current state

### Evidence

3–5 bullets: ticket volume, CS quote, current workaround, lost time. Not a novel.

-

### Why now

### Assumptions

User/business only. NG: Kafka, schema, API design. Examples: CS still approves; senders already have this list in DM.

-

## 3. Goals, success metrics, and product stance

PdM. This section is the product viewpoint: what success looks like and which trade-offs are already decided.

### Goals

-

### Success metrics (KPI)

One **primary**. Optional secondary = one extra row, not six equal KPIs.

| Kind | Metric | Current | Target | How measured |
|---|---|---|---|---|
| Primary |  |  |  |  |
| Secondary (optional) |  |  |  |  |

### Guardrails (product)

User-visible; must not get worse. NG: API p95, SLA, throughput (TRD). Examples: CS tickets do not rise; wrong-price rate does not rise.

-

### Product principles / non-negotiables

Decisions that implementers must not reopen without PdM. Examples: do not change price; CS still approves manually; do not touch IHA.

-

### Out of scope

Each item needs a why (non-goal, not “later”).

-

## 4. Users and stories

PdM. Value-level stories — not acceptance criteria. Do not replace User Types with free personas.

### Who (not everyone)

Map to the EVN dashboard User Types list. Name who is **out** of this audience.

-

### User journey

5–8 user-visible steps, current vs future. No service Mermaid.

| Step | Current | Future |
|---|---|---|
| 1 |  |  |

### Story list

Each story: User Types `As a…` plus one job story.

1.
```
As a [user type],
I want to [action],
So that [value].
When [situation], I want to [motivation], so I can [outcome].
```

2.

## 5. Release phases

PjM. MVP vs later; which slice can ship independently. Inspired by Function / Phase on PRD for DM * VN dev — do not copy that template as-is.

Audience = User Types / CS vs sender in this phase. Appetite = story points or “fits one sprint / needs split.”

| Phase | In this phase | Audience | Appetite | Ships independently? | Depends on |
|---|---|---|---|---|---|
| MVP / Phase 1 |  |  |  | Yes/No |  |
| Later |  |  |  |  |  |

## 6. Functional requirements

PjM. Must be testable. NG: “make it easier”. OK: “complete in 3 clicks or fewer”. Number AC as AC-1, AC-2, …

### Must have

- [ ] AC-1:
- [ ] AC-2:

### Should have

- [ ]

### Could have

- [ ]

### UI

- Figma: (URL) **or** no UI

### Behavior Examples

Required when behavior depends on date, time, period, money, counts, or state. Format: condition → concrete input → expected behavior. Include happy path **and** boundaries (month-end, zero, cap, empty list). This table is the QA coverage bar (lesson: raksul/raksul-sysout#401).

| # | Condition | Concrete example | Expected behavior |
|---|---|---|---|
| 1 |  |  |  |
| 2 |  |  |  |

## 7. Delivery constraints

PjM. Delivery viewpoint: RAID, dependencies, points — not how to implement.

### RAID / dependencies

Name UI Kit, Order Hub, Flipper, DTP, CS when involved; RAID if unblocked is not true. [EVN RAID Log](https://app.notion.com/p/cb0893f95d1d451a8ce2ab9438420b11).

-

### Story points

(1–8, or Open Question. Split if 8+.)

### User-type impact

(One line vs dashboard User Types.)

### Test notes

- BDD page: (URL or “create with bdd-feature-test-plan”) **or** explicit manual ACs

### Migration (requirement level)

Who / which data is in scope; whether users need relief. Not batch design.

-

## 8. Risks and open questions

Shared.

### Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
|  | High/Med/Low | High/Med/Low |  |

### Decided Q&A

2–5 already-decided questions. Example: “Do we change price? No.”

-

### Open questions

#### Product

- [ ]

#### Delivery

- [ ]

## 9. References

- Notion PRD: (fill after publish)
- Related PRDs:
- Figma:
- Linear:
- TRD / BDD: (after PRD)
````

## Conciseness

Every sentence should help a reviewer decide or an implementer know what “done” means. Do not repeat the same decision in many sections. Keep Behavior Examples — they prevent misread (lesson: raksul/raksul-sysout#401). Do not compensate by putting architecture back into Overview. One primary KPI; extra metrics belong in a dashboard link, not six table rows.

## After the PRD (do not run Spec Kit)

Suggest: **TRD** (see appendix), BDD page, then [feature-doc-synthesis](https://app.notion.com/p/3c141a31f12d8183b397d20f4e1df169) for user stories. `feature-doc-synthesis` **reads** the PRD and TRD — this pack runs **before** it.

## PdM QA of Behavior Examples (Payment)

When a QA/BDD list exists, PdM checks every Behavior Examples row is covered (including boundaries), concrete values match, and extra QA cases are either valid or added back to the PRD.

## Appendix: Moved to TRD

Tech Lead writes these after the PRD. Do not duplicate them in the PRD body.

- Architecture Mermaid (`flowchart` / `graph`; no ASCII)
- Main sequences (2–4 flows) with **【新規】** vs existing reuse
- Implementation scope table: New / Existing reuse / Out of scope **per service**
- Technical NFR: performance (response time, throughput), security (AuthN/AuthZ, PII, audit), availability (SLA / fallback), compatibility (API versioning, Order Hub / IHA / Enterprise consumers)
- Affected repositories checklist (DirectMail, IHA, Order Hub, BDD, Enterprise / session / UI Kit edges)
- Constraints from existing code (facts only)
- Migration **implementation** (batch, schema, backfill, rollback)

User-visible or product-level constraints (who must migrate, “CS still approves”, RAID dates, assumptions) stay in PRD sections 2, 3 and 7.
