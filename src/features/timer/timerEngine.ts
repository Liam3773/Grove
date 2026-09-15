/**
 * Timestamp-based timer state. Never trust an accumulating setInterval
 * counter (§32) — always derive remaining time from wall-clock timestamps
 * so the timer is correct even after the tab is backgrounded, the phone
 * locks, or the OS suspends JS execution for a while.
 */

export type TimerPhase = 'idle' | 'running' | 'paused' | 'finished'

export interface TimerState {
  phase: TimerPhase
  subjectId: string | null
  topicId: string | null
  taskId: string | null
  plannedMinutes: number
  /** epoch ms when the current run started (resets on resume-from-pause) */
  segmentStartedAt: number | null
  /** epoch ms this segment should end, if running */
  endAt: number | null
  /** total ms already elapsed from prior segments (pause/resume) */
  elapsedMsBeforeSegment: number
  /** wall-clock epoch ms when the whole session first began (for XP/history) */
  sessionStartedAt: number | null
}

export const IDLE_TIMER: TimerState = {
  phase: 'idle',
  subjectId: null,
  topicId: null,
  taskId: null,
  plannedMinutes: 25,
  segmentStartedAt: null,
  endAt: null,
  elapsedMsBeforeSegment: 0,
  sessionStartedAt: null,
}

export function startTimer(
  base: TimerState,
  opts: { subjectId: string | null; topicId: string | null; taskId: string | null; minutes: number }
): TimerState {
  const now = Date.now()
  return {
    ...base,
    phase: 'running',
    subjectId: opts.subjectId,
    topicId: opts.topicId,
    taskId: opts.taskId,
    plannedMinutes: opts.minutes,
    segmentStartedAt: now,
    endAt: now + opts.minutes * 60_000,
    elapsedMsBeforeSegment: 0,
    sessionStartedAt: now,
  }
}

export function pauseTimer(state: TimerState): TimerState {
  if (state.phase !== 'running' || !state.segmentStartedAt) return state
  const now = Date.now()
  const elapsed = state.elapsedMsBeforeSegment + (now - state.segmentStartedAt)
  return {
    ...state,
    phase: 'paused',
    elapsedMsBeforeSegment: elapsed,
    segmentStartedAt: null,
    endAt: null,
  }
}

export function resumeTimer(state: TimerState): TimerState {
  if (state.phase !== 'paused') return state
  const now = Date.now()
  const remainingMs = state.plannedMinutes * 60_000 - state.elapsedMsBeforeSegment
  return {
    ...state,
    phase: 'running',
    segmentStartedAt: now,
    endAt: now + Math.max(0, remainingMs),
  }
}

/** How much time (ms) has actually elapsed right now, regardless of phase. */
export function elapsedMs(state: TimerState): number {
  if (state.phase === 'running' && state.segmentStartedAt) {
    return state.elapsedMsBeforeSegment + (Date.now() - state.segmentStartedAt)
  }
  return state.elapsedMsBeforeSegment
}

/** How much time (ms) is left. Clamped to 0. */
export function remainingMs(state: TimerState): number {
  const total = state.plannedMinutes * 60_000
  return Math.max(0, total - elapsedMs(state))
}

export function isComplete(state: TimerState): boolean {
  return (state.phase === 'running' || state.phase === 'paused') && remainingMs(state) <= 0
}

export function finishTimer(state: TimerState): TimerState {
  return { ...state, phase: 'finished' }
}

export function resetTimer(): TimerState {
  return { ...IDLE_TIMER }
}
