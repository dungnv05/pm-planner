export interface TeamInfo {
  id: string
  key: string
  name: string
}

export interface Member {
  id: string
  name: string
  displayName: string
  email: string
  avatarUrl?: string
  active: boolean
}

export interface Milestone {
  id: string
  name: string
  targetDate: string | null
  progress: string
}

export interface Project {
  id: string
  name: string
  url: string
  status: string
  statusType: 'backlog' | 'planned' | 'started' | 'completed' | 'canceled' | string
  startDate: string | null
  targetDate: string | null
  leadId: string | null
  memberIds: string[]
  milestones: Milestone[]
  priority: number
}

export interface Cycle {
  id: string
  number: number
  startsAt: string
  endsAt: string
  isCurrent: boolean
  isCompleted: boolean
}

export interface ActualWork {
  cycleId: string
  memberId: string
  projectId: string
  issueCount: number
}

export interface LinearSnapshot {
  syncedAt: string
  syncMode?: 'recent' | 'recent-patch' | 'full' | 'projects' | 'members'
  team: TeamInfo
  members: Member[]
  projects: Project[]
  cycles: Cycle[]
  actualWork: ActualWork[]
}

export interface Assignment {
  id: string
  memberId: string
  projectId: string
  /** ISO date of week Monday */
  startWeek: string
  /** ISO date of week Monday (inclusive) */
  endWeek: string
  /** 0.1–1, presets 0.25 | ~0.33 | 0.5 | 1 */
  allocation: number
}

export interface AssignmentsFile {
  updatedAt: string
  windowStart: string
  assignments: Assignment[]
}

export type CadencePassId = 'daily' | 'weekly' | 'monthly' | 'release' | 'process'
export type CadenceReset = 'day' | 'week' | 'month' | 'sticky'

export interface CadencePassDef {
  id: CadencePassId
  label: string
  when: string
  reset: CadenceReset
}

export interface CadenceItem {
  id: string
  pass: CadencePassId
  doc: string
  href: string
  title: string
  what: string
  fields: string
  dueDate?: string
  t0Date?: string
  offset?: number
  projectName?: string
  milestoneName?: string
}

export interface CadenceReleaseTemplate {
  offset: number
  title: string
  what: string
  fields: string
  doc: string
  href: string
}

export interface CadenceFile {
  dashboard: string
  linear: string
  note: string
  passes: CadencePassDef[]
  items: CadenceItem[]
  releaseTemplates: CadenceReleaseTemplate[]
}

/** ISO weekday 1=Mon … 7=Sun */
export interface CadenceTimeRule {
  time: string
  weekdays: number[]
}

export interface CadenceMonthlyRule {
  time: string
  days: number[]
  leadDays: number
}

export interface CadenceScheduleSettings {
  daily: CadenceTimeRule
  weekly: CadenceTimeRule
  monthly: CadenceMonthlyRule
  notificationsEnabled: boolean
}

/** itemId → period key that was checked */
export interface CadenceProgress {
  checked: Record<string, string>
  lastNotified?: Record<string, string>
  lastResetDay?: string
}

export const ALLOCATION_PRESETS = [
  { label: '25%', value: 0.25 },
  { label: '33%', value: 1 / 3 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
] as const
