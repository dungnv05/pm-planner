---
name: linear-enprvn-sync
description: >-
  Sync ENPRVN Linear data into timestamped snapshot JSON (local + Notion archive).
  Default mode is recent (2 newest completed cycles for actualWork).
  Use when the user asks to sync Linear, refresh snapshot, or run weekly pull.
  Use projects mode when the user says “Linear project sync” or “Linear projects sync”.
  Use members mode when the user says “Linear member sync” or “Linear members sync”.
  Run full mode only when the user explicitly asks for full sync / backfill.
---

# Linear ENPRVN sync

Write a new timestamped Linear snapshot (never overwrite older timestamped files).
Never modify `data/assignments.json`.

## Team

```
id: f2d94035-748c-4cdb-a422-4c64a94b52a4
key: ENPRVN
name: [RIU] Enterprise VN
```

Use Linear MCP server `plugin-linear-linear`.

## Notion archive

Page (canonical history):

```
url: https://app.notion.com/p/Resource-planner-data-sync-3bf41a31f12d804e98cbdfa4cf1fc3cb
id: 3bf41a31-f12d-804e-98cb-dfa4cf1fc3cb
```

Use Notion MCP server `plugin-notion-workspace-notion`.

## Modes

| Mode | When | What it refreshes |
|------|------|-------------------|
| **recent** (default) | User says sync / refresh / weekly update without “full”, “project”, or “member” | members, projects, cycles + `actualWork` for the **2 most recently completed** cycles (merge) |
| **projects** | User says **Linear project sync** or **Linear projects sync** (also “project-only”, “refresh projects”) | **projects only**; keep previous members, cycles, `actualWork` |
| **members** | User says **Linear member sync** or **Linear members sync** (also “member-only”, “refresh members”) | **members only**; keep previous projects, cycles, `actualWork` |
| **full** | User explicitly says **full sync**, **backfill**, or **sync all cycles** | members, projects, cycles + rebuild `actualWork` from **all** completed cycles |

If unclear, use **recent**. Do **not** treat “Linear project sync” or “Linear member sync” as recent.

## Shared steps

### Projects mapping (recent, full, and projects modes)

`list_projects` with `team="[RIU] Enterprise VN"`, `includeMembers=true`, `includeMilestones=true`, and fields:
`id,name,url,startDate,targetDate,status,lead,members,milestones,priority`.
Paginate if `hasNextPage`. Map each project to:
```
{
  id, name, url,
  status: status.name,
  statusType: status.type,
  startDate, targetDate,
  leadId: lead.id | null,
  memberIds: members[].id,
  milestones: [{ id, name, targetDate, progress }],
  priority: priority.value
}
```

### Members mapping (recent, full, and members modes)

`list_users` with `team="[RIU] Enterprise VN"` (limit 250). Map to:
`{ id, name, displayName, email, avatarUrl?, active }` (`active` ← `isActive`).

### Cycles (recent and full only)

`list_cycles` with `teamId="f2d94035-748c-4cdb-a422-4c64a94b52a4"`.
For each cycle set `isCompleted = endsAt < now AND NOT isCurrent`.

## Previous snapshot (for recent merge, projects, and members modes)

Load the previous snapshot in this order; stop at the first hit:

1. Newest file in `data/snapshots/` matching `linear-snapshot-YYYYMMDDTHHmmssZ.json` (sort by filename timestamp descending).
2. `data/linear-snapshot.json` if present.
3. Notion: `notion-fetch` the archive page, pick the newest `linear-snapshot-*.json` attachment (filename timestamp, else page order — newest is prepended), then `notion-download-attachment` with that file’s `file_upload_id`. Save the downloaded JSON locally under `data/snapshots/` using its original filename before merging.

If none exist, there is no previous snapshot.

### projects mode

Cheap refresh when a new Linear project was added and is missing from the planner.

1. Load previous snapshot (required). If none, **stop** and tell the user to run a **recent** or **full** sync first.
2. Fetch + map **projects only** (see mapping above). Do **not** call `list_users`, `list_cycles`, or `list_issues`.
3. New payload = previous snapshot with:
   - `projects` replaced by the fresh list
   - `syncedAt` = now
   - `syncMode` = `"projects"`
   - `team`, `members`, `cycles`, `actualWork` **unchanged**
4. Write + upload as usual.

Report added / removed / status-changed projects by comparing previous vs new `projects` lists.

### members mode

Cheap refresh when a teammate was added (or reactivated) and is missing from the planner.

1. Load previous snapshot (required). If none, **stop** and tell the user to run a **recent** or **full** sync first.
2. Fetch + map **members only** (see mapping above). Do **not** call `list_projects`, `list_cycles`, or `list_issues`.
3. New payload = previous snapshot with:
   - `members` replaced by the fresh list
   - `syncedAt` = now
   - `syncMode` = `"members"`
   - `team`, `projects`, `cycles`, `actualWork` **unchanged**
4. Write + upload as usual.

Report added / removed / active-flag-changed members by comparing previous vs new `members` lists.

## actualWork

### Issue fetch (for selected cycles)

For each selected cycle:

- `list_issues` with `team="[RIU] Enterprise VN"`, `cycle=<cycle number>`, `limit=250`,
  `fields=["id","assigneeId","projectId","cycleId"]`.
- Paginate while `hasNextPage`.
- Skip issues missing `assigneeId` or `projectId`.
- Aggregate unique `(cycleId, memberId=assigneeId, projectId)` with `issueCount`.

### recent (default)

1. Sort completed cycles by `endsAt` descending; take the **top 2**.
2. Fetch + aggregate actualWork for those 2 cycles only.
3. Load previous snapshot (see above).
4. Build new `actualWork` =
   - keep previous rows whose `cycleId` is **not** in the 2 refreshed cycles
   - plus new rows for the 2 refreshed cycles
5. If no previous snapshot, `actualWork` = only the 2 cycles (note in report that older cycles need a **full sync** once).

### full

1. Select **all** completed cycles.
2. Fetch + aggregate for each; `actualWork` = full rebuild (no merge).

## Write

Timestamp from `syncedAt` (UTC now): `YYYYMMDDTHHmmssZ`, e.g. `2026-08-17T08:17:14.000Z` → `20260817T081714Z`.

Filename: `linear-snapshot-YYYYMMDDTHHmmssZ.json`

Payload:

```
{
  syncedAt: <ISO now>,
  syncMode: "recent" | "full" | "projects" | "members",
  team: { id, key, name },
  members, projects, cycles, actualWork
}
```

1. Write `data/snapshots/<filename>` (create the folder if needed). **Do not overwrite** older timestamped files.
2. Overwrite `data/linear-snapshot.json` with the same payload (latest pointer / git-committed fallback).
3. Upload to Notion (see below).

## Upload to Notion

Current snapshots are ~44KB. Inline `content` on `notion-create-attachment` is limited to **200 KiB**.

1. `notion-create-attachment` with `filename` = the timestamped name, `content` = the JSON string.
   - If the payload exceeds 200 KiB: `notion-create-file-upload` → POST the file to `upload_url` → `notion-create-attachment` with `source_file_id`.
2. `notion-update-page` on page id `3bf41a31-f12d-804e-98cb-dfa4cf1fc3cb`, command `insert_content`, `position: { "type": "start" }` so the newest entry is at the top.

Markdown to insert (use `suggested_markdown` / `markdown_source` from the attachment response for the file block):

```
## <syncedAt> (<syncMode>)

members: N · projects: N · cycles: N · completed: N · actualWork: N

<file block from suggested_markdown>
```

## Do not touch

`data/assignments.json`.

## Report

- Mode used (`recent` / `full` / `projects` / `members`)
- Timestamped filename
- Notion page URL
- Counts: members, projects, cycles, completed cycles, actualWork rows
- For **recent**: which 2 cycle numbers were refreshed
- For **projects**: added / removed / status-changed project names
- For **members**: added / removed / active-changed member names
- Previous-snapshot source used (`snapshots/`, `linear-snapshot.json`, Notion, or none)
- Notable status changes (e.g. project Completed → In Progress)
- Confirm `assignments.json` unchanged

## Notes

- Prefer team name `"[RIU] Enterprise VN"` for filters; team id for `list_cycles`.
- Weekly habit: **recent**. Run **projects** after creating a new Linear project. Run **members** after a teammate joins. Run **full** after onboarding, data loss, or when older-cycle actual bars look wrong/missing.
- The web app loads the newest timestamped file in `data/snapshots/` (fallback: `data/linear-snapshot.json`). Refresh after sync.
- `data/snapshots/` is gitignored; Notion is the shared archive.
