import { openDB, deleteDB, type IDBPDatabase } from 'idb'
import type {
  AppData,
  Settings,
  Subject,
  Topic,
  Task,
  StudySession,
  WellnessEntry,
  RoutineBlock,
  WorldState,
  UnlockedAchievement,
} from '../types'
import { emptyAppData, DEFAULT_SETTINGS } from './defaults'

/**
 * Local-first persistence layer for Grove.
 *
 * Everything the app reads/writes goes through this module.
 * IndexedDB is used for local persistence and can later be extended
 * with cloud sync without changing the rest of the app.
 */

let dbNameCache = localStorage.getItem('grove_last_uid')
  ? `grove-db-${localStorage.getItem('grove_last_uid')}`
  : 'grove-db'

// v1 -> v2:
// settings and world were incorrectly created as out-of-line key stores.
// They are now recreated using an inline `key` keyPath so that
// { key, value } objects can be written correctly.
const DB_VERSION = 2

const STORES = [
  'settings',
  'subjects',
  'topics',
  'tasks',
  'sessions',
  'wellness',
  'routine',
  'world',
  'achievements',
] as const

const SINGLETON_STORES = new Set(['settings', 'world'])

let dbPromise: Promise<IDBPDatabase> | null = null

function getDBName() {
  const activeUid = localStorage.getItem('grove_last_uid')
  return activeUid ? `grove-db-${activeUid}` : 'grove-db'
}

function getDB() {
  if (!dbPromise) {
    dbNameCache = getDBName()
    dbPromise = openDB(dbNameCache, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Migrate the broken v1 singleton stores.
        //
        // The old settings/world stores could not successfully save
        // because their writes were missing an explicit key, so deleting
        // and recreating them loses no valid persisted data.
        if (oldVersion > 0 && oldVersion < 2) {
          for (const store of SINGLETON_STORES) {
            if (db.objectStoreNames.contains(store)) {
              db.deleteObjectStore(store)
            }
          }
        }

        // Create any stores that don't already exist.
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, {
              keyPath: SINGLETON_STORES.has(store) ? 'key' : 'id',
            })
          }
        }
      },
    })
  }

  return dbPromise
}

const SETTINGS_KEY = 'singleton'
const WORLD_KEY = 'singleton'

async function getAll<T>(store: string): Promise<T[]> {
  const db = await getDB()
  return db.getAll(store)
}

async function putAll(store: string, items: any[]) {
  const db = await getDB()

  const tx = db.transaction(store, 'readwrite')
  const objectStore = tx.objectStore(store)

  await objectStore.clear()

  for (const item of items) {
    await objectStore.put(item)
  }

  await tx.done
}

async function putOne(store: string, item: any) {
  const db = await getDB()

  try {
    await db.put(store, item)
  } catch (error) {
    console.error(
      `Grove: failed to write to IndexedDB store "${store}".`,
      error
    )
    throw error
  }
}

async function deleteOne(store: string, id: string) {
  const db = await getDB()
  await db.delete(store, id)
}

// ---------- Public API ----------

export async function setActiveUser(uid: string | null): Promise<AppData | null> {
  const currentUid = localStorage.getItem('grove_last_uid')

  if (currentUid === (uid ?? null)) {
    return null
  }

  let localSnapshot: AppData | null = null

  // Transitioning from logged-out -> logged-in: capture the snapshot
  if (!currentUid && uid) {
    localSnapshot = await loadAppData()
  }

  if (uid) {
    localStorage.setItem('grove_last_uid', uid)
  } else {
    localStorage.removeItem('grove_last_uid')
  }

  if (dbPromise) {
    const db = await dbPromise
    db.close()
    dbPromise = null
  }

  return localSnapshot
}

export function getActiveUser(): string | null {
  return localStorage.getItem('grove_last_uid')
}

export async function clearUnauthDatabase(): Promise<void> {
  // If we are currently unauthenticated, do nothing (we don't want to wipe the active db by accident if state changed)
  const currentUid = localStorage.getItem('grove_last_uid')
  if (!currentUid) {
    return
  }

  // Delete the unauthenticated database
  await deleteDB('grove-db')
}

export async function loadAppData(): Promise<AppData> {
  const db = await getDB()

  const [
    settingsRow,
    subjects,
    topics,
    tasks,
    sessions,
    wellness,
    routine,
    worldRow,
    achievements,
  ] = await Promise.all([
    db.get('settings', SETTINGS_KEY),
    getAll<Subject>('subjects'),
    getAll<Topic>('topics'),
    getAll<Task>('tasks'),
    getAll<StudySession>('sessions'),
    getAll<WellnessEntry>('wellness'),
    getAll<RoutineBlock>('routine'),
    db.get('world', WORLD_KEY),
    getAll<UnlockedAchievement>('achievements'),
  ])

  const empty = emptyAppData()

  return {
    version: 1,
    settings: settingsRow?.value ?? { ...DEFAULT_SETTINGS },
    subjects,
    topics,
    tasks,
    sessions,
    wellness,
    routine,
    world: worldRow?.value ?? empty.world,
    achievements,
  }
}

export async function loadSubjects(): Promise<Subject[]> {
  return getAll<Subject>('subjects')
}

// ---------- Settings / World ----------

export async function saveSettings(settings: Settings) {
  await putOne('settings', {
    key: SETTINGS_KEY,
    value: settings,
  })
}

export async function saveWorld(world: WorldState) {
  await putOne('world', {
    key: WORLD_KEY,
    value: world,
  })
}

// ---------- Bulk saves ----------

export async function saveSubjects(subjects: Subject[]) {
  await putAll('subjects', subjects)
}

export async function saveTopics(topics: Topic[]) {
  await putAll('topics', topics)
}

export async function saveTasks(tasks: Task[]) {
  await putAll('tasks', tasks)
}

export async function saveSessions(sessions: StudySession[]) {
  await putAll('sessions', sessions)
}

export async function saveWellness(entries: WellnessEntry[]) {
  await putAll('wellness', entries)
}

export async function saveRoutine(blocks: RoutineBlock[]) {
  await putAll('routine', blocks)
}

export async function saveAchievements(
  list: UnlockedAchievement[]
) {
  await putAll('achievements', list)
}

// ---------- Individual writes ----------

export async function putSubject(s: Subject) {
  await putOne('subjects', s)
}

export async function putTopic(t: Topic) {
  await putOne('topics', t)
}

export async function putTask(t: Task) {
  await putOne('tasks', t)
}

export async function putSession(s: StudySession) {
  await putOne('sessions', s)
}

export async function putWellness(w: WellnessEntry) {
  await putOne('wellness', w)
}

export async function putRoutineBlock(r: RoutineBlock) {
  await putOne('routine', r)
}

// ---------- Deletes ----------

export async function deleteSubject(id: string) {
  await deleteOne('subjects', id)
}

export async function deleteTopic(id: string) {
  await deleteOne('topics', id)
}

export async function deleteTask(id: string) {
  await deleteOne('tasks', id)
}

export async function deleteRoutineBlock(id: string) {
  await deleteOne('routine', id)
}

// ---------- Export / Import ----------

export async function exportAppData(): Promise<string> {
  const data = await loadAppData()

  data.exportedAt = new Date().toISOString()

  return JSON.stringify(data, null, 2)
}

export async function importAppData(
  json: string
): Promise<void> {
  const parsed = JSON.parse(json) as AppData

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !parsed.settings
  ) {
    throw new Error(
      'That file does not look like a Grove backup.'
    )
  }

  await Promise.all([
    saveSettings(
      parsed.settings ?? { ...DEFAULT_SETTINGS }
    ),
    saveSubjects(parsed.subjects ?? []),
    saveTopics(parsed.topics ?? []),
    saveTasks(parsed.tasks ?? []),
    saveSessions(parsed.sessions ?? []),
    saveWellness(parsed.wellness ?? []),
    saveRoutine(parsed.routine ?? []),
    saveWorld(
      parsed.world ?? {
        unlockedObjectIds: [],
        worldName: 'Your Grove',
      }
    ),
    saveAchievements(parsed.achievements ?? []),
  ])
}

// ---------- Reset ----------

export async function resetAllData(): Promise<void> {
  const db = await getDB()

  for (const store of STORES) {
    await db.clear(store)
  }
}