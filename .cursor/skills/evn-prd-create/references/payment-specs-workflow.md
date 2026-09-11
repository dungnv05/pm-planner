# Payment PRD workflow (source of truth)

Ported from private GitHub [raksul/payment-specs](https://github.com/raksul/payment-specs) (`main`). Read that repo when `gh` can access it; do not invent a different Payment process.

## What payment-specs is

A PdM workspace: PRDs, prototypes, BigQuery, KARTE, Claude rules/skills. **Spec Kit is not used to create PRDs.** Spec Kit lives in implementation repos (`raksul-pay`, `payment`) **after** the PRD is Approved.

Canonical files:

- [README.md](https://github.com/raksul/payment-specs/blob/main/README.md)
- `.claude/CLAUDE.md`
- `.claude/rules/prd.md` — 9-section template + QA review of Behavior Examples
- `.claude/rules/notion.md`
- `.claude/rules/git-workflow.md`
- `.claude/skills/create-prd/SKILL.md`

## Create one PRD (Payment)

1. Clone with `--recurse-submodules`. `repos/` is production code, **read-only**.
2. In repo root, trigger skill `create-prd` (keywords: PRD作成, 要件定義, etc.).
3. Skill interviews (2–3 questions at a time) → Explore `repos/` in parallel → write `specs/YYYY-MM-kebab-name/prd.md` from `rules/prd.md`.
4. **create-prd SKILL.md says Notion is out of scope** (file only). README also says a Notion page is created. Operational split: file first; Notion via `rules/notion.md`.
5. Notion Payment PRD DB status: `Draft → In Review → Approved → In Development → Done`. In Review **must** include the implementing engineer (Behavior Examples interpretation, sequence `【新規】` vs existing, feasibility). Copy to git as SoT at **Approved**. Merge `main` when Approved + ≥1 review.
6. Branch: `feature/{issue}-{slug}` / `fix/{issue}-{slug}`. Conventional Commits. PR must include Notion URL + issue.

## Template (9 sections) — Payment

Overview (+ Mermaid architecture/sequence + 新規 / 既存踏襲 / 対象外) → Background (現状 / 課題 / なぜ今) → Goals / KPI / Out of Scope → User Stories → FR Must / Should / Could + **Behavior Examples** (condition / concrete example / expected behavior, including boundaries) → NFR → Technical Considerations (**constraints only**, not design) → Risks / Open Questions → References.

Do **not** put release plan, rollback, Spec Kit scope, table design, or implementation method in the PRD.

**EVN does not copy this layout.** EVN PRD sections are PdM 1–4 (Overview / Background / stance / stories) then PjM 5–7 (phases / FR+Behavior Examples / delivery). Architecture, sequences with `【新規】`, technical NFR, and repo checklists go to **TRD**. Canonical EVN template: [prd.md](prd.md).

## Payment skills (do not port all to EVN v1)

Create: `create-prd`. Review: `review-prd-checklist`, `review-prd-consistency`, `review-prd-data-model`, `tech-lead-review`, `slim-prd`, `legal-review`. Orchestrate: `review-prd-harness`. After: `review-notion-comments`, `estimate-tshirt`, `create-software-asset`.

EVN v1 does **not** port: harness, legal, estimate, software-asset, data-model, slim, review-notion-comments.

## EVN differences

- No `evn-specs` GitHub repo. SoT = Notion Docs DB + Linear ENPRVN.
- Research local clones under `/Users/v.nguyen/dev/`, not payment-specs `repos/` submodules. Cursor `evn-prd-create` is **PjM complete** (explores clones to ground AC / Behavior Examples). PdM 1–4 is the Notion Skill **EVN PRD PdM high-level** (`s.nonaka` only).
- Language: English body + Japanese executive summary.
- **Two-state PRD** on one Notion URL: live after PdM = sections 1–4; suggestion after PjM = full 1–9 (PjM may edit 1–4). Tech Lead writes TRD after the full PRD is approved. Not 1:1 with Payment’s Overview Mermaid / NFR / Technical Considerations.
- Approve is `s.nonaka` only (`k.kuno` is out of EVN PRD create/approve). Propose records **last proposer** (`Assign` + changelog mention + parent comment). PjM and Engineer propose one suggestion branch only.
- Full suggestion body is **sections 1–9** per [prd.md](prd.md), not Payment’s 9 sections.
