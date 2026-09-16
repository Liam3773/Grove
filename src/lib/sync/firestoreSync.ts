import { collection, doc, getDoc, getDocs, writeBatch, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { emptyAppData } from '../../data/defaults'
import type {
  AppData, Subject, Topic, Task, StudySession, WellnessEntry, RoutineBlock, UnlockedAchievement,
  Settings, WorldState,
} from '../../types'
import { computeLifetimeStats } from '../stats'

/**
 * firestoreSync.ts
 *
 * All direct Firestore reads/writes live here, behind two functions:
 * fetchRemoteData and pushLocalData. Everything else in the app (the sync
 * context, Settings UI) talks to those, never to `db` directly, per the
 * "no Firebase calls in components" rule.
 *
 * Layout in Firestore, scoped so a user can only ever touch their own data:
 *   /users/{uid}                      -> { settings, world }
 *   /users/{uid}/subjects/{id}        -> Subject
 *   /users/{uid}/topics/{id}          -> Topic
 *   /users/{uid}/tasks/{id}           -> Task
 *   /users/{uid}/sessions/{id}        -> StudySession   (id = stable UUID, dedupes automatically)
 *   /users/{uid}/wellness/{id}        -> WellnessEntry
 *   /users/{uid}/routine/{id}         -> RoutineBlock
 *   /users/{uid}/achievements/{id}    -> UnlockedAchievement
 */

const SUBCOLLECTIONS = ['subjects', 'topics', 'tasks', 'sessions', 'wellness', 'routine', 'achievements'] as const
type Subcollection = typeof SUBCOLLECTIONS[number]

const BATCH_CHUNK = 400 // stay comfortably under Firestore's 500-write batch limit

export function isSyncAvailable(): boolean {
  return db !== null
}

export async function fetchRemoteData(uid: string): Promise<AppData | null> {
  if (!db) return null
  const database = db

  const metaSnap = await getDoc(doc(database, 'users', uid))
  if (!metaSnap.exists()) return null // brand new account, nothing synced yet

  const meta = metaSnap.data() as { settings?: Settings; world?: WorldState }

  const snapshots = await Promise.all(
    SUBCOLLECTIONS.map((name) => getDocs(collection(database, 'users', uid, name)))
  )

  const [subjects, topics, tasks, sessions, wellness, routine, achievements] = snapshots.map(
    (snap) => snap.docs.map((d) => d.data())
  )

  const empty = emptyAppData()

  return {
    version: 1,
    settings: meta.settings ?? empty.settings,
    world: meta.world ?? empty.world,
    subjects: subjects as Subject[],
    topics: topics as Topic[],
    tasks: tasks as Task[],
    sessions: sessions as StudySession[],
    wellness: wellness as WellnessEntry[],
    routine: routine as RoutineBlock[],
    achievements: achievements as UnlockedAchievement[],
  }
}

export async function pushLocalData(uid: string, data: AppData): Promise<void> {
  if (!db) return
  const database = db

  // Settings + world live on the parent user doc since they're singletons.
  const metaRef = doc(database, 'users', uid)
  const metaBatch = writeBatch(database)
  metaBatch.set(metaRef, { settings: data.settings, world: data.world }, { merge: true })
  await metaBatch.commit()

  // Update public profile for leaderboards
  const stats = computeLifetimeStats(data)
  const profileRef = doc(database, 'profiles', uid)
  // We only update totalStudyMinutes here; we don't want to overwrite the username
  // if it's already set by the communityService during signup.
  await setDoc(profileRef, {
    uid,
    totalStudyMinutes: stats.totalStudyMinutes
  }, { merge: true })

  const collectionsData: Record<Subcollection, { id: string }[]> = {
    subjects: data.subjects,
    topics: data.topics,
    tasks: data.tasks,
    sessions: data.sessions,
    wellness: data.wellness,
    routine: data.routine,
    achievements: data.achievements,
  }

  for (const name of SUBCOLLECTIONS) {
    const items = collectionsData[name]
    for (let i = 0; i < items.length; i += BATCH_CHUNK) {
      const chunk = items.slice(i, i + BATCH_CHUNK)
      const batch = writeBatch(database)
      for (const item of chunk) {
        batch.set(doc(database, 'users', uid, name, item.id), item)
      }
      await batch.commit()
    }
  }
}
