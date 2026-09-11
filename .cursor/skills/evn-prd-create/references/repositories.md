# EVN repositories

Research **read-only**. Prefer local clones. If a clone is missing, say so and continue with GitHub / what the user provides. Do not deep-research edge repos unless the user asks.

Local root: `/Users/v.nguyen/dev/` (e.g. `/Users/v.nguyen/dev/raksul-directmail`).

Architecture map: [EVN Architecture and Environments](https://app.notion.com/p/3c141a31f12d81aab110d16056065ac2).

## Primary (always consider)

| Area | Repo | Typical path |
|---|---|---|
| DirectMail BE | [raksul-directmail](https://github.com/raksul/raksul-directmail) | Rails API, jobs, Flipper |
| DirectMail FE | [raksul-directmail-web](https://github.com/raksul/raksul-directmail-web) | Customer / ops UI |
| IHA BE | [raksul-integration-hub](https://github.com/raksul/raksul-integration-hub) | Salesforce / HubSpot / partner |
| IHA FE | [raksul-integration-hub-web](https://github.com/raksul/raksul-integration-hub-web) | IHA UI |
| Order Hub | [raksul-order-hub](https://github.com/raksul/raksul-order-hub) | Order lifecycle shared with Enterprise |
| BDD | [raksul-enterprise-bdd](https://github.com/raksul/raksul-enterprise-bdd) | Robot Framework; QA3 |

BDD env default: **QA3**. Stakeholder staging / core approval WF: **QA1**.

## Edges (log as dependency; RAID if unreleased)

| Area | Repo |
|---|---|
| Enterprise BE | [raksul-enterprise](https://github.com/raksul/raksul-enterprise) |
| Enterprise FE | [raksul-enterprise-web](https://github.com/raksul/raksul-enterprise-web) |
| Session | `raksul-session` / `es-session_token` |
| UI Kit | `raksul-enterprise-uikit` — do not ship EVN UI that needs an unreleased kit |

Also log: DTP datacheck, Flipper / dm-ops flags, Kafka / Order Hub / IHA consumers.

## Domain → tags (Docs DB)

| Domain | Required Tags | Do not add |
|---|---|---|
| DirectMail | `EVN`, `Directmail` (recommend also `DM`, `PRD`) | — |
| IHA | `EVN`, `IHA` | `Directmail` (pollutes view DM all) |
| Order Hub / other | `EVN` + domain tag if it exists | `Directmail` unless the change is DM-facing |

Current Projects codes (URL field `PRD`): `DM-SBD`, `DM-COM`, `PM-DC`, `DM-SF`.

## Research checklist

**PjM PRD pass** (`evn-prd-create`): use facts only so AC and Behavior Examples match current behavior. Do not put architecture, sequences, repo checklists, or technical NFR in the PRD.

**Tech Lead PRD review**: same clones; judge AC / Behavior Example feasibility. Architecture, `【新規】`, technical NFR, and the repo list belong in **TRD**.

- Existing models, services, workers, UI routes for the feature
- Similar flows (estimate, checkout, address, partner sync)
- Schema / column naming already in use (facts only — no new table design in the PRD)
- External APIs that cannot change
- Pack / service boundaries (for TRD / RAID, not a PRD diagram)
- BDD suites that already cover the path
