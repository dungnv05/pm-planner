import {
  DEFAULT_CADENCE_SCHEDULE,
  WEEKDAY_OPTIONS,
  toggleNumber,
} from '../lib/cadenceSchedule'
import type { CadenceScheduleSettings } from '../types'

interface Props {
  settings: CadenceScheduleSettings
  onChange: (next: CadenceScheduleSettings) => void
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      className={`cadence-chip${active ? ' is-active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function CadenceSettings({ settings, onChange }: Props) {
  const requestNotify = async () => {
    if (typeof Notification === 'undefined') return
    const perm = await Notification.requestPermission()
    onChange({ ...settings, notificationsEnabled: perm === 'granted' })
  }

  const permission =
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission

  return (
    <details className="cadence-settings">
      <summary>Schedule (ICT)</summary>
      <p className="cadence-when">
        Reminders fire in this browser tab. Keep the planner open. Daily and weekly
        reset at 23:59 ICT; monthly resets at T-{settings.monthly.leadDays} of the
        due day (not 23:59). Process never auto-resets.
      </p>

      <div className="cadence-settings-grid">
        <section>
          <h3>Daily</h3>
          <label className="cadence-time">
            Time
            <input
              type="time"
              value={settings.daily.time}
              onChange={(e) =>
                onChange({
                  ...settings,
                  daily: { ...settings.daily, time: e.target.value },
                })
              }
            />
          </label>
          <div className="cadence-chips">
            {WEEKDAY_OPTIONS.map((d) => (
              <Chip
                key={d.id}
                active={settings.daily.weekdays.includes(d.id)}
                onClick={() =>
                  onChange({
                    ...settings,
                    daily: {
                      ...settings.daily,
                      weekdays: toggleNumber(settings.daily.weekdays, d.id),
                    },
                  })
                }
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <h3>Weekly</h3>
          <label className="cadence-time">
            Time
            <input
              type="time"
              value={settings.weekly.time}
              onChange={(e) =>
                onChange({
                  ...settings,
                  weekly: { ...settings.weekly, time: e.target.value },
                })
              }
            />
          </label>
          <div className="cadence-chips">
            {WEEKDAY_OPTIONS.map((d) => (
              <Chip
                key={d.id}
                active={settings.weekly.weekdays.includes(d.id)}
                onClick={() =>
                  onChange({
                    ...settings,
                    weekly: {
                      ...settings.weekly,
                      weekdays: toggleNumber(settings.weekly.weekdays, d.id),
                    },
                  })
                }
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </section>

        <section>
          <h3>Monthly</h3>
          <label className="cadence-time">
            Time
            <input
              type="time"
              value={settings.monthly.time}
              onChange={(e) =>
                onChange({
                  ...settings,
                  monthly: { ...settings.monthly, time: e.target.value },
                })
              }
            />
          </label>
          <label className="cadence-time">
            T-minus days
            <input
              type="number"
              min={0}
              max={14}
              value={settings.monthly.leadDays}
              onChange={(e) =>
                onChange({
                  ...settings,
                  monthly: {
                    ...settings.monthly,
                    leadDays: Number(e.target.value) || 0,
                  },
                })
              }
            />
          </label>
          <div className="cadence-chips cadence-chips-days">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <Chip
                key={d}
                active={settings.monthly.days.includes(d)}
                onClick={() =>
                  onChange({
                    ...settings,
                    monthly: {
                      ...settings.monthly,
                      days: toggleNumber(settings.monthly.days, d),
                    },
                  })
                }
              >
                {String(d)}
              </Chip>
            ))}
          </div>
        </section>
      </div>

      <div className="cadence-notify-row">
        <button type="button" className="btn btn-primary" onClick={() => void requestNotify()}>
          {settings.notificationsEnabled && permission === 'granted'
            ? 'Browser notifications on'
            : 'Enable browser notifications'}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => onChange({ ...DEFAULT_CADENCE_SCHEDULE, notificationsEnabled: settings.notificationsEnabled })}
        >
          Reset defaults
        </button>
        {permission === 'denied' ? (
          <span className="cadence-when">Notifications blocked in the browser.</span>
        ) : null}
      </div>
    </details>
  )
}
