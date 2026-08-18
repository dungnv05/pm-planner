import fallbackSnapshot from '../../data/linear-snapshot.json'
import type { LinearSnapshot } from '../types'

const SNAPSHOT_TS_RE = /linear-snapshot-(\d{8}T\d{6}Z)\.json$/

function timestampFromPath(path: string): string | null {
  const match = path.match(SNAPSHOT_TS_RE)
  return match?.[1] ?? null
}

function unwrapModule(
  mod: LinearSnapshot | { default: LinearSnapshot },
): LinearSnapshot {
  return 'default' in mod ? mod.default : mod
}

/** Newest `data/snapshots/linear-snapshot-*.json`, else committed `data/linear-snapshot.json`. */
export function loadLatestSnapshot(): LinearSnapshot {
  const modules = import.meta.glob('../../data/snapshots/linear-snapshot-*.json', {
    eager: true,
  }) as Record<string, LinearSnapshot | { default: LinearSnapshot }>

  let latestPath: string | null = null
  let latestTs = ''

  for (const path of Object.keys(modules)) {
    const ts = timestampFromPath(path)
    if (ts && ts > latestTs) {
      latestTs = ts
      latestPath = path
    }
  }

  if (latestPath) {
    return unwrapModule(modules[latestPath])
  }

  return fallbackSnapshot as LinearSnapshot
}
