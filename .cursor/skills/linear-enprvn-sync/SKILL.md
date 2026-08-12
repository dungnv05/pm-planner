---
name: linear-enprvn-sync
description: >-
  Weekly sync of ENPRVN Linear team data into data/linear-snapshot.json for the
  PM resource planner. Use when the user asks to sync Linear, refresh the
  ENPRVN snapshot, update actualWork from completed cycles, or run the weekly
  Linear data pull.
---

# Linear ENPRVN weekly sync

Overwrite `data/linear-snapshot.json` only. Never modify `data/assignments.json`.

## Team

```
id: f2d94035-748c-4cdb-a422-4c64a94b52a4
key: ENPRVN
name: [RIU] Enterprise VN
```

Use Linear MCP server `plugin-linear-linear`.

## Workflow

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

4. **actualWork** — For each completed cycle only:
   - `list_issues` with `team="[RIU] Enterprise VN"`, `cycle=<cycle number>`, `limit=250`,
     `fields=["id","assigneeId","projectId","cycleId"]`.
   - Paginate while `hasNextPage`.
   - Skip issues missing `assigneeId` or `projectId`.
   - Aggregate unique `(cycleId, memberId=assigneeId, projectId)` with `issueCount`.

5. **Write** — Overwrite `data/linear-snapshot.json`:
   ```
   {
     syncedAt: <ISO now>,
     team: { id, key, name },
     members, projects, cycles, actualWork
   }
   ```

6. **Do not touch** `data/assignments.json`.

7. **Report** a diff summary vs the previous snapshot:
   - counts: members, projects, cycles, completed cycles, actualWork rows
   - notable adds/removes (members, projects) when obvious
   - confirm `assignments.json` was left unchanged

## Notes

- `windowStart` in assignments stays at the Monday on/before the 6-month planning window (e.g. `2026-03-02`); sync does not change it.
- Prefer team name `"[RIU] Enterprise VN"` for filters; use team id for `list_cycles`.
