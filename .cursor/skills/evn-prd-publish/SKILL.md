---
name: evn-prd-publish
description: >-
  Publishes EVN PRDs: s.nonaka / v.nguyen / ly.hkk may Create a high-level
  Docs page (sections 1–4); PjM Proposes a full 1–9 suggestion (may include
  1–4 edits); only s.nonaka Approves. Use when the user asks to publish PRD,
  đăng PRD, đề xuất PRD, approve PRD suggestion, or gắn Current Projects.PRD.
  Propose records last proposer. Never overwrite a full live PRD except
  s.nonaka approve. New 1–4: prefer Notion Skill “EVN PRD PdM high-level”.
  Completing: evn-prd-create then this skill in Propose. Do not clone Mini Spec.
---

# EVN PRD publish

Port of [payment-specs `rules/notion.md`](https://github.com/raksul/payment-specs/blob/main/.claude/rules/notion.md) for EVN.

Read [references/notion.md](references/notion.md) and [../evn-prd-create/references/prd.md](../evn-prd-create/references/prd.md). **Ask before every Notion or Linear write.**

Default path: Notion Skill **EVN PRD PdM high-level** writes live **1–4** (`s.nonaka` / `v.nguyen` / `ly.hkk`) → Cursor `evn-prd-create` → this skill **Propose** (full 1–9) → **Approve** by `s.nonaka` only.

Tools: Notion `plugin-notion-workspace-notion` (`fetch`, `create-pages`, `update-page`, `create-comment`, `query-data-sources`, `get-users`). Linear `save_comment` on the ENPRVN project/epic. Do not clone Mini Spec / User Story / Backlog.

## Pick a mode

| Situation | Mode |
|---|---|
| No Docs page; `self` is `s.nonaka` / `v.nguyen` / `ly.hkk` and they ask to create | **Create** (1–4 only). Prefer Notion Skill **EVN PRD PdM high-level**. |
| No Docs page; actor is not those three | Refuse Create. Point at the Notion Skill. |
| Live PRD exists; complete 5–9 or change a full PRD | **Propose** |
| `s.nonaka` wants to apply/reject a suggestion child | **Approve** |

`fetch` id `self` when identity matters.

Approver email: `s.nonaka@raksul.com` only. Do not mention or assign `k.kuno` in this workflow.

## Create (fallback, high-level 1–4)

Body = **sections 1–4 only**. Do not paste 5–9. Allowed: `s.nonaka@raksul.com`, `v.nguyen@raksul.com`, `ly.hkk@raksul.com`.

1. `fetch` `self`. If email is not one of those three, refuse.
2. Search Docs for related EVN PRDs. Stop on conflict.
3. Confirm title `PRD - [code] - [full name]`, tags, Linear URL, Assign.
4. `create-pages` with parent `data_source_id` `ac1ad489-edba-41d0-b2f3-6a00db0b1bc6`.
   - Tags DM: `EVN`, `Directmail`, plus `DM`, `PRD`, `Japanese & English` when JP summary exists.
   - IHA / Order Hub: `EVN` + domain tag (`IHA`); **no** `Directmail`.
   - `Ticket` = Linear URL string. `Name EN` = English name.
   - **Do not** set `template_id` to PRD for DM * VN dev.
   - Body = sections 1–4 per [prd.md](../evn-prd-create/references/prd.md). No architecture/sequence Mermaid.
   - `Assign`: always include `s.nonaka`; add `self` if the actor is PjM.
5. If Current Projects has Code `DM-SBD` / `DM-COM` / `PM-DC` / `DM-SF`, `update-page` that row’s `PRD` to the new URL only.
6. Linear comment: high-level PRD created, waiting complete pass. Mention `s.nonaka`. Not a Mini Spec.

## Propose (update)

Typical **Propose**: PjM full 1–9 after `evn-prd-create`, including **1–4 edits** when needed. Changelog splits product (1–4) vs delivery (5–7).

Never `replace_content` / `update_content` / `insert_content` / `apply_template` on the **live** PRD body.

1. `fetch` id `self`. That user is **last proposer**. Fail propose if identity is missing.
2. Fetch the live page. Confirm the user wants a suggestion, not a new PRD.
3. Native Suggest edits if the connected tools can do it — **one** suggestion pass. If MCP cannot, fallback.
4. Fallback child:
   - If an open child title starts with `Suggestion —` and does not end `(accepted)` / `(rejected)`, update **that** child only.
   - Else `create-pages` parent `page_id` = live PRD, title `Suggestion — YYYY-MM-DD`, body = changelog then full proposed sections 1–9.
   - Changelog **must** include `Last proposed by: <mention-user url="user://{self-id}"/>`. On a reuse, replace the previous last-proposer mention with current `self`.
   - Changelog **must** list 1–4 changes separately from 5–7 when 1–4 moved.
5. Live `Assign` (person): fetch current people, **add** last proposer if missing. Do not remove existing assignees. Do not change Tags / Ticket / body. Do not add `k.kuno`.
6. One `create-comment` on the live page that **mentions last proposer**, the child URL, and `s.nonaka` (`user://1b4d872b-594c-811e-aa9b-0002a9817c4a`). Do not mention `k.kuno`.
7. Do not change Current Projects `PRD`.
8. Linear: suggestion ready, waiting `s.nonaka`.

## Approve

1. If `self` email is not `s.nonaka@raksul.com`, refuse to write the live page. Point them at native Accept or ask `s.nonaka` to run this mode.
2. Fetch live + open suggestion child. Show a diff. Highlight product (1–4) vs delivery (5–7).
3. Wait for explicit accept or reject.
4. Accept: write child body (without changelog) onto the live page (`update_content` if a small patch, `replace_content` only if the whole body is the proposal). Rename child to `Suggestion — YYYY-MM-DD (accepted)`. Linear: PRD updated.
5. Reject: rename `(rejected)` only.

## Guardrails

- One open suggestion per PRD
- Do not delete pages
- Preserve unrelated child `<page>` tags if using `replace_content` on live
- Do not journal Architecture / RACI / playbook
