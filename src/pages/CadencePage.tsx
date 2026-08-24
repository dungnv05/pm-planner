import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../layout/AppShell'
import { CadenceSettings } from '../components/CadenceSettings'
import { useCadence } from '../components/CadenceProvider'
import {
  cadence,
  ictDayKey,
  ictWeekKey,
  isItemChecked,
  itemsForPass,
  passStats,
  periodKeyFor,
} from '../lib/cadence'
import { monthlyCycleKey, thisMonthDueDay, thisMonthT3 } from '../lib/cadenceSchedule'
import type { CadenceItem, CadencePassId } from '../types'

type Filter = CadencePassId | 'all'

function DocLink({ item }: { item: CadenceItem }) {
  if (item.href.startsWith('/')) {
    return <Link to={item.href}>{item.doc}</Link>
  }
  return (
    <a href={item.href} target="_blank" rel="noreferrer">
      {item.doc}
    </a>
  )
}

export function CadencePage() {
  const { progress, settings, now, duePasses, setSettings, toggleItem, resetPass } = useCadence()
  const [filter, setFilter] = useState<Filter>('all')

  const rows = itemsForPass(filter, now)
  const passMeta = cadence.passes.find((p) => p.id === filter)
  const cycle = monthlyCycleKey(settings.monthly, now)
  const t3 = thisMonthT3(settings.monthly, now)
  const due = thisMonthDueDay(settings.monthly, now)

  return (
    <AppShell title="Notion cadence">
      <main className="app-main cadence-page">
        {duePasses.length > 0 ? (
          <div className="cadence-due-banner" role="status">
            Due now:{' '}
            {duePasses.map((p) => cadence.passes.find((x) => x.id === p)?.label ?? p).join(', ')}
            . Keep this tab open for reminders.
          </div>
        ) : null}

        <p className="cadence-lead">
          {cadence.note}{' '}
          <a href={cadence.dashboard} target="_blank" rel="noreferrer">
            EVN dashboard
          </a>
          {' · '}
          <a href={cadence.linear} target="_blank" rel="noreferrer">
            Linear ENPRVN
          </a>
          . ICT daily {ictDayKey(now)} · week {ictWeekKey(now)} · monthly cycle {cycle} (T-
          {settings.monthly.leadDays} {t3}, due {due}). Process stays until you tick it.
        </p>

        <CadenceSettings settings={settings} onChange={setSettings} />

        <div className="cadence-stats">
          {cadence.passes.map((p) => {
            const s = passStats(p.id, progress, now, settings)
            return (
              <button
                key={p.id}
                type="button"
                className={`cadence-stat${filter === p.id ? ' is-active' : ''}${duePasses.includes(p.id) ? ' is-due' : ''}`}
                onClick={() => setFilter(p.id)}
              >
                <strong>
                  {s.done}/{s.total}
                </strong>
                <span>{p.label}</span>
              </button>
            )
          })}
        </div>

        <div className="cadence-toolbar">
          <div className="scale-toggle" role="group" aria-label="Cadence filter">
            <button
              type="button"
              className={`btn${filter === 'all' ? ' btn-primary' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {cadence.passes.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`btn${filter === p.id ? ' btn-primary' : ''}`}
                onClick={() => setFilter(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          {filter !== 'all' ? (
            <button type="button" className="btn" onClick={() => resetPass(filter)}>
              Reset {passMeta?.label ?? filter}
            </button>
          ) : null}
        </div>

        {passMeta ? <p className="cadence-when">{passMeta.when}</p> : null}

        {filter === 'release' && rows.length === 0 ? (
          <p className="empty-hint">
            No open Linear milestones named Release / Go-Live / Ship. Sync Linear, then
            check this tab.
          </p>
        ) : (
          <ul className="cadence-list">
            {rows.map((item) => {
              const checked = isItemChecked(item, progress, now, settings)
              const passLabel = cadence.passes.find((p) => p.id === item.pass)?.label ?? item.pass
              return (
                <li key={item.id} className={`cadence-item${checked ? ' is-checked' : ''}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(item)}
                    />
                    <span className="cadence-item-body">
                      <span className="cadence-item-kicker">
                        {passLabel} · <DocLink item={item} />
                        {item.dueDate ? ` · due ${item.dueDate}` : null}
                      </span>
                      <strong>{item.title}</strong>
                      <span className="cadence-item-what">{item.what}</span>
                      <span className="cadence-item-fields">
                        {item.fields}
                        {item.pass !== 'process'
                          ? ` · period ${periodKeyFor(item.pass, now, settings)}`
                          : ''}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </AppShell>
  )
}
