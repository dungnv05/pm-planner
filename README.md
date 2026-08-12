# PM Resource Planner

Local resource planning for Linear team **[RIU] Enterprise VN (ENPRVN)**.

## Features

- **12-month timeline** with week- or month-level view (toggle in header)
- Drag & drop members onto projects; each member gets their own lane (no overlapping bars)
- **Workload split** per assignment: 25% / 33% / 50% / 100% (or custom)
- **Capacity colors** by month: yellow (under), green (full), red shades (over)
- **Plan vs Actual** on completed Linear cycles (actual sits under plan in the same member lane)
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
- **Full**: say “full sync” / “sync all cycles” when you need to rebuild actualWork for every completed cycle.

It updates `data/linear-snapshot.json` only — never overwrites `data/assignments.json`.

After sync, restart or refresh the app to load the new snapshot.

## Assignments persistence

- Edits are saved to **localStorage** automatically
- **Export** downloads `assignments.json` (commit this file to share plans)
- **Import** loads an exported assignments file

Seed file: `data/assignments.json` (`windowStart` defaults to `2026-03-02` for a 6-month window covering recent cycles).

## Usage tips

1. Drag a member from the left pool onto a project row / week → pick allocation %
2. Drag or resize plan bars on the timeline
3. Double-click a plan bar to change %; Delete/Backspace to remove
4. Click a **completed** cycle band (dashed) to open Plan vs Actual compare
5. Toggle **Show completed** to include finished Linear projects

## Stack

Vite + React + TypeScript. Timeline is CSS Grid with HTML5 drag-and-drop for the member pool.
