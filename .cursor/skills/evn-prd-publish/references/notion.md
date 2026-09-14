# EVN Notion + Linear publish rules

Port of [payment-specs `.claude/rules/notion.md`](https://github.com/raksul/payment-specs/blob/main/.claude/rules/notion.md) for EVN. Ask the user before any write.

## Destinations

| Thing | ID / URL |
|---|---|
| Docs database | https://app.notion.com/p/66411b81900a4e09be229146cab034e4 |
| Data source | `collection://ac1ad489-edba-41d0-b2f3-6a00db0b1bc6` |
| View DM all | `view://ce49021c-c366-43bc-aad7-feff0e01294e` (Tags contains `Directmail`) |
| View DM PRD | Tags `DM` AND `PRD` |
| Current Projects | https://app.notion.com/p/43a48e6adc124d7d86affed9fd283129 (`collection://ec10ca44-7533-4dd2-8e9d-269e2a1fa6c1`) |
| Linear team | ENPRVN (`f2d94035-748c-4cdb-a422-4c64a94b52a4`) |
| Notion Skill PdM 1–4 | EVN PRD PdM high-level (EVN AI Skills, tag `PRD`) |

Fetch the data source before create. Do not use `database_id` when a data source URL exists.

## RACI

| Role | People | Notion user id | Email |
|---|---|---|---|
| PdM — **approve** full PRD | `s.nonaka` | `1b4d872b-594c-811e-aa9b-0002a9817c4a` | `s.nonaka@raksul.com` |
| High-level 1–4 create (Notion Skill) | `s.nonaka`, `v.nguyen`, `ly.hkk` | `1b4d872b-594c-811e-aa9b-0002a9817c4a`, `060b3675-db4a-4d16-a24d-8c79b24e32ce`, `25cd872b-594c-8132-82f5-0002a2feab17` | `s.nonaka@raksul.com`, `v.nguyen@raksul.com`, `ly.hkk@raksul.com` |
| PjM — **propose** full 1–9 (may include 1–4 edits) | `v.nguyen`, `ly.hkk` | `060b3675-db4a-4d16-a24d-8c79b24e32ce`, `25cd872b-594c-8132-82f5-0002a2feab17` | `v.nguyen@raksul.com`, `ly.hkk@raksul.com` |

`k.kuno` is **not** in EVN PRD create, suggestion comments, or approve.

Mentions: `<mention-user url="user://UUID"/>`. Identify the actor with Notion `fetch` id `self` (email) when deciding create vs propose vs approve.

**Last proposer:** on every Propose, `self` must be recorded as last proposer (changelog mention + live `Assign` add + parent comment mention). **Approve is `s.nonaka` only.** PjM may write **live 1–4** via **EVN PRD PdM high-level** (or Cursor Create fallback). They must **Propose** to change a full 1–9 live page.

Live after PdM = sections **1–4** only. Suggestion after PjM = full **1–9** (1–4 may change). Headings: [prd.md](../../evn-prd-create/references/prd.md).

## Search first

Before creating, search Docs for related EVN PRDs (Tags `EVN`, keywords, project code). If overlap/conflict, stop and ask `s.nonaka`.

Do **not** clone Mini Spec / User Story / Backlog templates.

Do **not** apply template `PRD for DM * VN dev` (`2fb41a31f12d80f096e6eb334d4acba0`) — missing product stance, Behavior Examples, numbered AC, RAID. Keep its Words EN/JP table in Overview. Do not paste Payment architecture / NFR / repo checklist into the PRD body (TRD).

## Create (no existing PRD page)

Prefer Notion Skill **EVN PRD PdM high-level**. Cursor Create is fallback when `self` is `s.nonaka@raksul.com`, `v.nguyen@raksul.com`, or `ly.hkk@raksul.com`.

`create-pages` parent `data_source_id` = `ac1ad489-edba-41d0-b2f3-6a00db0b1bc6`.

| Property | Value |
|---|---|
| Name | `PRD - [project code] - [full name]` |
| Tags | Required: `EVN`, `Directmail` for DM. Also set `DM`, `PRD`, and `Japanese & English` when there is a JP summary. IHA: `EVN` + `IHA`, **not** `Directmail`. |
| Name EN | English title |
| Ticket | Linear URL (text, not URL type) |
| Assign | Always `s.nonaka`; add actor if PjM |
| PRD / TRD | Leave empty on this Docs row unless linking another doc |

Body = **sections 1–4 only**. No Created/Author/URL header. No 5–9 headings.

Then, if Current Projects has a row for `DM-SBD` / `DM-COM` / `PM-DC` / `DM-SF`, set that row’s `PRD` URL to the new page. Do not change Status/RAG.

Linear: high-level PRD created, waiting complete pass. Mention `s.nonaka` (and the actor if they are PjM). Do not clone Mini Spec.

## Update (page already exists)

Typical propose: PjM full 1–9 after Cursor complete; **1–4 edits allowed** in the same suggestion. Changelog splits product (1–4) vs delivery (5–7).

Live PRD body is SoT until approve. **Propose** must not call `replace_content`, `update_content`, `insert_content`, or `apply_template` on the live body. Propose **may** `update_properties` on live only to **add** last proposer to `Assign`.

One update = **exactly one** open suggestion:

1. `fetch` id `self` first. That user is **last proposer**. Do not continue without a user id.
2. Prefer native Notion **Suggest edits** (agent propose; `s.nonaka` Accept/Reject in the sidebar). Cursor MCP has no `suggest_edits` command — use fallback if native is unavailable.
3. Fallback: one **child page** under the live PRD, title `Suggestion — YYYY-MM-DD`. Body = changelog (top) + full proposed markdown (section 1 onward). Changelog must include `Last proposed by: <mention-user url="user://{self-id}"/>`. One comment on the parent that **mentions last proposer** + child URL + `s.nonaka` only. If a child titled `Suggestion —` without `(accepted)` / `(rejected)` already exists, **update that child** (including last-proposer mention), do not create a second.
4. Live `Assign`: merge last proposer into the existing person list. Do not remove other assignees. Do not add `k.kuno`.
5. Do not change Current Projects `PRD` (still the live page).
6. Linear: “suggestion ready, waiting s.nonaka” + URLs. After approve: “PRD updated”.

## Approve (`s.nonaka` only)

Child pages do not merge themselves. `s.nonaka` runs approve (Notion skill or this skill in approve mode):

1. `fetch` id `self`. If email is not `s.nonaka@raksul.com`, **refuse** to write the live page.
2. Fetch parent + open suggestion child. Show a readable diff (product 1–4 vs delivery 5–7).
3. Wait for explicit accept or reject.
4. Accept: `replace_content` or `update_content` on the **live** page from the child body (strip changelog header). Rename child title to `Suggestion — YYYY-MM-DD (accepted)`. Do not delete the child.
5. Reject: rename to `Suggestion — YYYY-MM-DD (rejected)`. Do not touch live content.

If native Suggest edits were used, `s.nonaka` accepts in the Notion UI; the skill does not overwrite.

## Guardrails

- Never `replace_content` on live PRD except `s.nonaka`-confirmed approve, or high-level skill / Create fallback writing first **1–4** (`s.nonaka` / `v.nguyen` / `ly.hkk`).
- Never delete Notion pages (archive / rename only).
- Extra links = `<mention-page>`, never duplicate child `<page url>` unless intentionally creating a subpage.
- `feature-doc-synthesis` is after PRD, not part of publish.
