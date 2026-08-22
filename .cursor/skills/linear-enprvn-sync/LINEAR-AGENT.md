# ENPRVN Linear snapshot — Linear Agent skill + Loop

Canonical instructions for Linear Agent (skill + Loop). Cursor does not rebuild `actualWork` from Linear issues. Cursor **does** refresh project **milestones** when asked. A Cursor cron (Friday 03:00 ICT) downloads the Loop patch (projects include milestones) and merges `data/linear-snapshot.json`.

Output is **Linear snapshot JSON** for Resource planner **Import**. Never `assignments.json`. Never Notion. Never git.

**Tracking issue title (exact):** `Resource planner Linear snapshot`  
**Team:** ENPRVN (`[RIU] Enterprise VN`, id `f2d94035-748c-4cdb-a422-4c64a94b52a4`)

## Install (human)

1. Create the tracking issue on ENPRVN if missing. Attach current `data/linear-snapshot.json` as seed (older-cycle actuals are dropped without it).
2. Team settings ENPRVN → Agent skills → new skill. Name: `ENPRVN Linear snapshot`. Slash: `/enprvn-linear-snapshot`. Paste **Skill** below.
3. Team Loops → New loop. Schedule **Friday 02:00 Asia/Ho_Chi_Minh**. Team access: ENPRVN only. Allow writes outside a triggering issue. Disable web access, code intelligence, coding sessions. Paste **Loop** below.
4. Cursor Automation **Weekly Linear Loop import**: Friday 03:00 ICT — download that Loop file and patch `data/linear-snapshot.json`. Do not recreate a Cursor job that rebuilds actualWork from Linear issues.

Ad-hoc `projects` (includes **milestones**) / `members` / `full`: Linear chat + this skill. Do not put those modes on the Loop.

Do not Import a Loop file that fails `JSON.parse`. Loop output is a **patch** (`syncMode: recent-patch`: members, **projects + milestones**, cycles, actualWork for **1** newest completed cycle only). Planner Import merges it onto the last full snapshot (keeps older actuals). Last known-good full file: `linear-snapshot-20260821T060205Z.json` in `data/snapshots/` (106 actualWork rows, 9 cycles).

---

## Skill

Paste into the ENPRVN team skill body:

```
You build a resource-planner Linear snapshot for team ENPRVN ([RIU] Enterprise VN, team id f2d94035-748c-4cdb-a422-4c64a94b52a4).

Emit one valid JSON file the PM Resource Planner can Import. Do not create, edit, or assign product issues. Do not change project dates, statuses, or members. Do not invent data. Do not truncate JSON. Do not wrap the file in markdown. Do not write assignments.json. Do not post to Slack or Notion.

## Mode

Pick one:

| Mode | When | What |
| --- | --- | --- |
| recent (default) | User says sync / refresh / weekly, or says nothing about mode | Refresh members, projects (including **all milestones**), all cycles. Rebuild actualWork only for the 2 most recently completed cycles. Merge older actualWork from the previous snapshot. |
| projects | User says Linear project sync / Linear projects sync / project-only / refresh projects / update milestones / refresh milestones | Refresh **projects + milestones** only. Keep previous members, cycles, actualWork. Previous snapshot required. |
| members | User says Linear member sync / Linear members sync / member-only / refresh members | Refresh members only. Keep previous projects, cycles, actualWork. Previous snapshot required. |
| full | User explicitly says full sync / backfill / sync all cycles | Refresh members, projects (including **all milestones**), all cycles. Rebuild actualWork from every completed cycle (no merge). |

If unclear, use recent. Do not treat “Linear project sync”, “update milestones”, or “Linear member sync” as recent.

## Tracking issue

Find the ENPRVN issue titled exactly: Resource planner Linear snapshot
If missing, create it on team ENPRVN. All output goes there.

## Previous snapshot

Load the richest valid JSON (most distinct actualWork cycleIds), not merely the newest filename:
1. Issue attachments named linear-snapshot-*.json
2. Description/embed linear-snapshot.json (seed)
3. A comment with complete JSON (team, members, projects, cycles, actualWork)

Skip a candidate with fewer than 3 actualWork cycleIds when a richer file exists.
After merge, distinct actualWork cycleIds must be >= that previous file. If you would attach only 2 cycles of actualWork, you forgot the copy-through — do not attach; merge again.

A snapshot with syncMode "recent" is valid complete history for this planner when older cycleIds were copied through. Do not call it incomplete. Do not abort.

## Mapping

Members (recent, full, members): all users on team "[RIU] Enterprise VN", paginate. Map:
{ "id", "name", "displayName", "email", "avatarUrl" (omit if empty), "active" }
active ← isActive.

Projects (recent, full, projects): all projects on team "[RIU] Enterprise VN", include members and milestones, paginate. **Replace** each project’s milestones from Linear this run — do not copy previous milestones. Include every Linear milestone (0% and null targetDate). Empty → [].
status and statusType MUST be strings (never the Linear status object):
{
  "id", "name", "url",
  "status": status.name,
  "statusType": status.type,
  "startDate", "targetDate",
  "leadId": lead.id or null,
  "memberIds": members[].id,
  "milestones": [{ "id", "name", "targetDate", "progress" }],
  "priority": priority.value (number; 0 if none)
}

Cycles (recent and full): list **all** cycles for team id f2d94035-748c-4cdb-a422-4c64a94b52a4. Do not use only “current cycle” or “this cycle”. For each:
{
  "id", "number", "startsAt", "endsAt",
  "isCurrent": true only if Linear says current OR (startsAt <= now < endsAt),
  "isCompleted": endsAt < now AND isCurrent is false
}

actualWork rows:
{ "cycleId", "memberId", "projectId", "issueCount" }

Issue fetch for selected cycles: every issue in that cycle on team "[RIU] Enterprise VN" (paginate, not archived). Fields: id, assigneeId, projectId, cycleId. Skip missing assigneeId or projectId. Aggregate unique (cycleId, memberId=assigneeId, projectId) with issueCount.

### recent

**Never use the current / in-progress cycle for actualWork.** Linear cycle filter `type=current` is wrong. Use Linear **previous** cycle (last completed), or: among cycles with isCompleted true, sort endsAt descending, take top 2.
If a chosen cycle has isCurrent true, or now is still inside [startsAt, endsAt), drop it and take the next older completed cycle.
New actualWork = previous rows whose cycleId is not in the refresh set (if previous exists) + new rows for those completed cycles only.
If no previous: actualWork = those completed cycles only.

You MUST attach the new file. Do not refuse. “Only 2 cycles rebuilt” is the design, not data loss, as long as other cycleIds from the previous snapshot are copied through unchanged.

### full

Select all **completed** cycles (not current). Aggregate each. actualWork = full rebuild.

### projects

Previous required. Fetch + map **projects and every milestone**. Payload = previous with `projects` replaced (milestones included), syncedAt=now, syncMode="projects". team, members, cycles, actualWork unchanged.
Report added / removed / status-changed project names and milestone count (projects with milestones / total milestones).

### members

Previous required. Fetch + map members only. Payload = previous with members replaced, syncedAt=now, syncMode="members". team, projects, cycles, actualWork unchanged.
Report added / removed / active-changed member names.

## JSON file

syncedAt = now UTC ISO-8601.
Timestamp token: YYYYMMDDTHHmmssZ (2026-08-21T03:00:00.000Z → 20260821T030000Z).
Filename: linear-snapshot-YYYYMMDDTHHmmssZ.json
(Skill covers many cycles — do not put a cycle name in the filename. Loop patches use linear-snapshot-<cycle-slug>-<timestamp>.json.)

Root object, no extra keys:
{
  "syncedAt": "<ISO now>",
  "syncMode": "recent" | "full" | "projects" | "members",
  "team": {
    "id": "f2d94035-748c-4cdb-a422-4c64a94b52a4",
    "key": "ENPRVN",
    "name": "[RIU] Enterprise VN"
  },
  "members": [],
  "projects": [],
  "cycles": [],
  "actualWork": []
}

## Deliver

1. Attach the JSON to the tracking issue with that filename (raw JSON, 2-space indent OK).
2. If you cannot attach, create a Linear document titled the same filename whose body is only the JSON.
3. Comment on the tracking issue:

Linear snapshot (<syncMode>)
- file: <filename>
- members: N · projects: N · cycles: N · completed: N · actualWork: N · milestones: N
- recent: refreshed **completed** cycles #n and #n (not current #n)
- previous snapshot: yes (filename) | none
- how to use: download JSON → Resource planner → Import (Linear actuals/members/projects/milestones/cycles, not plan bars)

## Never

- assignments.json or { "assignments": ... }
- Drop older actualWork in recent when a previous snapshot exists
- Rebuild all cycles on recent
- Abort, skip attach, or say the latest snapshot is incomplete because syncMode is recent
- Prefer the description seed over a newer linear-snapshot-YYYYMMDDTHHmmssZ.json
- Leave projects[].milestones empty when Linear returned milestones
- Store status as an object (must be status.name string; statusType = status.type string)
- Fetch actualWork for the current / in-progress cycle (Linear type=current, “this cycle”, isCurrent true)
- @-mention people
```

---

## Loop

Paste into the ENPRVN Loop instructions. Schedule: **Friday 02:00 Asia/Ho_Chi_Minh**.

Linear Agent **cannot** emit the full ~47KB snapshot (truncates or drops old actualWork). The Loop attaches a **patch**: refresh members, **projects + all milestones**, cycles, and `actualWork` for **1** newest completed cycle only. The planner Import merges older actuals.

```
Weekly ENPRVN resource-planner PATCH. Do not emit a full snapshot. Do not copy old actualWork.

Team: ENPRVN ([RIU] Enterprise VN, id f2d94035-748c-4cdb-a422-4c64a94b52a4).
Issue title exactly: Resource planner Linear snapshot
Do not change that issue’s status, assignee, description, or other product issues.

Valid JSON only (starts with { ends with }). Compact (no extra whitespace). No thinking, no tool names, no prose in the file. Omit avatarUrl. projects MUST be a non-empty array — never null, never omit the key.

Members: all users on "[RIU] Enterprise VN", paginate.
{ "id", "name", "displayName", "email", "active" }  active ← isActive.

Projects: all projects on "[RIU] Enterprise VN", include members and **milestones**, paginate.
Refresh milestones from Linear this run. Do not copy previous milestones. Include every milestone (0% and null targetDate). Empty list → [].
status and statusType MUST be strings (never objects):
{ "id", "name", "url", "status": status.name, "statusType": status.type, "startDate", "targetDate", "leadId": lead.id or null, "memberIds": members[].id, "milestones": [{ "id", "name", "targetDate", "progress" }], "priority": priority.value or 0 }

Cycles: all cycles for team id f2d94035-748c-4cdb-a422-4c64a94b52a4 (not only current).
{ "id", "number", "startsAt", "endsAt", "isCurrent": Linear current OR startsAt <= now < endsAt, "isCompleted": endsAt < now AND NOT isCurrent }

**actualWork cycle (the only one you aggregate):** Linear cycle filter **type=previous** (last completed). Never type=current. Never “this cycle” / “current cycle”.
If that cycle isCurrent or now is inside [startsAt, endsAt), it is not completed — take the next older cycle with endsAt < now and isCurrent false.
List issues in **that completed cycle only** on "[RIU] Enterprise VN" (paginate, not archived). Fields: id, assigneeId, projectId, cycleId.
Skip issues missing assigneeId or projectId.
Aggregate unique (cycleId, memberId=assigneeId, projectId) with issueCount.
Every actualWork row MUST have cycleId, memberId, projectId, issueCount. No dummy rows. No rows for any other cycle.

Root object:
{
  "syncedAt": "<ISO now>",
  "syncMode": "recent-patch",
  "team": { "id": "f2d94035-748c-4cdb-a422-4c64a94b52a4", "key": "ENPRVN", "name": "[RIU] Enterprise VN" },
  "members": [ ... ],
  "projects": [ ... each with milestones ... ],
  "cycles": [ ... ],
  "actualWork": [ ... only that 1 cycle ... ]
}

Filename: linear-snapshot-<cycle-slug>-<YYYYMMDDTHHmmssZ>.json
cycle-slug = that **completed** cycle’s Linear `name` (lowercase, hyphenated) or `cycle-<number>` — not the current cycle. Example: linear-snapshot-cycle-9-20260821T030000Z.json
Timestamp from syncedAt UTC.
Attach that file. Comment: patch, **completed cycle #n** (current cycle #n excluded), members N, projects N, milestones N, cycles N, actualWork N. Planner Import replaces that completed cycle’s actuals and the project list (including milestones); older actuals stay from the previous snapshot.
```
