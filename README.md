# PM Resource Planner

Local resource planning for Linear team **[RIU] Enterprise VN (ENPRVN)**.

## Features

- **12-month timeline** with week- or month-level view (toggle in header)
- Drag & drop members onto projects; each member gets their own lane (no overlapping bars)
- **Workload split** per assignment: 25% / 33% / 50% / 100% (or custom)
- **Capacity colors** by month: yellow (under), green (full), red shades (over)
- **Plan vs Actual** on completed Linear cycles (actual sits under plan in the same member lane)
- **Notion cadence** checklist (`/cadence`): daily / weekly / monthly / release / process ticks for EVN Notion docs
- Data from Linear via the **Linear Agent** weekly snapshot (Import on `/planner`); assignments stored locally

## Run

- **Foreground (Development)**:
  ```bash
  npm run dev
  ```
  App starts on fixed port **http://localhost:9397**.

- **Background Service**:
  ```bash
  npm run service:start     # Start server in background
  npm run service:status    # Check status & PID
  npm run service:stop      # Stop background server
  npm run service:restart   # Restart server
  npm run service:logs      # View output and error logs
  ```

## Weekly Linear sync

Linear Agent on team **ENPRVN** — not Cursor. Paste blocks: `.cursor/skills/linear-enprvn-sync/LINEAR-AGENT.md`.

- **Loop** (automatic): **Friday 02:00 Asia/Ho_Chi_Minh** — **patch** (`recent-patch`: latest members, latest **projects + milestones**, **`cycles` length 1**, `actualWork` for that completed cycle). Planner **Import** upserts the cycle and replaces members/projects; keeps older cycles and actuals.
- **Skill** (ad-hoc in Linear chat, `/enprvn-linear-snapshot`):
  - **recent** (default): full snapshot (members, projects, milestones, cycles + merge older actualWork). Linear Agent often fails this size; prefer Import of a Loop patch or a Cursor-built file in `data/snapshots/`.
  - **projects**: “Linear project sync” / “update milestones” — project list **and milestones** only
  - **members**: “Linear member sync” — member list only
  - **full**: “full sync” / “sync all cycles” — rebuild `actualWork` for every completed cycle

Each run attaches JSON to the issue **Resource planner Linear snapshot**:
- **Skill** (many cycles): `linear-snapshot-YYYYMMDDTHHmmssZ.json`
- **Loop** (1 cycle patch): `linear-snapshot-<cycle-slug>-<YYYYMMDDTHHmmssZ>.json` (example: `linear-snapshot-cycle-9-20260821T030000Z.json`)

Seed that issue once with `data/linear-snapshot.json` so older-cycle actuals are not dropped.

The web app loads an **imported snapshot** from localStorage if present, else the newest file in `data/snapshots/`, else committed `data/linear-snapshot.json`. On `/planner`, **Import** accepts a full Linear snapshot, a Loop **patch** (`recent-patch`, 1-cycle `actualWork`), or `assignments.json`. Patches merge onto the last full snapshot (localStorage if it still has ≥3 actualWork cycles, otherwise disk).

Never overwrites `data/assignments.json`. Do not run a Cursor Automation named Weekly Linear sync (duplicate of the Loop).

## Notion update cadence

In the app: **Notion cadence** (`/cadence`). Source list: `data/cadence.json`. Schedule (ICT) is on the page: daily/weekly weekdays + time; monthly days + time + T-minus. Checks persist in localStorage.

- **Reminders:** browser notifications while any planner tab stays open (enable on the cadence page).
- **Reset:** daily and weekly completed ticks clear at **23:59 ICT** (weekly on the last selected weekday). Monthly ticks stay until **T-3** of the next due day, then reset last month and remind this month. Process never auto-resets. Release tasks are generated from Linear milestones named Release / Go-Live / Ship.
- If the tab is closed at 23:59, the next visit uses the new period key (same outcome).
- **Linear Loop EVN release cadence** (weekdays **08:00 Asia/Ho_Chi_Minh**): upserts T-10…T-0 sub-issues under **EVN release cadence** (label `Project Management`, assignee = Linear project lead) and comments only when an event is due today. Paste: `.cursor/skills/evn-notion-update-cadence/LINEAR-RELEASE-LOOP.md`. Not a Cursor job.

## Cursor cron jobs (ICT)

Cloud automation on this repo (`cursor/roadmap`). It cannot clear this browser’s cadence checkboxes.

| Job | When (ICT) | UTC cron | What |
| --- | --- | --- | --- |
| **EVN daily Notion cadence** | **23:00 every day** | `0 16 * * *` | Skill **evn-notion-update-cadence** — daily RAID / Current Projects pass on live Notion. |
| **Weekly Linear Loop import** | **Friday 03:00** | `0 20 * * 4` | Download newest Loop patch from Linear issue **Resource planner Linear snapshot**; merge into `data/linear-snapshot.json`; commit. |

Daily 23:00 ICT is 16:00 UTC. Friday 03:00 ICT is Thursday 20:00 UTC (one hour after the snapshot Linear Loop at Friday 02:00 ICT).

## Assignments persistence

- Edits are saved to **localStorage** automatically
- **Export** downloads `assignments-YYYYMMDDTHHmmssZ.json` (commit `data/assignments.json` to share plans)
- **Import** loads an exported assignments file **or** a Linear snapshot JSON (`linear-snapshot-*.json`)

Seed file: `data/assignments.json` (`windowStart` defaults to `2026-03-02` for a 6-month window covering recent cycles).

## Usage tips

1. Drag a member from the left pool onto a project row / week → pick allocation %
2. Drag or resize plan bars on the timeline
3. Double-click a plan bar to change %; Delete/Backspace to remove
4. Click a **completed** cycle band (dashed) to open Plan vs Actual compare
5. Use **Status** in the header to filter projects (default hides Completed / Canceled)

## Stack

Vite + React + TypeScript. Timeline is CSS Grid with HTML5 drag-and-drop for the member pool.
