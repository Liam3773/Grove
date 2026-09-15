import { Link } from 'react-router-dom'
import { Flame, Sparkles, ArrowRight, Check, Circle } from 'lucide-react'
import { useAppData } from '../data/AppDataContext'
import { Card, ProgressBar, Pill, Button } from '../components/ui'
import { WorldScene } from '../features/world/WorldScene'
import { WORLD_UNLOCKS } from '../lib/worldProgression'
import { levelFromXP } from '../lib/xp'
import { formatMinutes, greeting, formatDateLabel, todayISODate, currentWeekdayIndex } from '../utils/format'
import { minutesOnDay } from '../lib/stats'
import { Dumbbell, Footprints, Moon } from 'lucide-react'

export default function Home() {
  const { data, stats, upsertWellness } = useAppData()
  const today = todayISODate()
  const wellnessToday = data.wellness.find((w) => w.date === today)
  const minutesToday = minutesOnDay(data.sessions.filter((s) => !s.cancelled), today)
  const tasksToday = data.tasks.filter(
    (t) => (t.dueDate === today || t.plannedDay === currentWeekdayIndex()) && !t.completed
  )
  const tasksCompletedToday = data.tasks.filter(
    (t) => t.completed && t.completedAt && t.completedAt.slice(0, 10) === today
  ).length
  const allTodayTasks = data.tasks.filter((t) => t.dueDate === today || t.plannedDay === currentWeekdayIndex())
  const dailyTarget = data.settings.dailyStudyTargetMinutes || 1
  const dayPct = Math.min(1, minutesToday / dailyTarget)

  const levelInfo = levelFromXP(stats.totalXP)

  const nextTask = tasksToday.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })[0]

  const nextSubject = nextTask ? data.subjects.find((s) => s.id === nextTask.subjectId) : undefined

  const weeklyTarget = data.settings.weeklyStudyTargetMinutes || 1
  const weekTotal = data.sessions
    .filter((s) => !s.cancelled)
    .filter((s) => {
      const d = new Date(s.endedAt)
      const now = new Date()
      const dow = (now.getDay() + 6) % 7
      const monday = new Date(now)
      monday.setHours(0, 0, 0, 0)
      monday.setDate(now.getDate() - dow)
      return d >= monday
    })
    .reduce((sum, s) => sum + s.actualMinutes, 0)

  const name = data.settings.userName?.trim()

  return (
    <div className="animate-rise">
      <p className="text-sm text-mist-600">{formatDateLabel()}</p>
      <h1 className="font-display text-2xl font-semibold text-mist-100 mb-6">
        {greeting()}{name ? `, ${name}` : ''}
      </h1>

      {/* Today */}
      <Card className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-mist-600">Today's progress</p>
          <Pill tone="moss">{Math.round(dayPct * 100)}%</Pill>
        </div>
        <ProgressBar value={dayPct} className="mb-4" />
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="font-display text-xl text-mist-100">{formatMinutes(minutesToday)}</p>
            <p className="text-mist-600">studied</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl text-mist-100">
              {tasksCompletedToday} / {allTodayTasks.length || tasksCompletedToday}
            </p>
            <p className="text-mist-600">tasks done</p>
          </div>
        </div>
      </Card>

      {/* Wellness quick log */}
      <Card className="mb-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">Today</p>
        <div className="flex items-center justify-between gap-2">
          <WellnessToggle
            icon={Dumbbell}
            label="Gym"
            active={!!wellnessToday?.gym}
            onClick={() => upsertWellness({ date: today, gym: !wellnessToday?.gym, walk: wellnessToday?.walk ?? false, sleepHours: wellnessToday?.sleepHours ?? null, hydration: wellnessToday?.hydration ?? false, mood: wellnessToday?.mood ?? null, breakTaken: wellnessToday?.breakTaken ?? false })}
          />
          <WellnessToggle
            icon={Footprints}
            label="Walk"
            active={!!wellnessToday?.walk}
            onClick={() => upsertWellness({ date: today, gym: wellnessToday?.gym ?? false, walk: !wellnessToday?.walk, sleepHours: wellnessToday?.sleepHours ?? null, hydration: wellnessToday?.hydration ?? false, mood: wellnessToday?.mood ?? null, breakTaken: wellnessToday?.breakTaken ?? false })}
          />
          <WellnessToggle
            icon={Moon}
            label={wellnessToday?.sleepHours ? `${wellnessToday.sleepHours}h` : 'Sleep'}
            active={!!wellnessToday?.sleepHours}
            onClick={() => {
              const val = window.prompt('Hours of sleep last night?', String(wellnessToday?.sleepHours ?? 8))
              const num = val ? Number(val) : null
              if (num !== null && !Number.isNaN(num)) {
                upsertWellness({ date: today, gym: wellnessToday?.gym ?? false, walk: wellnessToday?.walk ?? false, sleepHours: num, hydration: wellnessToday?.hydration ?? false, mood: wellnessToday?.mood ?? null, breakTaken: wellnessToday?.breakTaken ?? false })
              }
            }}
          />
        </div>
      </Card>

      {/* Streak & XP row */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="flex items-center gap-3">
          <Flame size={22} className="text-amber-400" />
          <div>
            <p className="font-display text-lg text-mist-100">{stats.currentStreak} day{stats.currentStreak === 1 ? '' : 's'}</p>
            <p className="text-xs text-mist-600">current streak</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <Sparkles size={22} className="text-moss-400" />
          <div>
            <p className="font-display text-lg text-mist-100">Level {levelInfo.level}</p>
            <p className="text-xs text-mist-600">{stats.totalXP} XP total</p>
          </div>
        </Card>
      </div>

      {/* Next up */}
      <Card className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist-600">Next up</p>
        {nextTask ? (
          <>
            <p className="font-display text-lg text-mist-100">{nextSubject?.name ?? 'Study'}</p>
            <p className="text-sm text-mist-400 mb-3">{nextTask.title}</p>
            <Link to={`/study?taskId=${nextTask.id}`}>
              <Button className="w-full">
                Start session <ArrowRight size={16} />
              </Button>
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-mist-400 mb-3">Nothing planned right now — pick a subject and start whenever you're ready.</p>
            <Link to="/study">
              <Button className="w-full">
                Start a session <ArrowRight size={16} />
              </Button>
            </Link>
          </>
        )}
      </Card>

      {/* World preview */}
      <Card className="mb-4 overflow-hidden p-0">
        <div className="p-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-mist-600">{data.world.worldName || 'Your world'}</p>
        </div>
        <WorldScene
          unlockedIds={data.world.unlockedObjectIds}
          unlockedDefs={WORLD_UNLOCKS}
          width={400}
          height={180}
          className="w-full"
        />
        <div className="p-4 pt-3">
          <Link to="/world" className="inline-flex items-center gap-1 text-sm text-moss-400">
            Explore your world <ArrowRight size={14} />
          </Link>
        </div>
      </Card>

      {/* Today's plan */}
      {allTodayTasks.length > 0 && (
        <Card className="mb-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">Today's plan</p>
          <ul className="space-y-2.5">
            {allTodayTasks.slice(0, 6).map((t) => (
              <li key={t.id} className="flex items-center gap-2.5 text-sm">
                {t.completed ? (
                  <Check size={16} className="shrink-0 text-moss-400" />
                ) : (
                  <Circle size={16} className="shrink-0 text-mist-600" />
                )}
                <span className={t.completed ? 'text-mist-600 line-through' : 'text-mist-200'}>
                  {data.subjects.find((s) => s.id === t.subjectId)?.name ? `${data.subjects.find((s) => s.id === t.subjectId)?.name} — ` : ''}
                  {t.title}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* This week */}
      <Card className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist-600">This week</p>
        <p className="font-display text-xl text-mist-100 mb-2">{formatMinutes(weekTotal)}</p>
        <ProgressBar value={weekTotal / weeklyTarget} />
        <p className="mt-2 text-xs text-mist-600">Goal: {formatMinutes(weeklyTarget)}</p>
      </Card>

      <p className="pb-4 text-center text-sm text-mist-600 italic">Do something meaningful today.</p>
    </div>
  )
}

function WellnessToggle({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-2.5 text-xs transition-colors ${
        active ? 'border-moss-500 bg-moss-500/10 text-moss-300' : 'border-earth-700 text-mist-500'
      }`}
    >
      <Icon size={17} />
      {label}
    </button>
  )
}
