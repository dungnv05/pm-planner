# EVN Notion URLs and fields

Dashboard: https://app.notion.com/p/1c0b3184c9e84518a5a0c8510cdcc7dd

Linear SoT: https://linear.app/raksul/team/ENPRVN/projects/view/active-projects-milestone-d553d902aa7e

Canonical item list: `data/cadence.json`.

## Living databases (edit on cadence)

| Doc | URL | Fields to update |
|---|---|---|
| EVN Current Projects | https://app.notion.com/p/43a48e6adc124d7d86affed9fd283129 | Status (`In Progress` / `QA` / `Release` / `Blocked` / `Done`), RAG (`Green` / `Amber` / `Red`), Target Date, Owner, Notes (one line). Code/PRD/TRD/BDD/WBS/Linear only when links change. |
| EVN RAID Log | https://app.notion.com/p/cb0893f95d1d451a8ce2ab9438420b11 | Name, Type (`Risk` / `Assumption` / `Issue` / `Dependency`), Project (multi: `DM-SBD` `DM-COM` `PM-DC` `DM-SF` `Cross-team`), Impact, Owner, Due, Mitigation, Status (`Open` / `Watching` / `Mitigating` / `Resolved`). Prefer view **Open items**. |
| EVN Decision Log | https://app.notion.com/p/189a532339c7484a969cdbf3c26a9fd1 | New ADR: Name, Status (`Proposed` / `Accepted` / `Deprecated` / `Superseded`), Area, Context, Decision, Owner, Decided. Monthly: Status only. |

Current Projects codes: `DM-SBD`, `DM-COM`, `PM-DC`, `DM-SF`.

## Living pages

| Doc | URL | What to edit |
|---|---|---|
| EVN QA / BDD Hub | https://app.notion.com/p/3c141a31f12d8147b453cedebac49d0f | Per-project table: Plan, Env, Gap. Strategy/DoR/DoD only on Process pass. |
| Monthly Movement / Turnover | https://app.notion.com/p/3ae41a31f12d80dbb845d990549e037b | Child `YYYY-MM — Tính năng đã release`. After every silent or public prod ship. |
| Backlog refinement notes | https://app.notion.com/p/132a3f4606bf46fea7106309818333fb | Thursday weekly notes. |
| Retro | https://app.notion.com/p/a43b83a960d941678e92bbf8b2488847 | Every 2 weeks Thursday. |
| Resource planner | `/planner` in this repo | Weekly capacity vs Linear. Notion [Resource assignment planner](https://app.notion.com/p/3bf41a31f12d8069b127eca02d917d2c) is the docs pointer only. |

## Reference (copy, do not journal)

| Doc | URL | Use |
|---|---|---|
| EVN Release Playbook | https://app.notion.com/p/3c141a31f12d818cb9dacab853b24d9d | Copy QA + Go/No-Go into Linear ticket. Silent vs public is explicit. |
| EVN Team Operating One-pager | https://app.notion.com/p/3c141a31f12d8133a937cb29ae288529 | Ceremonies (Daily 9:30 ICT, Thursday refinement, biweekly review), RACI, escalation. |
| EVN Stakeholder and Communication Matrix | https://app.notion.com/p/3c141a31f12d811c8dc8d57aa715fcc9 | Who to ping, language, SLA. T-10 CS/SCM/DTP invite. |
| EVN Architecture and Environments | https://app.notion.com/p/3c141a31f12d81aab110d16056065ac2 | QA3 = VN verify + BDD; QA1 = stakeholder staging (core approval WF). |
| Definition of Ready / Done | https://app.notion.com/p/3c141a31f12d80228103d642e3812106 | Generic; EVN lists live on QA Hub. |

## Ceremony cheat sheet (ICT)

- Daily MTG: 9:30, weekdays, PjM + Dev
- Backlog refinement: Thursday weekly
- Sprint Review + Plan: Thursday every 2 weeks
- Resource assignment: weekly, PD / PdM / PjM lead — **this app**
- PdM 1:1: weekly, priority / scope / stakeholder risks

## Linear Loops (ICT)

Linear Agent on team ENPRVN — not Cursor.

| Loop | When | Tracking issue | What |
| --- | --- | --- | --- |
| EVN release cadence | Weekdays 08:00 | **EVN release cadence** (label `Project Management`) | T-10…T-0 sub-issues from Release / Go-Live / Ship milestones, assigned to the Linear project lead. Comment checklist only when due today. Quiet days: silent. [LINEAR-RELEASE-LOOP.md](LINEAR-RELEASE-LOOP.md) |
| Resource planner snapshot | Friday 02:00 | **Resource planner Linear snapshot** | 1-cycle patch. See `.cursor/skills/linear-enprvn-sync/LINEAR-AGENT.md`. |

## Cursor cron jobs (ICT)

| Job | When | UTC cron |
| --- | --- | --- |
| EVN daily Notion cadence | 23:00 every day | `0 16 * * *` |
| Weekly Linear Loop import | Friday 03:00 | `0 20 * * 4` |

Snapshot Loop writes the 1-cycle patch Friday 02:00 ICT. Cursor cron imports it Friday 03:00 ICT.

## Named seats (verify on Operating One-pager if stale)

- PO: vacant — PdM acting (`k.kuno` / `s.nonaka`)
- PjM: `v.nguyen` / `ly.hkk`
- Tech Lead: `chinh.vt` / `khanh.nd` / `danh.lt`
- CS `@dmgojyo` · SCM `@dmscm` · DTP `@dtpgojyo` — confirm names before release mail
