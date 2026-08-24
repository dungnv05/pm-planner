import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { loadLatestSnapshot } from '../lib/loadSnapshot'

interface Props {
  title: string
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export function AppShell({ title, actions, footer, children }: Props) {
  const snapshot = loadLatestSnapshot()

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>{title}</h1>
          <nav className="nav-links" aria-label="Pages">
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/planner">Resource planner</NavLink>
            <NavLink to="/roadmap">Roadmap</NavLink>
            <NavLink to="/cadence">Notion cadence</NavLink>
          </nav>
          <div className="meta">
            {snapshot.team?.name ?? 'ENPRVN'} · synced{' '}
            {snapshot.syncedAt
              ? new Date(snapshot.syncedAt).toLocaleString()
              : 'never — Import a Linear snapshot on /planner'}
          </div>
        </div>
        {actions ? <div className="header-actions">{actions}</div> : null}
      </header>
      {children}
      {footer}
    </div>
  )
}
