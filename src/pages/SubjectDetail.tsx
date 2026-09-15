import { useParams } from 'react-router-dom'
import { useAppData } from '../data/AppDataContext'
import { Card, PageHeader, ProgressBar, EmptyState } from '../components/ui'
import { formatMinutes, relativeDay } from '../utils/format'

const STATUS_PCT: Record<string, number> = {
  not_started: 0, learning: 0.35, practising: 0.6, confident: 0.85, mastered: 1,
}
const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started', learning: 'Learning', practising: 'Practising', confident: 'Confident', mastered: 'Mastered',
}

export default function SubjectDetail() {
  const { id } = useParams()
  const { data } = useAppData()
  const subject = data.subjects.find((s) => s.id === id)

  if (!subject) {
    return (
      <div className="animate-rise">
        <PageHeader title="Subject" back="/plan" />
        <EmptyState title="Subject not found" body="It may have been deleted." />
      </div>
    )
  }

  const sessions = data.sessions
    .filter((s) => !s.cancelled && s.subjectId === subject.id)
    .sort((a, b) => b.endedAt.localeCompare(a.endedAt))
  const topics = data.topics.filter((t) => t.subjectId === subject.id)

  const now = new Date()
  const dow = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - dow)
  const weekMinutes = sessions.filter((s) => new Date(s.endedAt) >= monday).reduce((sum, s) => sum + s.actualMinutes, 0)
  const totalMinutes = sessions.reduce((sum, s) => sum + s.actualMinutes, 0)
  const weekPct = subject.targetWeeklyMinutes > 0 ? weekMinutes / subject.targetWeeklyMinutes : 0

  return (
    <div className="animate-rise">
      <PageHeader title={subject.name} subtitle={`${formatMinutes(weekMinutes)} this week`} back="/plan" />

      <Card className="mb-4">
        <ProgressBar value={weekPct} color={subject.color} className="mb-2" />
        <p className="text-xs text-mist-600">Weekly goal: {formatMinutes(subject.targetWeeklyMinutes)}</p>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card><p className="font-display text-lg text-mist-100">{formatMinutes(totalMinutes)}</p><p className="text-xs text-mist-600">total studied</p></Card>
        <Card><p className="font-display text-lg text-mist-100">{sessions.length}</p><p className="text-xs text-mist-600">sessions</p></Card>
      </div>

      <Card className="mb-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">Topics</p>
        {topics.length === 0 ? (
          <p className="text-sm text-mist-600">No topics yet — add some from the Plan tab.</p>
        ) : (
          <ul className="space-y-3">
            {topics.map((t) => (
              <li key={t.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-mist-200">{t.name}</span>
                  <span className="text-xs text-mist-600">{STATUS_LABELS[t.status]}</span>
                </div>
                <ProgressBar value={STATUS_PCT[t.status]} color={subject.color} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">Recent sessions</p>
        {sessions.length === 0 ? (
          <p className="text-sm text-mist-600">No sessions yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {sessions.slice(0, 8).map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-mist-200">{topics.find((t) => t.id === s.topicId)?.name ?? subject.name}</span>
                <span className="text-xs text-mist-600">{formatMinutes(s.actualMinutes)} · {relativeDay(s.endedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
