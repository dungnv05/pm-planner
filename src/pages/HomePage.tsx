import { Link } from 'react-router-dom'
import { AppShell } from '../layout/AppShell'

const FEATURES = [
  {
    to: '/planner',
    title: 'Resource planner',
    body: 'Plan member allocation on a week or month timeline. Drag onto projects, compare plan vs Linear actuals, and track FY-half workload.',
  },
  {
    to: '/roadmap',
    title: 'Roadmap',
    body: 'Track Linear project milestones across the current fiscal half or a full FY. Read-only — dates update when you sync from Linear.',
  },
  {
    to: '/cadence',
    title: 'Notion cadence',
    body: 'Daily / weekly / monthly / release checklist for EVN Notion, with ICT reminders. Tick items here; keep the tab open. Cursor skill evn-notion-update-cadence applies the same list in Notion.',
  },
]

export function HomePage() {
  return (
    <AppShell title="ENPRVN Planning">
      <main className="app-main">
        <div className="home-grid">
          {FEATURES.map((f) => (
            <Link key={f.to} className="home-card" to={f.to}>
              <h2>{f.title}</h2>
              <p>{f.body}</p>
            </Link>
          ))}
        </div>
      </main>
    </AppShell>
  )
}
