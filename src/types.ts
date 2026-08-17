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
  syncMode?: 'recent' | 'full' | 'projects' | 'members'
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

export const ALLOCATION_PRESETS = [
  { label: '25%', value: 0.25 },
  { label: '33%', value: 1 / 3 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
] as const
