import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Trash2, Check, Circle, ChevronRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../data/AppDataContext'
import { Card, Button, PageHeader, EmptyState, Pill } from '../components/ui'
import { SUGGESTED_SUBJECTS } from '../data/defaults'
import { WEEKDAY_LABELS_FULL, relativeDay, currentWeekdayIndex } from '../utils/format'
import type { TaskPriority, PlantKind } from '../types'

type Tab = 'tasks' | 'subjects' | 'week'

const PLANT_KINDS: PlantKind[] = ['oak', 'pine', 'blossom', 'lavender', 'ancient', 'hedge', 'clover', 'fern']
const COLOR_CHOICES = ['#7fb88f', '#9db4e8', '#d8a5c0', '#eec079', '#c7a37a', '#8fc9a0', '#7ec8d8', '#e0b563']

export default function Plan() {
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>(params.get('add') === 'subject' ? 'subjects' : 'tasks')

  return (
    <div className="animate-rise">
      <PageHeader title="Plan" subtitle="Subjects, tasks, and your week." />

      <div className="mb-5 flex gap-1 rounded-xl bg-earth-850 p-1">
        {(['tasks', 'subjects', 'week'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-earth-700 text-mist-100' : 'text-mist-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'tasks' && <TasksTab />}
      {tab === 'subjects' && <SubjectsTab initialOpen={params.get('add') === 'subject'} />}
      {tab === 'week' && <WeekTab />}
    </div>
  )
}

// ---------------- Tasks ----------------

function TasksTab() {
  const { data, addTask, toggleTask, deleteTask } = useAppData()
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState<string | null>(data.subjects[0]?.id ?? null)
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [showForm, setShowForm] = useState(false)

  const pending = data.tasks.filter((t) => !t.completed).sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return 0
  })
  const done = data.tasks.filter((t) => t.completed).slice(-10).reverse()

  function submit() {
    if (!title.trim()) return
    addTask({
      title: title.trim(),
      subjectId,
      topicId: null,
      dueDate: dueDate || null,
      estimatedMinutes: null,
      priority,
      notes: '',
      plannedDay: null,
    })
    setTitle('')
    setDueDate('')
    setShowForm(false)
  }

  return (
    <div>
      {showForm ? (
        <Card className="mb-4">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need to do?"
            className="mb-3 w-full rounded-lg border border-earth-700 bg-earth-900 px-3 py-2.5 text-sm text-mist-100 placeholder:text-mist-600"
          />
          <div className="mb-3 flex flex-wrap gap-2">
            {data.subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubjectId(s.id)}
                className={`rounded-full border px-3 py-1.5 text-xs ${subjectId === s.id ? 'border-transparent text-earth-950' : 'border-earth-700 text-mist-500'}`}
                style={subjectId === s.id ? { background: s.color } : undefined}
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className="mb-3 flex gap-2">
            {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 rounded-lg border py-1.5 text-xs capitalize ${priority === p ? 'border-moss-500 text-moss-400' : 'border-earth-700 text-mist-500'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mb-3 w-full rounded-lg border border-earth-700 bg-earth-900 px-3 py-2 text-sm text-mist-100"
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button onClick={submit} className="flex-1">Add task</Button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-earth-700 py-3 text-sm text-mist-400 hover:border-moss-500 hover:text-moss-400"
        >
          <Plus size={16} /> Add task
        </button>
      )}

      {pending.length === 0 && done.length === 0 ? (
        <EmptyState title="Nothing planned yet" body="Add your first task to start shaping the week." />
      ) : (
        <>
          {pending.length > 0 && (
            <ul className="mb-6 space-y-2">
              {pending.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onDelete={() => deleteTask(t.id)} subjects={data.subjects} />
              ))}
            </ul>
          )}
          {done.length > 0 && (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-mist-600">Recently completed</p>
              <ul className="space-y-2 opacity-70">
                {done.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={() => toggleTask(t.id)} onDelete={() => deleteTask(t.id)} subjects={data.subjects} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete, subjects }: any) {
  const subject = subjects.find((s: any) => s.id === task.subjectId)
  return (
    <li className="flex items-center gap-3 rounded-xl border border-earth-700/50 bg-earth-850/50 px-3.5 py-3">
      <button onClick={onToggle} aria-label="Toggle complete" className="shrink-0">
        {task.completed ? <Check size={18} className="text-moss-400" /> : <Circle size={18} className="text-mist-600" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${task.completed ? 'text-mist-600 line-through' : 'text-mist-100'}`}>{task.title}</p>
        <div className="mt-0.5 flex items-center gap-2">
          {subject && <span className="text-xs" style={{ color: subject.color }}>{subject.name}</span>}
          {task.dueDate && <span className="text-xs text-mist-600">· {relativeDay(task.dueDate)}</span>}
          {task.priority === 'high' && <Pill tone="amber">High</Pill>}
        </div>
      </div>
      <button onClick={onDelete} aria-label="Delete task" className="shrink-0 text-mist-700 hover:text-red-400">
        <Trash2 size={16} />
      </button>
    </li>
  )
}

// ---------------- Subjects ----------------

function SubjectsTab({ initialOpen }: { initialOpen: boolean }) {
  const { data, addSubject, deleteSubject, seedSuggestedSubjects, addTopic, updateTopic, deleteTopic } = useAppData()
  const [showForm, setShowForm] = useState(initialOpen)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_CHOICES[0])
  const [plantKind, setPlantKind] = useState<PlantKind>('oak')

  const notYetAdded = SUGGESTED_SUBJECTS.filter((s) => !data.subjects.some((sub) => sub.name === s.name))

  function submit() {
    if (!name.trim()) return
    addSubject({ name: name.trim(), color, icon: 'leaf', plantKind, priority: 'medium', targetWeeklyMinutes: 120, examDate: null })
    setName('')
    setShowForm(false)
  }

  return (
    <div>
      {data.subjects.length === 0 && notYetAdded.length > 0 && (
        <Card className="mb-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">Quick add</p>
          <div className="flex flex-wrap gap-2">
            {notYetAdded.map((s) => (
              <button
                key={s.name}
                onClick={() => seedSuggestedSubjects([s.name])}
                className="rounded-full border border-earth-700 px-3 py-1.5 text-xs text-mist-300 hover:border-moss-500"
              >
                + {s.name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {showForm ? (
        <Card className="mb-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subject name"
            className="mb-3 w-full rounded-lg border border-earth-700 bg-earth-900 px-3 py-2.5 text-sm text-mist-100 placeholder:text-mist-600"
          />
          <p className="mb-2 text-xs text-mist-600">Colour</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {COLOR_CHOICES.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-mist-100' : 'border-transparent'}`}
                style={{ background: c }}
                aria-label={`Choose ${c}`}
              />
            ))}
          </div>
          <p className="mb-2 text-xs text-mist-600">Plant type</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {PLANT_KINDS.map((p) => (
              <button
                key={p}
                onClick={() => setPlantKind(p)}
                className={`rounded-full border px-3 py-1 text-xs capitalize ${plantKind === p ? 'border-moss-500 text-moss-400' : 'border-earth-700 text-mist-500'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            <Button onClick={submit} className="flex-1">Add subject</Button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-earth-700 py-3 text-sm text-mist-400 hover:border-moss-500 hover:text-moss-400"
        >
          <Plus size={16} /> Add subject
        </button>
      )}

      {data.subjects.length === 0 ? (
        <EmptyState title="No subjects yet" body="Subjects are where your study time and topic progress live." />
      ) : (
        <ul className="space-y-2">
          {data.subjects.map((s) => (
            <li key={s.id} className="rounded-xl border border-earth-700/50 bg-earth-850/50">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 text-sm text-mist-100">{s.name}</span>
                <span className="text-xs text-mist-600 capitalize">{s.plantKind}</span>
                <ChevronRight size={16} className={`text-mist-600 transition-transform ${expanded === s.id ? 'rotate-90' : ''}`} />
              </button>
              {expanded === s.id && (
                <div className="border-t border-earth-700/50 px-3.5 py-3">
                  <TopicsEditor
                    topics={data.topics.filter((t) => t.subjectId === s.id)}
                    onAdd={(topicName) => addTopic({ subjectId: s.id, name: topicName, status: 'not_started' })}
                    onUpdateStatus={(id, status) => updateTopic(id, { status })}
                    onDelete={deleteTopic}
                  />
                  <button
                    onClick={() => deleteSubject(s.id)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-red-400/80 hover:text-red-400"
                  >
                    <Trash2 size={13} /> Delete subject
                  </button>
                  <Link to={`/subjects/${s.id}`} className="mt-3 ml-4 inline-block text-xs text-moss-400 hover:text-moss-300">
                    View subject details →
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  learning: 'Learning',
  practising: 'Practising',
  confident: 'Confident',
  mastered: 'Mastered',
}
const STATUS_ORDER = ['not_started', 'learning', 'practising', 'confident', 'mastered']

function TopicsEditor({ topics, onAdd, onUpdateStatus, onDelete }: {
  topics: import('../types').Topic[]
  onAdd: (name: string) => void
  onUpdateStatus: (id: string, status: import('../types').TopicStatus) => void
  onDelete: (id: string) => void
}) {
  const [newTopic, setNewTopic] = useState('')
  return (
    <div>
      {topics.length > 0 && (
        <ul className="mb-3 space-y-2">
          {topics.map((t: any) => (
            <li key={t.id} className="flex items-center justify-between gap-2">
              <span className="text-sm text-mist-200">{t.name}</span>
              <div className="flex items-center gap-1.5">
                <select
                  value={t.status}
                  onChange={(e) => onUpdateStatus(t.id, e.target.value as import('../types').TopicStatus)}
                  className="rounded-lg border border-earth-700 bg-earth-900 px-2 py-1 text-xs text-mist-300"
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <button onClick={() => onDelete(t.id)} className="text-mist-700 hover:text-red-400">
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="Break this into a topic..."
          className="flex-1 rounded-lg border border-earth-700 bg-earth-900 px-3 py-1.5 text-xs text-mist-100 placeholder:text-mist-600"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newTopic.trim()) {
              onAdd(newTopic.trim())
              setNewTopic('')
            }
          }}
        />
        <button
          onClick={() => { if (newTopic.trim()) { onAdd(newTopic.trim()); setNewTopic('') } }}
          className="rounded-lg border border-earth-700 px-3 text-xs text-mist-400"
        >
          Add
        </button>
      </div>
    </div>
  )
}

// ---------------- Week ----------------

function WeekTab() {
  const { data, addRoutineBlock, deleteRoutineBlock } = useAppData()
  const [showRoutineForm, setShowRoutineForm] = useState(false)
  const [rLabel, setRLabel] = useState('')
  const [rTime, setRTime] = useState('17:00')
  const [rDay, setRDay] = useState(currentWeekdayIndex())
  const [rSubject] = useState<string | null>(data.subjects[0]?.id ?? null)
  const [rDuration, setRDuration] = useState(45)

  function submitRoutine() {
    if (!rLabel.trim()) return
    addRoutineBlock({ day: rDay, startTime: rTime, label: rLabel.trim(), subjectId: rSubject, durationMinutes: rDuration })
    setRLabel('')
    setShowRoutineForm(false)
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">Weekly planner</p>
      <div className="mb-6 space-y-4">
        {WEEKDAY_LABELS_FULL.map((day, idx) => {
          const tasksForDay = data.tasks.filter((t) => t.plannedDay === idx)
          const routineForDay = data.routine.filter((r) => r.day === idx).sort((a, b) => a.startTime.localeCompare(b.startTime))
          return (
            <Card key={day} className={idx === currentWeekdayIndex() ? 'border-moss-500/50' : ''}>
              <p className="mb-2 text-sm font-semibold text-mist-100">{day}</p>
              {routineForDay.length === 0 && tasksForDay.length === 0 ? (
                <p className="text-xs text-mist-600">Nothing scheduled</p>
              ) : (
                <ul className="space-y-1.5">
                  {routineForDay.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-xs text-mist-400">
                      <span>{r.startTime} — {r.label} ({r.durationMinutes}m)</span>
                      <button onClick={() => deleteRoutineBlock(r.id)} className="text-mist-700 hover:text-red-400">
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                  {tasksForDay.map((t) => (
                    <li key={t.id} className="text-xs text-mist-400">→ {t.title}</li>
                  ))}
                </ul>
              )}
            </Card>
          )
        })}
      </div>

      {showRoutineForm ? (
        <Card className="mb-4">
          <input
            autoFocus
            value={rLabel}
            onChange={(e) => setRLabel(e.target.value)}
            placeholder="e.g. Maths, gym, dinner..."
            className="mb-3 w-full rounded-lg border border-earth-700 bg-earth-900 px-3 py-2.5 text-sm text-mist-100 placeholder:text-mist-600"
          />
          <div className="mb-3 grid grid-cols-2 gap-2">
            <select value={rDay} onChange={(e) => setRDay(Number(e.target.value))} className="rounded-lg border border-earth-700 bg-earth-900 px-2 py-2 text-sm text-mist-200">
              {WEEKDAY_LABELS_FULL.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <input type="time" value={rTime} onChange={(e) => setRTime(e.target.value)} className="rounded-lg border border-earth-700 bg-earth-900 px-2 py-2 text-sm text-mist-200" />
          </div>
          <div className="mb-3 flex items-center gap-2">
            <input
              type="number"
              value={rDuration}
              onChange={(e) => setRDuration(Number(e.target.value) || 15)}
              className="w-20 rounded-lg border border-earth-700 bg-earth-900 px-2 py-2 text-sm text-mist-200"
            />
            <span className="text-xs text-mist-600">minutes</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowRoutineForm(false)} className="flex-1">Cancel</Button>
            <Button onClick={submitRoutine} className="flex-1">Add to routine</Button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setShowRoutineForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-earth-700 py-3 text-sm text-mist-400 hover:border-moss-500 hover:text-moss-400"
        >
          <Plus size={16} /> Add a routine block
        </button>
      )}
      <p className="mt-3 text-center text-xs text-mist-600">
        Your routine suggests a rhythm for the week — feel free to skip or reschedule anything.
      </p>
    </div>
  )
}
