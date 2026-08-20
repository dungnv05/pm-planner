# PM Resource Planner

Local resource planning for Linear team **[RIU] Enterprise VN (ENPRVN)**.

## Features

- **12-month timeline** with week- or month-level view (toggle in header)
- Drag & drop members onto projects; each member gets their own lane (no overlapping bars)
- **Workload split** per assignment: 25% / 33% / 50% / 100% (or custom)
- **Capacity colors** by month: yellow (under), green (full), red shades (over)
- **Plan vs Actual** on completed Linear cycles (actual sits under plan in the same member lane)
- **Notion cadence** checklist (`/cadence`): daily / weekly / monthly / release / process ticks for EVN Notion docs
- Data from Linear via the **`linear-enprvn-sync`** Cursor skill; assignments stored locally

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

In Cursor, ask the agent to run the **linear-enprvn-sync** skill (`.cursor/skills/linear-enprvn-sync/`).

- **Default (`recent`)**: refresh members/projects/cycles + `actualWork` for the **2 newest completed cycles** only (cheaper).
- **Projects**: say **“Linear project sync”** / **“Linear projects sync”** to refresh the project list only (new Linear projects). Keeps members, cycles, and actualWork.
- **Members**: say **“Linear member sync”** / **“Linear members sync”** to refresh the member list only (new teammates). Keeps projects, cycles, and actualWork.
- **Full**: say “full sync” / “sync all cycles” when you need to rebuild actualWork for every completed cycle.

Each run writes a **new timestamped snapshot** and does **not** overwrite older versions:

- Local archive: `data/snapshots/linear-snapshot-YYYYMMDDTHHmmssZ.json` (gitignored)
- Latest pointer (committed fallback): `data/linear-snapshot.json`
- Shared archive: [Resource planner data sync](https://app.notion.com/p/Resource-planner-data-sync-3bf41a31f12d804e98cbdfa4cf1fc3cb) — newest file is prepended on the page

The web app loads the **newest timestamped file** in `data/snapshots/` for completed-cycle actuals. If that folder is empty (fresh clone), it falls back to `data/linear-snapshot.json`. Refresh the app after sync.

Never overwrites `data/assignments.json`.

## Notion update cadence

In the app: **Notion cadence** (`/cadence`). Source list: `data/cadence.json`. Schedule (ICT) is on the page: daily/weekly weekdays + time; monthly days + time + T-minus. Checks persist in localStorage.

- **Reminders:** browser notifications while any planner tab stays open (enable on the cadence page).
- **Reset:** daily and weekly completed ticks clear at **23:59 ICT** (weekly on the last selected weekday). Monthly ticks stay until **T-3** of the next due day, then reset last month and remind this month. Process never auto-resets. Release tasks are generated from Linear milestones named Release / Go-Live / Ship.
- If the tab is closed at 23:59, the next visit uses the new period key (same outcome).

## Cursor cron jobs (ICT)

Cloud automations on this repo (`cursor/roadmap`). They cannot clear this browser’s cadence checkboxes.

| Job | When (ICT) | UTC cron | What |
| --- | --- | --- | --- |
| **EVN daily Notion cadence** | **23:00 every day** | `0 16 * * *` | Skill **evn-notion-update-cadence** — daily RAID / Current Projects pass on live Notion. |
| **Weekly Linear sync** | **02:00 Friday** | `0 19 * * 4` | Skill **linear-enprvn-sync**, mode **recent**. Archive on Notion Resource planner data sync. Never writes `assignments.json`. |

Friday 02:00 ICT is Thursday 19:00 UTC (`* * 4`). Daily 23:00 ICT is 16:00 UTC.

In Cursor, ask the agent to run those skills for ad-hoc passes. Linear `ENPRVN` remains the source of truth for dates. Weekly capacity is planned on `/planner` in this repo.

## Assignments persistence

- Edits are saved to **localStorage** automatically
- **Export** downloads `assignments-YYYYMMDDTHHmmssZ.json` (commit `data/assignments.json` to share plans)
- **Import** loads an exported assignments file

Seed file: `data/assignments.json` (`windowStart` defaults to `2026-03-02` for a 6-month window covering recent cycles).

## Usage tips

1. Drag a member from the left pool onto a project row / week → pick allocation %
2. Drag or resize plan bars on the timeline
3. Double-click a plan bar to change %; Delete/Backspace to remove
4. Click a **completed** cycle band (dashed) to open Plan vs Actual compare
5. Use **Status** in the header to filter projects (default hides Completed / Canceled)

## Stack

Vite + React + TypeScript. Timeline is CSS Grid with HTML5 drag-and-drop for the member pool.
