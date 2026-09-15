// ---------- Identifiers ----------
export type ID = string

// ---------- Subjects & Topics ----------
export type PlantKind =
  | 'oak' | 'pine' | 'blossom' | 'lavender' | 'ancient' | 'hedge' | 'clover' | 'fern'

export interface Subject {
  id: ID
  name: string
  color: string // hex accent
  icon: string // key into icon map
  plantKind: PlantKind
  priority: 'low' | 'medium' | 'high'
  targetWeeklyMinutes: number
  examDate: string | null // ISO date
  archived: boolean
  order: number
  createdAt: string
  /** Last local edit time (ISO). Optional/undefined for records created before
   *  cloud sync existed. Used by the sync layer to resolve conflicts. */
  updatedAt?: string
}

export type TopicStatus = 'not_started' | 'learning' | 'practising' | 'confident' | 'mastered'

export interface Topic {
  id: ID
  subjectId: ID
  name: string
  status: TopicStatus
  minutesStudied: number
  order: number
  createdAt: string
  updatedAt?: string
}

// ---------- Tasks ----------
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: ID
  title: string
  subjectId: ID | null
  topicId: ID | null
  dueDate: string | null // ISO date (day granularity)
  estimatedMinutes: number | null
  priority: TaskPriority
  completed: boolean
  completedAt: string | null
  notes: string
  createdAt: string
  /** Day-of-week (0=Mon..6=Sun) this task is planned for, used by the weekly planner */
  plannedDay: number | null
  updatedAt?: string
}

// ---------- Study sessions ----------
export type SessionFeeling = 'difficult' | 'okay' | 'good' | 'excellent'

export interface StudySession {
  id: ID
  subjectId: ID | null
  topicId: ID | null
  taskId: ID | null
  startedAt: string // ISO timestamp
  endedAt: string // ISO timestamp
  plannedMinutes: number
  actualMinutes: number
  xpEarned: number
  feeling: SessionFeeling | null
  notes: string
  cancelled: boolean
}

// ---------- Wellness ----------
export interface WellnessEntry {
  id: ID
  date: string // ISO date, one per day
  gym: boolean
  walk: boolean
  sleepHours: number | null
  hydration: boolean
  mood: 1 | 2 | 3 | 4 | 5 | null
  breakTaken: boolean
  updatedAt?: string
}

// ---------- Routine (repeating school week) ----------
export interface RoutineBlock {
  id: ID
  day: number // 0=Mon .. 6=Sun
  startTime: string // "17:00"
  label: string
  subjectId: ID | null
  durationMinutes: number
  updatedAt?: string
}

// ---------- Achievements ----------
export interface AchievementDef {
  id: ID
  name: string
  description: string
  check: (stats: LifetimeStats) => boolean
}

export interface UnlockedAchievement {
  id: ID
  unlockedAt: string
}

// ---------- World ----------
export interface WorldObjectDef {
  id: ID
  name: string
  description: string
  category: 'terrain' | 'plant' | 'water' | 'path' | 'building' | 'decoration'
  requirement: (stats: LifetimeStats) => boolean
  requirementLabel: string
}

export interface WorldState {
  unlockedObjectIds: ID[]
  worldName: string
  updatedAt?: string
}

// ---------- Settings ----------
export type ThemeMode = 'dark' | 'darker'

export interface Settings {
  userName: string
  onboardingComplete: boolean
  dailyStudyTargetMinutes: number
  weeklyStudyTargetMinutes: number
  theme: ThemeMode
  soundEnabled: boolean
  animationsEnabled: boolean
  defaultSessionMinutes: number
  worldName: string
  reducedMotion: boolean
  updatedAt?: string
}

// ---------- Derived / computed ----------
export interface LifetimeStats {
  totalStudyMinutes: number
  totalSessions: number
  totalTasksCompleted: number
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  studyDaysThisWeek: number
  masteredTopics: number
  subjectsWithSessions: number
  wellnessDaysBalanced: number
  longestSingleDayMinutes: number
}

// ---------- Root app data shape (what gets exported/imported) ----------
export interface AppData {
  version: number
  settings: Settings
  subjects: Subject[]
  topics: Topic[]
  tasks: Task[]
  sessions: StudySession[]
  wellness: WellnessEntry[]
  routine: RoutineBlock[]
  world: WorldState
  achievements: UnlockedAchievement[]
  exportedAt?: string
}
