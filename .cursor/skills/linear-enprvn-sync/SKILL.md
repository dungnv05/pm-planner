---
name: linear-enprvn-sync
description: >-
  ENPRVN Linear snapshot: Cursor weekly cron downloads the Loop patch;
  ad-hoc updates Linear project milestones into data/linear-snapshot.json.
  Do not rebuild actualWork from Linear issues. Use when the user asks to
  sync Linear, update milestones, refresh projects, weekly Linear pull, or
  patch the resource-planner snapshot.
---

# Linear ENPRVN sync

Linear Agent **Loop** (Friday 02:00 ICT) writes a 1-cycle patch (`members`, `projects`+milestones, `cycles.length === 1`, that cycle’s `actualWork`) on the issue **Resource planner Linear snapshot**. Cursor **does not** rebuild `actualWork` from Linear issues. Cursor **does** refresh **project milestones** when asked, and the weekly cron copies the Loop patch.

## Update milestones (ad-hoc in this repo)

When the user asks to update Linear milestones, refresh projects, project dates, or roadmap dates:

1. List Linear projects for team **[RIU] Enterprise VN** (`ENPRVN`, id `f2d94035-748c-4cdb-a422-4c64a94b52a4`) with members **and milestones** (paginate).
2. Map every project (strings only — never store the Linear status object):
   - `status` ← `status.name` (e.g. `"In Progress"`)
   - `statusType` ← `status.type` (e.g. `"started"`)
   - `leadId` ← `lead.id` or null; `memberIds` ← members[].id
   - `priority` ← `priority.value` or 0
   - `milestones` ← **replace entirely** from Linear: `{ id, name, targetDate, progress }`. Include 0% and null `targetDate`. Empty Linear list → `[]`. Do not keep stale snapshot milestones.
3. Write `data/linear-snapshot.json`: replace `projects` only. Keep `team`, `members`, `cycles`, `actualWork`. Set `syncMode` to `"projects"`, `syncedAt` to now UTC.
4. Do **not** list issues to rebuild `actualWork`. Do **not** edit `data/assignments.json`. Do **not** upload Notion.

Roadmap (`/`) and cadence Release rows read these milestones (Release / Go-Live / Ship).

## Cursor weekly cron (Friday 03:00 ICT)

Job **Weekly Linear Loop import**. One hour after the Loop. Use Linear only to **download** the newest Loop attachment, then patch `data/linear-snapshot.json`.

1. Find the ENPRVN issue titled exactly `Resource planner Linear snapshot` (ENPRVN-1517).
2. Attachments named `linear-snapshot-<cycle-slug>-<YYYYMMDDTHHmmssZ>.json` are Loop patches. Skip `linear-snapshot-YYYYMMDDTHHmmssZ.json` (skill, many cycles). Skip files that fail `JSON.parse`.
3. Take the Loop file with the **latest timestamp token** (newest cycle).
4. Merge onto committed `data/linear-snapshot.json`:
   - Replace `members` and `projects` when those arrays are non-empty (`projects` includes **milestones** — do not keep previous `projects[].milestones`).
   - **Upsert** `cycles` by id. Loop sends **exactly 1** completed cycle — do not drop the other cycles from the base snapshot.
   - `actualWork`: thin patch (1 cycle) replaces that cycle’s rows; keep other cycles. Drop dummy rows and **current / in-progress** cycle rows. Loop must use Linear **type=previous**, not type=current.
   - Result must still have **≥ 3** distinct `actualWork` cycleIds.
5. If `scripts/patch-linear-snapshot.mjs` exists: `node scripts/patch-linear-snapshot.mjs <patch.json>`.
6. Commit and push **only** `data/linear-snapshot.json` when it changed. Do not commit `data/assignments.json` or `data/snapshots/`.
7. If there is no valid Loop file, or merge would drop history: do not commit; comment on the tracking issue.

Do **not** list Linear issues to rebuild `actualWork`. Do **not** upload Notion.

## Ad-hoc (Linear chat)

Skill `/enprvn-linear-snapshot` (modes `recent` / `projects` / `members` / `full`). “Update milestones” / “Linear project sync” → **projects** mode. Import the JSON on `/planner`, or wait for this cron to patch `data/linear-snapshot.json`.

Canonical Linear paste: [LINEAR-AGENT.md](LINEAR-AGENT.md).
