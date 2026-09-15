import { useCallback, useEffect, useRef, useState } from 'react'
import {
  IDLE_TIMER, type TimerState, startTimer, pauseTimer, resumeTimer,
  elapsedMs, remainingMs, isComplete, resetTimer,
} from '../features/timer/timerEngine'

const STORAGE_KEY = 'grove:timer-state'

function loadPersisted(): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...IDLE_TIMER }
    return JSON.parse(raw) as TimerState
  } catch {
    return { ...IDLE_TIMER }
  }
}

function persist(state: TimerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors — timer keeps working in-memory
  }
}

export function useStudyTimer() {
  const [state, setState] = useState<TimerState>(() => loadPersisted())
  const [, forceTick] = useState(0)
  const intervalRef = useRef<number | null>(null)

  // Persist on every state change
  useEffect(() => persist(state), [state])

  // Re-render every second while running so the displayed countdown moves,
  // but the *value* always comes from timestamp math (see timerEngine.ts).
  useEffect(() => {
    if (state.phase === 'running') {
      intervalRef.current = window.setInterval(() => forceTick((n) => n + 1), 250)
      return () => {
        if (intervalRef.current) window.clearInterval(intervalRef.current)
      }
    }
  }, [state.phase])

  // Recompute correctness whenever the tab regains focus/visibility —
  // catches long background gaps immediately rather than waiting for the
  // next tick.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') forceTick((n) => n + 1)
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [])

  const start = useCallback((opts: { subjectId: string | null; topicId: string | null; taskId: string | null; minutes: number }) => {
    setState((prev) => startTimer(prev, opts))
  }, [])

  const pause = useCallback(() => setState((prev) => pauseTimer(prev)), [])
  const resume = useCallback(() => setState((prev) => resumeTimer(prev)), [])
  const cancel = useCallback(() => {
    setState(resetTimer())
    localStorage.removeItem(STORAGE_KEY)
  }, [])
  const clear = useCallback(() => {
    setState(resetTimer())
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    state,
    elapsedMs: elapsedMs(state),
    remainingMs: remainingMs(state),
    isComplete: isComplete(state),
    start,
    pause,
    resume,
    cancel,
    clear,
  }
}
