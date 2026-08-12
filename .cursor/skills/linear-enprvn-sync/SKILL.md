---
name: linear-enprvn-sync
description: >-
  Sync ENPRVN Linear data into data/linear-snapshot.json for the PM resource
  planner. Default mode is recent (2 newest completed cycles for actualWork).
  Use when the user asks to sync Linear, refresh snapshot, or run weekly pull.
  Run full mode only when the user explicitly asks for full sync / backfill.
---

# Linear ENPRVN sync

Overwrite `data/linear-snapshot.json` only. Never modify `data/assignments.json`.

## Team

```
id: f2d94035-748c-4cdb-a422-4c64a94b52a4
key: ENPRVN
name: [RIU] Enterprise VN
```

Use Linear MCP server `plugin-linear-linear`.

## Modes

| Mode | When | actualWork |
|------|------|------------|
| **recent** (default) | User says sync / refresh / weekly update without “full” | Fetch issues for the **2 most recently completed** cycles only; **merge** into existing `actualWork` |
| **full** | User explicitly says **full sync**, **backfill**, or **sync all cycles** | Rebuild `actualWork` from **all** completed cycles |

If unclear, use **recent**.

## Shared steps (both modes)

1. **Members** — `list_users` with `team="[RIU] Enterprise VN"` (limit 250). Map to:
   `{ id, name, displayName, email, avatarUrl?, active }` (`active` ← `isActive`).

2. **Projects** — `list_projects` with `team="[RIU] Enterprise VN"`, `includeMembers=true`, `includeMilestones=true`, and fields:
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

3. **Cycles** — `list_cycles` with `teamId="f2d94035-748c-4cdb-a422-4c64a94b52a4"`.
   For each cycle set `isCompleted = endsAt < now AND NOT isCurrent`.

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
3. Load previous `data/linear-snapshot.json` if present.
4. Build new `actualWork` =
   - keep previous rows whose `cycleId` is **not** in the 2 refreshed cycles
   - plus new rows for the 2 refreshed cycles
5. If no previous file, `actualWork` = only the 2 cycles (note in report that older cycles need a **full sync** once).

### full

1. Select **all** completed cycles.
2. Fetch + aggregate for each; `actualWork` = full rebuild (no merge).

## Write

Overwrite `data/linear-snapshot.json`:

```
{
  syncedAt: <ISO now>,
  syncMode: "recent" | "full",
  team: { id, key, name },
  members, projects, cycles, actualWork
}
```

## Do not touch

`data/assignments.json`.

## Report

- Mode used (`recent` / `full`)
- Counts: members, projects, cycles, completed cycles, actualWork rows
- For **recent**: which 2 cycle numbers were refreshed
- Notable status changes (e.g. project Completed → In Progress)
- Confirm `assignments.json` unchanged

## Notes

- Prefer team name `"[RIU] Enterprise VN"` for filters; team id for `list_cycles`.
- Weekly habit: **recent**. Run **full** after onboarding, data loss, or when older-cycle actual bars look wrong/missing.
