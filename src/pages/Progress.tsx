import { useMemo, useState } from 'react'
import { useAppData } from '../data/AppDataContext'
import { Card, PageHeader } from '../components/ui'
import { MiniBarChart } from '../components/MiniBarChart'
import { formatMinutes, todayISODate } from '../utils/format'
import { last7DaysMinutes, minutesOnDay, weeklyMinutesBySubject } from '../lib/stats'
import { ACHIEVEMENTS } from '../lib/achievements'
import { levelFromXP } from '../lib/xp'
import { Award, Lock } from 'lucide-react'

type Range = 'today' | 'week' | 'month' | 'all'

export default function ProgressPage() {
  const { data, stats } = useAppData()
  const [range, setRange] = useState<Range>('week')

  const activeSessions = data.sessions.filter((s) => !s.cancelled)
  const today = todayISODate()

  const rangeMinutes = useMemo(() => {
    if (range === 'today') return minutesOnDay(activeSessions, today)
    if (range === 'all') return stats.totalStudyMinutes
    const now = new Date()
    const cutoff = new Date(now)
    if (range === 'week') cutoff.setDate(now.getDate() - 7)
    if (range === 'month') cutoff.setDate(now.getDate() - 30)
    return activeSessions.filter((s) => new Date(s.endedAt) >= cutoff).reduce((sum, s) => sum + s.actualMinutes, 0)
  }, [range, activeSessions, stats.totalStudyMinutes, today])

  const weekBars = last7DaysMinutes(activeSessions).map((d) => ({ label: d.label, value: d.minutes }))
  const subjectWeekly = weeklyMinutesBySubject(data)
  const levelInfo = levelFromXP(stats.totalXP)

  const subjectBars = data.subjects
    .filter((s) => !s.archived)
    .map((s) => ({ label: s.name.slice(0, 4), value: subjectWeekly[s.id] ?? 0, color: s.color }))

  return (
    <div className="animate-rise">
      <PageHeader title="Progress" subtitle="Your study, in numbers." />

      <div className="mb-5 flex gap-1 rounded-xl bg-earth-850 p-1">
        {(['today', 'week', 'month', 'all'] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition-colors ${
              range === r ? 'bg-earth-700 text-mist-100' : 'text-mist-500'
            }`}
          >
            {r === 'all' ? 'All time' : r}
          </button>
        ))}
      </div>

      <Card className="mb-4 text-center">
        <p className="mb-1 text-xs uppercase tracking-wide text-mist-600">Studied</p>
        <p className="font-display text-4xl text-mist-100">{formatMinutes(rangeMinutes)}</p>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Metric label="Sessions" value={stats.totalSessions} />
        <Metric label="Tasks done" value={stats.totalTasksCompleted} />
        <Metric label="Current streak" value={`${stats.currentStreak}d`} />
        <Metric label="Longest streak" value={`${stats.longestStreak}d`} />
      </div>

      <Card className="mb-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">Level {levelInfo.level}</p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-earth-700">
          <div className="h-full rounded-full bg-moss-500" style={{ width: `${levelInfo.progress * 100}%` }} />
        </div>
        <p className="mt-2 text-xs text-mist-600">{levelInfo.xpIntoLevel} / {levelInfo.xpForNextLevel} XP to level {levelInfo.level + 1}</p>
      </Card>

      <Card className="mb-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">Last 7 days</p>
        <MiniBarChart bars={weekBars} formatValue={(v) => (v > 0 ? formatMinutes(v) : '')} />
      </Card>

      {subjectBars.some((b) => b.value > 0) && (
        <Card className="mb-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">This week by subject</p>
          <MiniBarChart bars={subjectBars} formatValue={(v) => (v > 0 ? formatMinutes(v) : '')} />
        </Card>
      )}

      <Card className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">Achievements</p>
        <ul className="grid grid-cols-2 gap-2.5">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = data.achievements.some((u) => u.id === a.id)
            return (
              <li
                key={a.id}
                className={`flex flex-col gap-1.5 rounded-xl border p-3 ${
                  unlocked ? 'border-amber-500/30 bg-amber-500/5' : 'border-earth-700/50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {unlocked ? <Award size={14} className="text-amber-400" /> : <Lock size={13} className="text-mist-700" />}
                  <span className={`text-xs font-semibold ${unlocked ? 'text-amber-300' : 'text-mist-500'}`}>{a.name}</span>
                </div>
                <p className="text-[11px] text-mist-600">{a.description}</p>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="font-display text-xl text-mist-100">{value}</p>
      <p className="text-xs text-mist-600">{label}</p>
    </Card>
  )
}
