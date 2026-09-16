import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react'
import type {
  AppData,
  Subject,
  Topic,
  Task,
  StudySession,
  WellnessEntry,
  RoutineBlock,
  Settings,
} from '../types'
import * as store from './dataStore'
import { emptyAppData, SUGGESTED_SUBJECTS } from './defaults'
import { computeLifetimeStats } from '../lib/stats'
import { evaluateWorldUnlocks } from '../lib/worldProgression'
import { evaluateAchievements } from '../lib/achievements'
import type { WorldObjectDef, AchievementDef } from '../types'

function uid(): string {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

interface Discovery {
  world: WorldObjectDef[]
  achievements: AchievementDef[]
}

interface AppDataCtx {
  data: AppData
  loading: boolean
  stats: ReturnType<typeof computeLifetimeStats>
  lastDiscovery: Discovery | null
  clearDiscovery: () => void

  // subjects
  addSubject: (
    s: Omit<Subject, 'id' | 'createdAt' | 'order' | 'archived'>
  ) => Subject
  updateSubject: (id: string, patch: Partial<Subject>) => void
  deleteSubject: (id: string) => void
  seedSuggestedSubjects: (names: string[]) => Promise<void>

  // topics
  addTopic: (
    t: Omit<Topic, 'id' | 'createdAt' | 'order' | 'minutesStudied'>
  ) => Topic
  updateTopic: (id: string, patch: Partial<Topic>) => void
  deleteTopic: (id: string) => void

  // tasks
  addTask: (
    t: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedAt'>
  ) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void

  // sessions
  completeSession: (
    s: Omit<StudySession, 'id'>
  ) => { session: StudySession; discovery: Discovery }

  // wellness
  upsertWellness: (
    entry: Omit<WellnessEntry, 'id'> & { id?: string }
  ) => void

  // routine
  addRoutineBlock: (r: Omit<RoutineBlock, 'id'>) => void
  deleteRoutineBlock: (id: string) => void

  // settings
  updateSettings: (patch: Partial<Settings>) => void

  // data mgmt
  exportData: () => Promise<string>
  importData: (json: string) => Promise<void>
  resetData: () => Promise<void>

  // auth hook
  switchUser: (uid: string | null) => Promise<AppData | null>
}

const Ctx = createContext<AppDataCtx | null>(null)

export function AppDataProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [data, setData] = useState<AppData>(emptyAppData())
  const [loading, setLoading] = useState(true)
  const [lastDiscovery, setLastDiscovery] =
    useState<Discovery | null>(null)

  // Prevent simultaneous subject-seeding calls from racing each other.
  const seedingSubjectsRef = useRef(false)

  useEffect(() => {
    let mounted = true

    store
      .loadAppData()
      .then((loaded) => {
        if (!mounted) return
        setData(loaded)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load Grove data:', error)

        if (!mounted) return

        setData(emptyAppData())
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(() => computeLifetimeStats(data), [data])

  const runDiscoveryCheck = useCallback((nextData: AppData) => {
    const nextStats = computeLifetimeStats(nextData)

    const worldResult = evaluateWorldUnlocks(
      nextStats,
      nextData.world.unlockedObjectIds
    )

    const achResult = evaluateAchievements(
      nextStats,
      nextData.achievements.map((a) => a.id)
    )

    if (
      worldResult.newlyUnlocked.length ||
      achResult.newlyUnlocked.length
    ) {
      const newWorld = {
        ...nextData.world,
        unlockedObjectIds: worldResult.unlockedIds,
        updatedAt: new Date().toISOString(),
      }

      const newAch = [
        ...nextData.achievements,
        ...achResult.newlyUnlocked.map((a) => ({
          id: a.id,
          unlockedAt: new Date().toISOString(),
        })),
      ]

      store.saveWorld(newWorld)
      store.saveAchievements(newAch)

      nextData = {
        ...nextData,
        world: newWorld,
        achievements: newAch,
      }

      setLastDiscovery({
        world: worldResult.newlyUnlocked,
        achievements: achResult.newlyUnlocked,
      })
    }

    return nextData
  }, [])

  const clearDiscovery = useCallback(
    () => setLastDiscovery(null),
    []
  )

  // ---------- Subjects ----------

  const addSubject: AppDataCtx['addSubject'] = useCallback((s) => {
    const subject: Subject = {
      ...s,
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 999,
      archived: false,
    }

    setData((prev) => {
      const subjects = [...prev.subjects, subject]
      store.putSubject(subject)
      return { ...prev, subjects }
    })

    return subject
  }, [])

  const updateSubject: AppDataCtx['updateSubject'] = useCallback(
    (id, patch) => {
      setData((prev) => {
        const subjects = prev.subjects.map((s) =>
          s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s
        )

        const updated = subjects.find((s) => s.id === id)

        if (updated) {
          store.putSubject(updated)
        }

        return { ...prev, subjects }
      })
    },
    []
  )

  const deleteSubject: AppDataCtx['deleteSubject'] = useCallback(
    (id) => {
      setData((prev) => {
        store.deleteSubject(id)

        return {
          ...prev,
          subjects: prev.subjects.filter((s) => s.id !== id),
        }
      })
    },
    []
  )

  const seedSuggestedSubjects: AppDataCtx['seedSuggestedSubjects'] =
    useCallback(async (names) => {
      // Prevent concurrent calls from racing.
      if (seedingSubjectsRef.current) return

      seedingSubjectsRef.current = true

      try {
        const freshSubjects = await store.loadSubjects()

        // Normalize and deduplicate the requested names first.
        const selectedNames = Array.from(
          new Set(
            names
              .map((name) => name.trim().toLowerCase())
              .filter(Boolean)
          )
        )

        // Build a set from what is actually in IndexedDB.
        const existingNames = new Set(
          freshSubjects.map((subject) =>
            subject.name.trim().toLowerCase()
          )
        )

        // Also track names as we create subjects so duplicate entries
        // inside SUGGESTED_SUBJECTS can never create duplicate records.
        const namesBeingAdded = new Set<string>()
        const subjectsToAdd: Subject[] = []

        for (const suggested of SUGGESTED_SUBJECTS) {
          const normalizedName = suggested.name.trim().toLowerCase()

          if (
            !selectedNames.includes(normalizedName) ||
            existingNames.has(normalizedName) ||
            namesBeingAdded.has(normalizedName)
          ) {
            continue
          }

          namesBeingAdded.add(normalizedName)

          subjectsToAdd.push({
            ...suggested,
            id: `suggested-${normalizedName}`,
            priority: 'medium',
            targetWeeklyMinutes: 120,
            examDate: null,
            archived: false,
            order: freshSubjects.length + subjectsToAdd.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }

        if (!subjectsToAdd.length) {
          // Make sure React state also reflects the real database.
          setData((prev) => ({
            ...prev,
            subjects: freshSubjects,
          }))
          return
        }

        const nextSubjects = [
          ...freshSubjects,
          ...subjectsToAdd,
        ]

        // Replace the database list with the deduplicated list.
        await store.saveSubjects(nextSubjects)

        // Read back what was actually persisted instead of assuming
        // the write succeeded.
        const verifiedSubjects = await store.loadSubjects()

        setData((prev) => ({
          ...prev,
          subjects: verifiedSubjects,
        }))
      } catch (error) {
        console.error(
          'Grove: failed to seed suggested subjects.',
          error
        )
      } finally {
        seedingSubjectsRef.current = false
      }
    }, [])

  // ---------- Topics ----------

  const addTopic: AppDataCtx['addTopic'] = useCallback((t) => {
    const topic: Topic = {
      ...t,
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 999,
      minutesStudied: 0,
    }

    setData((prev) => {
      const topics = [...prev.topics, topic]
      store.putTopic(topic)

      return { ...prev, topics }
    })

    return topic
  }, [])

  const updateTopic: AppDataCtx['updateTopic'] = useCallback(
    (id, patch) => {
      setData((prev) => {
        const topics = prev.topics.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
        )

        const updated = topics.find((t) => t.id === id)

        if (updated) {
          store.putTopic(updated)
        }

        let next = { ...prev, topics }

        if (patch.status) {
          next = runDiscoveryCheck(next)
        }

        return next
      })
    },
    [runDiscoveryCheck]
  )

  const deleteTopic: AppDataCtx['deleteTopic'] = useCallback(
    (id) => {
      setData((prev) => {
        store.deleteTopic(id)

        return {
          ...prev,
          topics: prev.topics.filter((t) => t.id !== id),
        }
      })
    },
    []
  )

  // ---------- Tasks ----------

  const addTask: AppDataCtx['addTask'] = useCallback((t) => {
    const task: Task = {
      ...t,
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
    }

    setData((prev) => {
      const tasks = [...prev.tasks, task]
      store.putTask(task)

      return { ...prev, tasks }
    })

    return task
  }, [])

  const updateTask: AppDataCtx['updateTask'] = useCallback(
    (id, patch) => {
      setData((prev) => {
        const tasks = prev.tasks.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
        )

        const updated = tasks.find((t) => t.id === id)

        if (updated) {
          store.putTask(updated)
        }

        return { ...prev, tasks }
      })
    },
    []
  )

  const toggleTask: AppDataCtx['toggleTask'] = useCallback(
    (id) => {
      setData((prev) => {
        const tasks = prev.tasks.map((t) => {
          if (t.id !== id) return t

          const completed = !t.completed

          return {
            ...t,
            completed,
            completedAt: completed
              ? new Date().toISOString()
              : null,
            updatedAt: new Date().toISOString(),
          }
        })

        const updated = tasks.find((t) => t.id === id)

        if (updated) {
          store.putTask(updated)
        }

        return runDiscoveryCheck({
          ...prev,
          tasks,
        })
      })
    },
    [runDiscoveryCheck]
  )

  const deleteTask: AppDataCtx['deleteTask'] = useCallback(
    (id) => {
      setData((prev) => {
        store.deleteTask(id)

        return {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== id),
        }
      })
    },
    []
  )

  // ---------- Sessions ----------

  const completeSession: AppDataCtx['completeSession'] =
    useCallback(
      (s) => {
        const session: StudySession = {
          ...s,
          id: uid(),
        }

        const discovery: Discovery = {
          world: [],
          achievements: [],
        }

        setData((prev) => {
          const sessions = [...prev.sessions, session]

          store.putSession(session)

          let topics = prev.topics

          if (session.topicId) {
            topics = topics.map((t) =>
              t.id === session.topicId
                ? {
                    ...t,
                    minutesStudied:
                      t.minutesStudied +
                      session.actualMinutes,
                    updatedAt: new Date().toISOString(),
                  }
                : t
            )

            const updated = topics.find(
              (t) => t.id === session.topicId
            )

            if (updated) {
              store.putTopic(updated)
            }
          }

          let next = {
            ...prev,
            sessions,
            topics,
          }

          next = runDiscoveryCheck(next)

          return next
        })

        return { session, discovery }
      },
      [runDiscoveryCheck]
    )

  // ---------- Wellness ----------

  const upsertWellness: AppDataCtx['upsertWellness'] =
    useCallback(
      (entry) => {
        setData((prev) => {
          const existingIdx = prev.wellness.findIndex(
            (w) => w.date === entry.date
          )

          let wellness: WellnessEntry[]
          let saved: WellnessEntry

          if (existingIdx >= 0) {
            saved = {
              ...prev.wellness[existingIdx],
              ...entry,
              id: prev.wellness[existingIdx].id,
              updatedAt: new Date().toISOString(),
            }

            wellness = [...prev.wellness]
            wellness[existingIdx] = saved
          } else {
            saved = {
              ...entry,
              id: uid(),
              updatedAt: new Date().toISOString(),
            } as WellnessEntry

            wellness = [...prev.wellness, saved]
          }

          store.putWellness(saved)

          return runDiscoveryCheck({
            ...prev,
            wellness,
          })
        })
      },
      [runDiscoveryCheck]
    )

  // ---------- Routine ----------

  const addRoutineBlock: AppDataCtx['addRoutineBlock'] =
    useCallback((r) => {
      const block: RoutineBlock = {
        ...r,
        id: uid(),
        updatedAt: new Date().toISOString(),
      }

      setData((prev) => {
        store.putRoutineBlock(block)

        return {
          ...prev,
          routine: [...prev.routine, block],
        }
      })
    }, [])

  const deleteRoutineBlock: AppDataCtx['deleteRoutineBlock'] =
    useCallback((id) => {
      setData((prev) => {
        store.deleteRoutineBlock(id)

        return {
          ...prev,
          routine: prev.routine.filter((r) => r.id !== id),
        }
      })
    }, [])

  // ---------- Settings ----------

  const updateSettings: AppDataCtx['updateSettings'] =
    useCallback((patch) => {
      setData((prev) => {
        const settings = {
          ...prev.settings,
          ...patch,
          updatedAt: new Date().toISOString(),
        }

        store.saveSettings(settings).catch((error) => {
          console.error(
            'Grove: failed to persist settings.',
            error
          )
        })

        return {
          ...prev,
          settings,
        }
      })
    }, [])

  // ---------- Data management ----------

  const exportData = useCallback(
    () => store.exportAppData(),
    []
  )

  const importData = useCallback(async (json: string) => {
    await store.importAppData(json)

    const loaded = await store.loadAppData()

    setData(loaded)
  }, [])

  const resetData = useCallback(async () => {
    await store.resetAllData()

    setData(emptyAppData())
  }, [])

  const switchUser: AppDataCtx['switchUser'] = useCallback(async (uid) => {
    setLoading(true)
    const localSnapshot = await store.setActiveUser(uid)
    const loaded = await store.loadAppData()
    setData(loaded)
    setLoading(false)
    return localSnapshot
  }, [])

  const value: AppDataCtx = {
    data,
    loading,
    stats,
    lastDiscovery,
    clearDiscovery,

    addSubject,
    updateSubject,
    deleteSubject,
    seedSuggestedSubjects,

    addTopic,
    updateTopic,
    deleteTopic,

    addTask,
    updateTask,
    toggleTask,
    deleteTask,

    completeSession,

    upsertWellness,

    addRoutineBlock,
    deleteRoutineBlock,

    updateSettings,

    exportData,
    importData,
    resetData,

    switchUser,
  }

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  )
}

export function useAppData(): AppDataCtx {
  const ctx = useContext(Ctx)

  if (!ctx) {
    throw new Error(
      'useAppData must be used within AppDataProvider'
    )
  }

  return ctx
}