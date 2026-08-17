import type { AssignmentsFile } from '../types'
import { defaultWindowStart } from './dates'

const STORAGE_KEY = 'pm-resource-planner:assignments'

export function emptyAssignments(): AssignmentsFile {
  return {
    updatedAt: new Date().toISOString(),
    windowStart: defaultWindowStart(),
    assignments: [],
  }
}

export function loadAssignmentsFromStorage(
  fallback: AssignmentsFile,
): AssignmentsFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback.assignments.length ? fallback : { ...fallback, windowStart: fallback.windowStart || defaultWindowStart() }
    const parsed = JSON.parse(raw) as AssignmentsFile
    if (!parsed || !Array.isArray(parsed.assignments)) return fallback
    return {
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      windowStart: parsed.windowStart || fallback.windowStart || defaultWindowStart(),
      assignments: parsed.assignments,
    }
  } catch {
    return fallback
  }
}

export function saveAssignmentsToStorage(data: AssignmentsFile): void {
  const next = { ...data, updatedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function exportAssignmentsJson(data: AssignmentsFile): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `assignments-${timestampPostfix(new Date())}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function timestampPostfix(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
}

export async function importAssignmentsJson(file: File): Promise<AssignmentsFile> {
  const text = await file.text()
  const parsed = JSON.parse(text) as AssignmentsFile
  if (!parsed || !Array.isArray(parsed.assignments)) {
    throw new Error('Invalid assignments.json')
  }
  return {
    updatedAt: parsed.updatedAt || new Date().toISOString(),
    windowStart: parsed.windowStart || defaultWindowStart(),
    assignments: parsed.assignments,
  }
}
