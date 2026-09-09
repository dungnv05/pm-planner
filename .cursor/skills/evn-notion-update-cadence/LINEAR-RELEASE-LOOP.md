# ENPRVN release cadence — Linear Loop

Daily Linear Agent Loop. Same rules as `/cadence` release rows: milestones named Release / Go-Live / Ship, T-10…T-0 **VN business days**. Linear Agent cannot read this repo — keep this prompt in sync with `data/cadence.json` `releaseTemplates` and VN rows in `data/holidays.json`.

**Tracking issue title (exact):** `EVN release cadence`  
**Team:** ENPRVN (`[RIU] Enterprise VN`, id `f2d94035-748c-4cdb-a422-4c64a94b52a4`)  
**Label (every issue):** `Project Management` — must already exist on the team. Do not create labels.  
**Assignee (sub-issues):** Linear **project lead**. Tracking issue stays unassigned.

Not a Cursor cron. Does not edit Notion, git, Slack, or project dates. Does not attach JSON.

## Install (human)

1. Confirm team ENPRVN has a label named exactly `Project Management`.
2. Create the tracking issue on ENPRVN if missing: title `EVN release cadence`, label `Project Management`. Leave it open.
3. Team Loops → New loop. Schedule **weekdays 08:00 Asia/Ho_Chi_Minh**. Team access: ENPRVN only. Allow writes outside a triggering issue. Disable web access, code intelligence, coding sessions. Paste **Loop** below.



## Loop

Paste into the ENPRVN Loop instructions. Schedule: **weekdays 08:00 Asia/Ho_Chi_Minh**.

```
Daily ENPRVN release-cadence check. Asia/Ho_Chi_Minh calendar date = today.

Team: ENPRVN ([RIU] Enterprise VN, id f2d94035-748c-4cdb-a422-4c64a94b52a4).
Issue title exactly: EVN release cadence
Label name exactly: Project Management (already exists — never create a label).
Do not @-mention. Do not edit Notion, Slack, git, or project dates/members/status.
Do not change the tracking issue’s status, assignee, or description.
Do not create product issues outside this parent/child tree.
Do not comment on the tracking issue. Quiet day = no parent comment.

## Parent

Find the ENPRVN issue titled exactly: EVN release cadence
If missing, create it on team ENPRVN (open). Add label Project Management if missing. Do not remove other labels.

## Milestones

List all projects on "[RIU] Enterprise VN" with members, lead, and milestones (paginate).
Skip project if status.type is completed or canceled.
leadId = project.lead.id (null if no lead).
A release milestone is one whose name matches /release|go-?live|\bship\b/i (case-insensitive), has a targetDate, progress < 100, and targetDate (t0) >= today.
Skip milestones with no targetDate, progress >= 100, or t0 < today.

## Business days

ISO date YYYY-MM-DD. Weekday: Mon=1 … Sun=7 from that date (UTC date parts).
Not a business day if weekday >= 6 (Sat/Sun) OR the date falls in a VN holiday inclusive range:
- 2026-08-29 .. 2026-09-02
- 2027-02-04 .. 2027-02-10
- 2027-04-30 .. 2027-05-03
- 2027-09-02 .. 2027-09-05
- 2028-01-25 .. 2028-01-30
- 2028-04-30 .. 2028-05-02

subtractBusinessDays(t0, n): if n <= 0 return t0. Else walk back one calendar day at a time; decrement n only when that day is a business day. Stop when n is 0.

dueDate for offset n = subtractBusinessDays(t0, n). dueDate must be <= t0.

## Templates (keep in sync with data/cadence.json releaseTemplates)

offset 10 | T-10 — freeze scope and invite QA
what: Release ticket exists. CS/SCM/DTP invited. Target on Linear and Current Projects. RAID reviewed.
fields: Current Projects Target Date + RAID
doc: EVN Release Playbook https://app.notion.com/p/3c141a31f12d818cb9dacab853b24d9d

offset 5 | T-5 — Dev QA and consumers
what: Dev QA done. Backward-compat. Order Hub / IHA / catalog / DM ops checked.
fields: Linear ticket + BDD/manual checklist
doc: EVN QA / BDD Hub https://app.notion.com/p/3c141a31f12d8147b453cedebac49d0f

offset 3 | T-3 — PdM/CS QA and FAQ draft
what: Use the matrix as a ping list. Do not edit the matrix page. FAQ / release note draft ready.
fields: Slack / Linear comms
doc: Stakeholder matrix https://app.notion.com/p/3c141a31f12d811c8dc8d57aa715fcc9

offset 1 | T-1 Go/No-Go
what: No High RAID without mitigation. Rollback owner named. Silent vs public decided (Decision Log if new). Comms drafted.
fields: RAID High; Linear Go/No-Go comment
doc: EVN RAID Log https://app.notion.com/p/cb0893f95d1d451a8ce2ab9438420b11

offset 0 | T-0 deploy and T+1–5 hypercare
what: Slack release thread. Watch CS tickets → RAID issues. Add the feature to the YYYY-MM child page.
fields: Monthly child page + RAID issues
doc: Monthly Movement / Turnover https://app.notion.com/p/3ae41a31f12d80dbb845d990549e037b

## Sub-issues

For every active release milestone, upsert five children of the tracking issue (offsets 10, 5, 3, 1, 0).

Title exact: T-{offset} · {project.name} · {milestone.name} ({t0})
Example: T-10 · DM-SBD · Phase 1 - Silent release (2026-09-15)

Find by that exact title on team ENPRVN. If missing, create as a sub-issue of the tracking issue.
Set due date = dueDate. Description = milestone name (t0). template what. Fields: template fields. Doc: template doc URL.
Assignee = that project's lead. If the project has no lead, leave unassigned. On upsert, set assignee to the current project lead (do not leave a stale assignee when the lead changed).
Add label Project Management if missing. Do not remove other labels.
If the issue exists and t0 (hence dueDate) changed, update the due date. Do not retitle; do not duplicate.

## Due today

If dueDate === today: comment once on that sub-issue. Skip if you (this agent) already commented on it today.
Comment body:
- Event: template title
- Project, milestone, t0, dueDate
- Checklist: template what
- Fields: template fields
- Doc URL
- No-Go: High RAID without mitigation, missing CS comms for a user-facing change, or unknown rollback — stop deploy, notify PdM + CS, update Linear + RAID.
Do not mark the sub-issue Done. Humans mark Done.

If no sub-issue has dueDate === today: do not comment on the parent. Creating/updating children is allowed (not a heartbeat).

## Cancel stale children

For children of the tracking issue whose title matches T-{offset} · {project} · {milestone} ({t0}):
If that project is completed/canceled, or that milestone is gone / progress >= 100 / t0 < today: Cancel the child if it is still open. Do not delete.

## Never

- @-mention people
- Comment “no release events today” (or any quiet-day note) on the parent
- Close the tracking issue
- Create a new Linear label
- Edit Notion or the Release Playbook
- Change Linear project dates, status, or members
```



