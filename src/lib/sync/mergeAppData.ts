import type { AppData, UnlockedAchievement } from '../../types'

/**
 * mergeAppData.ts
 *
 * Pure conflict-resolution logic for combining a local AppData snapshot with
 * one pulled from Firestore. No Firebase, no React — just data in, data out,
 * so it's easy to reason about (and test) in isolation from I/O.
 *
 * Strategy:
 *  - Editable records (subjects, topics, tasks, wellness, routine, settings,
 *    world) are merged by id, last-write-wins using `updatedAt`. A record
 *    missing `updatedAt` (created before sync existed) is treated as older
 *    than any timestamped record.
 *  - Study sessions and unlocked achievements are treated as append-only
 *    events keyed by their stable id, so merging is a simple de-duplicated
 *    union — this is what keeps a session from ever being double-counted
 *    during a sync.
 */

type WithId = { id: string; updatedAt?: string }

function newerTimestamp(a?: string, b?: string): 'a' | 'b' | 'tie' {
  if (!a && !b) return 'tie'
  if (!a) return 'b'
  if (!b) return 'a'
  if (a === b) return 'tie'
  return a > b ? 'a' : 'b'
}

function mergeById<T extends WithId>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>()
  for (const item of local) byId.set(item.id, item)
  for (const item of remote) {
    const existing = byId.get(item.id)
    if (!existing) {
      byId.set(item.id, item)
      continue
    }
    const winner = newerTimestamp(existing.updatedAt, item.updatedAt)
    if (winner === 'b') byId.set(item.id, item)
    // 'a' or 'tie' -> keep existing (local) copy
  }
  return Array.from(byId.values())
}

/** Union of append-only, immutable-by-id records (sessions). Local wins ties
 *  since it's already the copy the user has been looking at. */
function mergeAppendOnly<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>()
  for (const item of remote) byId.set(item.id, item)
  for (const item of local) byId.set(item.id, item) // local overwrites remote on collision
  return Array.from(byId.values())
}

function mergeAchievements(local: UnlockedAchievement[], remote: UnlockedAchievement[]): UnlockedAchievement[] {
  const byId = new Map<string, UnlockedAchievement>()
  for (const item of remote) byId.set(item.id, item)
  for (const item of local) {
    const existing = byId.get(item.id)
    // keep whichever unlock happened first
    if (!existing || item.unlockedAt < existing.unlockedAt) byId.set(item.id, item)
  }
  return Array.from(byId.values())
}

function mergeSingleton<T>(local: T, remote: T | undefined): T {
  if (!remote) return local

  const localUpdatedAt = (local as { updatedAt?: string }).updatedAt
  const remoteUpdatedAt = (remote as { updatedAt?: string }).updatedAt

  if (!localUpdatedAt && !remoteUpdatedAt) return local

  const winner = newerTimestamp(localUpdatedAt, remoteUpdatedAt)
  return winner === 'b' ? remote : local
}

/**
 * Combine local + remote AppData into one merged snapshot. Pass `remote:
 * null` when there is no cloud data yet (brand new account) — the result is
 * just `local` unchanged, which the caller can then push up.
 */
export function mergeAppData(local: AppData, remote: AppData | null): AppData {
  if (!remote) return local

  return {
    version: local.version,
    settings: mergeSingleton(local.settings, remote.settings),
    world: mergeSingleton(local.world, remote.world),
    subjects: mergeById(local.subjects, remote.subjects),
    topics: mergeById(local.topics, remote.topics),
    tasks: mergeById(local.tasks, remote.tasks),
    wellness: mergeById(local.wellness, remote.wellness),
    routine: mergeById(local.routine, remote.routine),
    sessions: mergeAppendOnly(local.sessions, remote.sessions),
    achievements: mergeAchievements(local.achievements, remote.achievements),
  }
}

/** True if the local device has anything worth offering to sync (used to
 *  decide whether to show the "we found an existing grove" prompt). */
export function hasLocalContent(data: AppData): boolean {
  return (
    data.subjects.length > 0 ||
    data.topics.length > 0 ||
    data.tasks.length > 0 ||
    data.sessions.length > 0 ||
    data.wellness.length > 0 ||
    data.routine.length > 0 ||
    data.achievements.length > 0 ||
    data.settings.onboardingComplete
  )
}
