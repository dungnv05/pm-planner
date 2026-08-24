import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyScheduledResets,
  dueBannerPasses,
  dueNotifyEvents,
  isItemChecked,
  itemsForPass,
  loadCadenceProgress,
  markNotified,
  notifyCadenceEvents,
  periodKeyFor,
  saveCadenceProgress,
  unreadNotifyEvents,
} from '../lib/cadence'
import {
  loadCadenceSchedule,
  saveCadenceSchedule,
} from '../lib/cadenceSchedule'
import type {
  CadenceItem,
  CadencePassId,
  CadenceProgress,
  CadenceScheduleSettings,
} from '../types'

interface CadenceContextValue {
  progress: CadenceProgress
  settings: CadenceScheduleSettings
  now: Date
  duePasses: CadencePassId[]
  setSettings: (next: CadenceScheduleSettings) => void
  toggleItem: (item: CadenceItem) => void
  resetPass: (pass: CadencePassId) => void
}

const CadenceContext = createContext<CadenceContextValue | null>(null)

export function CadenceProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<CadenceProgress>(loadCadenceProgress)
  const [settings, setSettingsState] = useState<CadenceScheduleSettings>(loadCadenceSchedule)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 15_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const now = new Date()
    setProgress((prev) => {
      const reset = applyScheduledResets(prev, settings, now)
      const events = dueNotifyEvents(reset, settings, now)
      const fresh = unreadNotifyEvents(reset, events, now, settings)
      let next = reset
      if (fresh.length && settings.notificationsEnabled) {
        queueMicrotask(() => notifyCadenceEvents(fresh))
        next = markNotified(reset, fresh, now, settings)
      }
      if (JSON.stringify(next) === JSON.stringify(prev)) return prev
      saveCadenceProgress(next)
      return next
    })
  }, [tick, settings])

  const setSettings = useCallback((next: CadenceScheduleSettings) => {
    setSettingsState(next)
    saveCadenceSchedule(next)
  }, [])

  const toggleItem = useCallback(
    (item: CadenceItem) => {
      const now = new Date()
      setProgress((prev) => {
        const next: CadenceProgress = {
          ...prev,
          checked: { ...prev.checked },
          lastNotified: { ...(prev.lastNotified ?? {}) },
        }
        if (isItemChecked(item, prev, now, settings)) {
          delete next.checked[item.id]
        } else {
          next.checked[item.id] = periodKeyFor(item.pass, now, settings)
        }
        saveCadenceProgress(next)
        return next
      })
    },
    [settings],
  )

  const resetPass = useCallback((pass: CadencePassId) => {
    const now = new Date()
    setProgress((prev) => {
      const next: CadenceProgress = {
        ...prev,
        checked: { ...prev.checked },
        lastNotified: { ...(prev.lastNotified ?? {}) },
      }
      for (const item of itemsForPass(pass, now)) {
        delete next.checked[item.id]
      }
      saveCadenceProgress(next)
      return next
    })
  }, [])

  const now = useMemo(() => new Date(), [tick])
  const duePasses = useMemo(
    () => dueBannerPasses(progress, settings, now),
    [progress, settings, now],
  )

  const value = useMemo(
    () => ({
      progress,
      settings,
      now,
      duePasses,
      setSettings,
      toggleItem,
      resetPass,
    }),
    [progress, settings, now, duePasses, setSettings, toggleItem, resetPass],
  )

  return <CadenceContext.Provider value={value}>{children}</CadenceContext.Provider>
}

export function useCadence() {
  const ctx = useContext(CadenceContext)
  if (!ctx) throw new Error('useCadence must be used within CadenceProvider')
  return ctx
}
