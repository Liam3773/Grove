import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Pause, Play, Square, X } from 'lucide-react'
import { useAppData } from '../data/AppDataContext'
import { useStudyTimer } from '../hooks/useStudyTimer'
import { Card, Button, PageHeader, EmptyState } from '../components/ui'
import { formatClock } from '../utils/format'
import { xpForSession } from '../lib/xp'
import type { SessionFeeling, WorldObjectDef, AchievementDef } from '../types'

const DURATIONS = [15, 25, 30, 45, 60, 90]
const FEELINGS: { key: SessionFeeling; emoji: string; label: string }[] = [
  { key: 'difficult', emoji: '😴', label: 'Difficult' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'excellent', emoji: '🔥', label: 'Excellent' },
]

export default function Study() {
  const { data, completeSession, lastDiscovery, clearDiscovery, toggleTask } = useAppData()
  const timer = useStudyTimer()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const prefTask = params.get('taskId') ? data.tasks.find((t) => t.id === params.get('taskId')) : undefined

  const [subjectId, setSubjectId] = useState<string | null>(prefTask?.subjectId ?? data.subjects[0]?.id ?? null)
  const [topicId, setTopicId] = useState<string | null>(prefTask?.topicId ?? null)
  const [taskId] = useState<string | null>(prefTask?.id ?? null)
  const [minutes, setMinutes] = useState<number>(prefTask?.estimatedMinutes ?? data.settings.defaultSessionMinutes ?? 25)
  const [showComplete, setShowComplete] = useState(false)
  const [feeling, setFeeling] = useState<SessionFeeling | null>(null)
  const [notes, setNotes] = useState('')
  const [savedXp, setSavedXp] = useState(0)
  const [discoveryShown, setDiscoveryShown] = useState<{ world: WorldObjectDef[]; achievements: AchievementDef[] } | null>(null)

  const subject = data.subjects.find((s) => s.id === subjectId)
  const topics = data.topics.filter((t) => t.subjectId === subjectId)

  useEffect(() => {
    if (timer.isComplete && timer.state.phase !== 'finished') {
      handleAutoFinish()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isComplete])

  function handleAutoFinish() {
    finishAndSave()
  }

  function finishAndSave() {
    const actualMinutes = Math.round(timer.elapsedMs / 60000)
    const xp = xpForSession(actualMinutes)
    completeSession({
      subjectId: timer.state.subjectId,
      topicId: timer.state.topicId,
      taskId: timer.state.taskId,
      startedAt: new Date(timer.state.sessionStartedAt ?? Date.now()).toISOString(),
      endedAt: new Date().toISOString(),
      plannedMinutes: timer.state.plannedMinutes,
      actualMinutes: Math.max(1, actualMinutes),
      xpEarned: xp,
      feeling: null,
      notes: '',
      cancelled: false,
    })
    setSavedXp(xp)
    setShowComplete(true)
  }

  function handleStart() {
    timer.start({ subjectId, topicId, taskId, minutes })
  }

  function handleCancel() {
    timer.cancel()
  }

  function handleFinishNow() {
    finishAndSave()
  }

  function handleSubmitFeeling() {
    if (timer.state.taskId) toggleTaskIfNotDone(timer.state.taskId)
    setDiscoveryShown(lastDiscovery)
    clearDiscovery()
    timer.clear()
    setShowComplete(false)
    setFeeling(null)
    setNotes('')
  }

  function toggleTaskIfNotDone(id: string) {
    const t = data.tasks.find((x) => x.id === id)
    if (t && !t.completed) toggleTask(id)
  }

  const isRunning = timer.state.phase === 'running' || timer.state.phase === 'paused'

  if (discoveryShown && (discoveryShown.world.length || discoveryShown.achievements.length)) {
    return <DiscoveryScreen discovery={discoveryShown} xp={savedXp} onDone={() => { setDiscoveryShown(null); navigate('/') }} />
  }

  if (showComplete) {
    return (
      <div className="animate-rise flex flex-col items-center justify-center px-2 py-10 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-moss-400">Session complete</p>
        <h1 className="font-display text-3xl text-mist-100 mb-1">+{savedXp} XP</h1>
        <p className="mb-6 text-mist-500">{subject?.name ?? 'Study session'} · your world grew 🌱</p>

        <p className="mb-3 text-sm text-mist-400">How did that session go?</p>
        <div className="mb-6 flex gap-2">
          {FEELINGS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFeeling(f.key)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-xs transition-colors ${
                feeling === f.key ? 'border-moss-500 bg-moss-500/10 text-moss-300' : 'border-earth-700 text-mist-500'
              }`}
            >
              <span className="text-xl">{f.emoji}</span>
              {f.label}
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What did you actually cover? (optional)"
          className="mb-6 w-full max-w-sm resize-none rounded-xl border border-earth-700 bg-earth-850 p-3 text-sm text-mist-100 placeholder:text-mist-600"
          rows={3}
        />

        <Button onClick={handleSubmitFeeling} className="w-full max-w-sm">Continue</Button>
      </div>
    )
  }

  if (isRunning) {
    const running = timer.state.phase === 'running'
    return (
      <div className="animate-rise flex min-h-[75vh] flex-col items-center justify-center px-4 text-center">
        <p className="mb-2 text-sm text-mist-500">{subject?.name ?? 'Study session'}</p>
        {topicId && <p className="mb-8 text-xs text-mist-600">{topics.find((t) => t.id === topicId)?.name}</p>}
        <p className="font-display text-7xl tabular-nums text-mist-100 mb-10">{formatClock(timer.remainingMs)}</p>

        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            aria-label="Cancel session"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-earth-700 text-mist-500 hover:text-mist-200"
          >
            <X size={22} />
          </button>
          <button
            onClick={running ? timer.pause : timer.resume}
            aria-label={running ? 'Pause' : 'Resume'}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-500 text-earth-950"
          >
            {running ? <Pause size={26} /> : <Play size={26} />}
          </button>
          <button
            onClick={handleFinishNow}
            aria-label="Finish now"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-earth-700 text-mist-500 hover:text-mist-200"
          >
            <Square size={20} />
          </button>
        </div>
        {!running && <p className="mt-6 text-xs text-mist-600">Paused — take your time.</p>}
      </div>
    )
  }

  // Setup screen
  return (
    <div className="animate-rise">
      <PageHeader title="Study" subtitle="Choose what you're working on." />

      {data.subjects.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          body="Add a subject first so your study time has somewhere to grow."
          action={<Button onClick={() => navigate('/plan?add=subject')}>Add a subject</Button>}
        />
      ) : (
        <>
          <Card className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist-600">Subject</p>
            <div className="flex flex-wrap gap-2">
              {data.subjects.filter((s) => !s.archived).map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSubjectId(s.id); setTopicId(null) }}
                  className={`rounded-full border px-3.5 py-2 text-sm transition-colors ${
                    subjectId === s.id ? 'border-transparent text-earth-950' : 'border-earth-700 text-mist-300'
                  }`}
                  style={subjectId === s.id ? { background: s.color } : undefined}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </Card>

          {topics.length > 0 && (
            <Card className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist-600">Topic (optional)</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTopicId(null)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${!topicId ? 'border-moss-500 text-moss-400' : 'border-earth-700 text-mist-500'}`}
                >
                  None
                </button>
                {topics.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTopicId(t.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${topicId === t.id ? 'border-moss-500 text-moss-400' : 'border-earth-700 text-mist-500'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist-600">Duration</p>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setMinutes(d)}
                  className={`rounded-full border px-3.5 py-2 text-sm ${minutes === d ? 'border-moss-500 bg-moss-500/10 text-moss-300' : 'border-earth-700 text-mist-400'}`}
                >
                  {d}m
                </button>
              ))}
              <input
                type="number"
                min={1}
                value={DURATIONS.includes(minutes) ? '' : minutes}
                onChange={(e) => setMinutes(Number(e.target.value) || 1)}
                placeholder="Custom"
                className="w-20 rounded-full border border-earth-700 bg-transparent px-3.5 py-2 text-sm text-mist-100 placeholder:text-mist-600"
              />
            </div>
          </Card>

          {prefTask && (
            <Card className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-mist-600 mb-1">Task</p>
              <p className="text-sm text-mist-200">{prefTask.title}</p>
            </Card>
          )}

          <Button onClick={handleStart} className="w-full" disabled={!subjectId}>Start study</Button>
        </>
      )}
    </div>
  )
}

function DiscoveryScreen({ discovery, xp, onDone }: { discovery: { world: WorldObjectDef[]; achievements: AchievementDef[] }; xp: number; onDone: () => void }) {
  return (
    <div className="animate-rise flex flex-col items-center justify-center px-4 py-10 text-center min-h-[70vh]">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-400">New discovery</p>
      <h1 className="font-display text-2xl text-mist-100 mb-6">+{xp} XP earned</h1>

      <div className="mb-8 w-full max-w-sm space-y-3">
        {discovery.world.map((w) => (
          <Card key={w.id} className="text-left">
            <p className="font-display text-lg text-moss-300">{w.name}</p>
            <p className="text-sm text-mist-500">{w.description}</p>
          </Card>
        ))}
        {discovery.achievements.map((a) => (
          <Card key={a.id} className="text-left">
            <p className="font-display text-lg text-amber-300">🏅 {a.name}</p>
            <p className="text-sm text-mist-500">{a.description}</p>
          </Card>
        ))}
      </div>

      <Button onClick={onDone} className="w-full max-w-sm">Back to your world</Button>
    </div>
  )
}
