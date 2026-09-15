import { openDB, type IDBPDatabase } from 'idb'
import type {
  AppData, Settings, Subject, Topic, Task, StudySession, WellnessEntry,
  RoutineBlock, WorldState, UnlockedAchievement,
} from '../types'
import { emptyAppData, DEFAULT_SETTINGS } from './defaults'

/**
 * dataStore.ts
 *
 * Local-first persistence layer. Everything the app reads/writes goes
 * through this module. Today it's backed by IndexedDB; a future cloud-sync
 * version can implement the same function signatures (e.g. swap the
 * internals for API calls, or add a background sync queue) without any
 * page/component code needing to change.
 */

const DB_NAME = 'grove-db'
// v1 -> v2: 'settings' and 'world' were created as out-of-line-key stores
// (keyPath: undefined), but every write to them (saveSettings/saveWorld)
// called db.put(store, item) without ever supplying the required key
// argument. Per the IndexedDB spec, put() on an out-of-line-key store with
// no key throws a DataError immediately -- so those writes always failed
// silently and NOTHING was ever actually saved to either store. That's why
// `onboardingComplete` never survived a reload (it always fell back to
// DEFAULT_SETTINGS) even though other stores with in-line keys (subjects,
// sessions, etc., keyPath: 'id') persisted correctly the whole time.
//
// The fix: give these two singleton stores an in-line keyPath ('key') that
// matches the `{ key, value }` shape saveSettings/saveWorld already write,
// so db.put() can derive the key from the item itself. Since every prior
// write to these stores threw before completing, they are guaranteed to be
// empty (or missing) on any existing database, so recreating them on
// upgrade is safe and loses no user data.
const DB_VERSION = 2

const STORES = [
  'settings', 'subjects', 'topics', 'tasks', 'sessions', 'wellness', 'routine', 'world', 'achievements',
] as const

const SINGLETON_STORES = new Set(['settings', 'world'])

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion > 0 && oldVersion < 2) {
          // Migrating from the broken v1 schema: these stores never held
          // any real data (every write to them threw), so it's safe to
          // drop and recreate them with a working keyPath. Everything else
          // (subjects, topics, tasks, sessions, wellness, routine,
          // achievements) is left completely untouched.
          for (const store of SINGLETON_STORES) {
            if (db.objectStoreNames.contains(store)) {
              db.deleteObjectStore(store)
            }
          }
        }
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: SINGLETON_STORES.has(store) ? 'key' : 'id' })
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
  await tx.objectStore(store).clear()
  for (const item of items) await tx.objectStore(store).put(item)
  await tx.done
}

async function putOne(store: string, item: any) {
  const db = await getDB()
  try {
    await db.put(store, item)
  } catch (error) {
    // A silent failure here is exactly what caused onboardingComplete to
    // never persist in the past (see DB_VERSION note above) -- surface any
    // future write failure loudly instead of losing it quietly.
    console.error(`Grove: failed to write to IndexedDB store "${store}".`, error)
    throw error
  }
}

async function deleteOne(store: string, id: string) {
  const db = await getDB()
  await db.delete(store, id)
}

// ---------- Public API ----------

export async function loadAppData(): Promise<AppData> {
  const db = await getDB()
  const [settingsRow, subjects, topics, tasks, sessions, wellness, routine, worldRow, achievements] =
    await Promise.all([
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

export async function saveSettings(settings: Settings) {
  await putOne('settings', { key: SETTINGS_KEY, value: settings })
}

export async function saveWorld(world: WorldState) {
  await putOne('world', { key: WORLD_KEY, value: world })
}

export async function saveSubjects(subjects: Subject[]) { await putAll('subjects', subjects) }
export async function saveTopics(topics: Topic[]) { await putAll('topics', topics) }
export async function saveTasks(tasks: Task[]) { await putAll('tasks', tasks) }
export async function saveSessions(sessions: StudySession[]) { await putAll('sessions', sessions) }
export async function saveWellness(entries: WellnessEntry[]) { await putAll('wellness', entries) }
export async function saveRoutine(blocks: RoutineBlock[]) { await putAll('routine', blocks) }
export async function saveAchievements(list: UnlockedAchievement[]) { await putAll('achievements', list) }

export async function putSubject(s: Subject) { await putOne('subjects', s) }
export async function putTopic(t: Topic) { await putOne('topics', t) }
export async function putTask(t: Task) { await putOne('tasks', t) }
export async function putSession(s: StudySession) { await putOne('sessions', s) }
export async function putWellness(w: WellnessEntry) { await putOne('wellness', w) }
export async function putRoutineBlock(r: RoutineBlock) { await putOne('routine', r) }

export async function deleteSubject(id: string) { await deleteOne('subjects', id) }
export async function deleteTopic(id: string) { await deleteOne('topics', id) }
export async function deleteTask(id: string) { await deleteOne('tasks', id) }
export async function deleteRoutineBlock(id: string) { await deleteOne('routine', id) }

export async function exportAppData(): Promise<string> {
  const data = await loadAppData()
  data.exportedAt = new Date().toISOString()
  return JSON.stringify(data, null, 2)
}

export async function importAppData(json: string): Promise<void> {
  const parsed = JSON.parse(json) as AppData
  if (!parsed || typeof parsed !== 'object' || !parsed.settings) {
    throw new Error('That file does not look like a Grove backup.')
  }
  await Promise.all([
    saveSettings(parsed.settings ?? { ...DEFAULT_SETTINGS }),
    saveSubjects(parsed.subjects ?? []),
    saveTopics(parsed.topics ?? []),
    saveTasks(parsed.tasks ?? []),
    saveSessions(parsed.sessions ?? []),
    saveWellness(parsed.wellness ?? []),
    saveRoutine(parsed.routine ?? []),
    saveWorld(parsed.world ?? { unlockedObjectIds: [], worldName: 'Your Grove' }),
    saveAchievements(parsed.achievements ?? []),
  ])
}

export async function resetAllData(): Promise<void> {
  const db = await getDB()
  for (const store of STORES) {
    await db.clear(store)
  }
}
