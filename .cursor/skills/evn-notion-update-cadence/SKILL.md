---
name: evn-notion-update-cadence
description: >-
  Updates EVN Notion operating docs on the daily/weekly/monthly/release cadence
  for Raksul Enterprise Vietnam (team ENPRVN). Checklist items live in
  data/cadence.json (same list as the /cadence page). Use when the user asks to
  run standup notes, update RAID, Current Projects RAG, monthly release report,
  Go/No-Go, EVN cadence, cập nhật Notion EVN, or Notion cadence in pm-planner.
---

# EVN Notion update cadence

PjM skill for [EVN dashboard](https://app.notion.com/p/1c0b3184c9e84518a5a0c8510cdcc7dd).

**Linear `ENPRVN` is the source of truth for dates and tickets.** Notion is the operating picture. Do not rewrite Architecture, RACI, or the playbook on a daily pass.

Canonical checklist: [`data/cadence.json`](../../../data/cadence.json) (rendered in-app at `/cadence`). Field map: [docs.md](docs.md).

## Tools

Notion MCP `plugin-notion-workspace-notion`: `fetch` before edit, `query-data-sources` for DBs, `update-page` for targeted edits. Do not clone Mini Spec / User Story / Backlog.

Tickets and AC: English. Daily spoken notes: Vietnamese OK; JP stakeholders get EN/JP written follow-up.

## Pick the pass

| User intent | Pass (`cadence.json` `pass`) |
|---|---|
| Daily / standup / blocker hôm nay | `daily` |
| Thứ Năm / refinement / 1:1 PdM / RAG / capacity | `weekly` |
| Tháng / tính năng đã release / turnover | `monthly` |
| Ship / T-10 / Go/No-Go / hypercare | `release` |
| Process đổi (PO, env, SLA, ADR mới) | `process` |

If unspecified, fetch RAID + Current Projects, then run the smallest matching pass.

Execute **every item** in `data/cadence.json` whose `pass` matches. Skip an item only if it does not apply this cycle (say so). After Notion edits, list pages + fields changed.

## Daily

After Daily MTG 9:30 ICT (or the time set on `/cadence`). New blockers → Linear same day, then RAID if the date or PdM/CS/DTP is involved. Current Projects only if Status/RAG/Target Date moved.

**Cron job EVN daily Notion cadence** — **23:00 ICT every day** (UTC `0 16 * * *`) — runs **this daily pass only** against live Notion. Do not journal Architecture / RACI / playbook. Do not edit `data/assignments.json`. Browser checkbox reset happens in the pm-planner tab, not in this job.

## Weekly

Thursday pack. RAG on Current Projects before PdM 1:1. Walk RAID Open items.

**Capacity lives in this repo:** Resource planner (`/planner`), not a Notion board. If snapshot actuals are stale, wait for Friday Loop (02:00 ICT) + Cursor cron **Weekly Linear Loop import** (03:00 ICT), or Import JSON on `/planner`. Do not rebuild actualWork from Linear issues in this job.

Refinement notes go to the meeting DB (not Slack-only). QA Hub Plan/Env/Gap only if coverage changed. Retro every 2 weeks Thursday.

## Monthly

YYYY-MM child on Monthly Movement (silent and public). Current Projects → Done after hypercare. RAID stale cleanup. Decision Log Status only unless adding an ADR.

## Release

**Do not edit the playbook body.** Copy QA + Go/No-Go into the Linear release ticket. No-Go: High RAID without mitigation, missing CS comms for user-facing change, or unknown rollback — stop deploy, notify PdM + CS, update Linear + RAID.

In the planner, release checklist rows are generated from Linear milestones named Release / Go-Live / Ship (`data/cadence.json` `releaseTemplates`, T-10…T-0 business days).

## Process

Only when the way of working changed. New Decision Log row the **same day** a decision others must follow.

## Guardrails

- Fetch live Notion; do not trust chat memory for RAG/dates.
- Extra links = `<mention-page>`, never duplicate child `<page url>`.
- After a Daily/Weekly/Monthly pass, leave process docs untouched.
- Do not modify `data/assignments.json` unless the user asked to change the plan (weekly capacity is a planner UI edit, not a Notion edit).
