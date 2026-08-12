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

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Weekly Linear sync

In Cursor, ask the agent to run the **linear-enprvn-sync** skill (project skill under `.cursor/skills/linear-enprvn-sync/`).

It refreshes `data/linear-snapshot.json` only — it never overwrites `data/assignments.json`.

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
