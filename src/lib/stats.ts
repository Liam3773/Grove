import type { AppData, LifetimeStats, StudySession, WellnessEntry } from '../types'
import { levelFromXP } from './xp'

function dayKey(iso: string): string {
  return iso.slice(0, 10) // YYYY-MM-DD
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + 'T00:00:00')
  const d2 = new Date(b + 'T00:00:00')
  return Math.round((d2.getTime() - d1.getTime()) / 86400000)
}

/** Current & longest streak of distinct study days, allowing "today" to not
 *  yet be studied without breaking the current streak (per §17 — streaks
 *  should never feel punishing). */
export function computeStreaks(sessions: StudySession[]): { current: number; longest: number } {
  const days = Array.from(
    new Set(sessions.filter((s) => !s.cancelled).map((s) => dayKey(s.endedAt)))
  ).sort()

  if (days.length === 0) return { current: 0, longest: 0 }

  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    if (daysBetween(days[i - 1], days[i]) === 1) {
      run += 1
    } else {
      run = 1
    }
    longest = Math.max(longest, run)
  }

  const today = dayKey(new Date().toISOString())
  const lastDay = days[days.length - 1]
  const gapFromToday = daysBetween(lastDay, today)

  let current = 0
  if (gapFromToday <= 1) {
    // still "alive" — either studied today, or studied yesterday and hasn't
    // broken the chain yet
    current = 1
    for (let i = days.length - 1; i > 0; i--) {
      if (daysBetween(days[i - 1], days[i]) === 1) current += 1
      else break
    }
  }

  return { current, longest }
}

export function studyDaysThisWeek(sessions: StudySession[]): number {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7 // 0 = Monday
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - dow)

  const days = new Set<string>()
  for (const s of sessions) {
    if (s.cancelled) continue
    const d = new Date(s.endedAt)
    if (d >= monday) days.add(dayKey(s.endedAt))
  }
  return days.size
}

export function minutesOnDay(sessions: StudySession[], isoDate: string): number {
  return sessions
    .filter((s) => !s.cancelled && dayKey(s.endedAt) === isoDate)
    .reduce((sum, s) => sum + s.actualMinutes, 0)
}

export function longestSingleDayMinutes(sessions: StudySession[]): number {
  const byDay = new Map<string, number>()
  for (const s of sessions) {
    if (s.cancelled) continue
    const k = dayKey(s.endedAt)
    byDay.set(k, (byDay.get(k) ?? 0) + s.actualMinutes)
  }
  let max = 0
  for (const v of byDay.values()) max = Math.max(max, v)
  return max
}

export function wellnessBalancedDays(wellness: WellnessEntry[], sessions: StudySession[]): number {
  const studyDays = new Set(sessions.filter((s) => !s.cancelled).map((s) => dayKey(s.endedAt)))
  return wellness.filter((w) => (w.gym || w.walk) && studyDays.has(w.date)).length
}

export function computeLifetimeStats(data: AppData): LifetimeStats {
  const activeSessions = data.sessions.filter((s) => !s.cancelled)
  const totalStudyMinutes = activeSessions.reduce((sum, s) => sum + s.actualMinutes, 0)
  const totalXP = activeSessions.reduce((sum, s) => sum + s.xpEarned, 0)
    + data.tasks.filter((t) => t.completed).length * 10
  const { level } = levelFromXP(totalXP)
  const { current, longest } = computeStreaks(activeSessions)
  const subjectsWithSessions = new Set(activeSessions.map((s) => s.subjectId).filter(Boolean)).size

  return {
    totalStudyMinutes,
    totalSessions: activeSessions.length,
    totalTasksCompleted: data.tasks.filter((t) => t.completed).length,
    totalXP,
    level,
    currentStreak: current,
    longestStreak: longest,
    studyDaysThisWeek: studyDaysThisWeek(activeSessions),
    masteredTopics: data.topics.filter((t) => t.status === 'mastered').length,
    subjectsWithSessions,
    wellnessDaysBalanced: wellnessBalancedDays(data.wellness, activeSessions),
    longestSingleDayMinutes: longestSingleDayMinutes(activeSessions),
  }
}

export function weeklyMinutesBySubject(data: AppData): Record<string, number> {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - dow)

  const result: Record<string, number> = {}
  for (const s of data.sessions) {
    if (s.cancelled || !s.subjectId) continue
    if (new Date(s.endedAt) >= monday) {
      result[s.subjectId] = (result[s.subjectId] ?? 0) + s.actualMinutes
    }
  }
  return result
}

export function last7DaysMinutes(sessions: StudySession[]): { label: string; minutes: number }[] {
  const out: { label: string; minutes: number }[] = []
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const k = dayKey(d.toISOString())
    out.push({ label: labels[(d.getDay() + 6) % 7], minutes: minutesOnDay(sessions, k) })
  }
  return out
}
