export function formatMinutes(totalMinutes: number): string {
  const m = Math.round(totalMinutes)
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (h <= 0) return `${mm}m`
  if (mm === 0) return `${h}h`
  return `${h}h ${mm}m`
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function greeting(date: Date = new Date()): string {
  const h = date.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function todayISODate(date: Date = new Date()): string {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export function formatDateLabel(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function relativeDay(iso: string): string {
  const target = new Date(iso)
  const today = new Date()
  const todayKey = todayISODate(today)
  const targetKey = todayISODate(target)
  if (targetKey === todayKey) return 'Today'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (targetKey === todayISODate(yesterday)) return 'Yesterday'
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (targetKey === todayISODate(tomorrow)) return 'Tomorrow'
  return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const WEEKDAY_LABELS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function currentWeekdayIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7 // 0 = Monday
}
