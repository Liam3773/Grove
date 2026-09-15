/**
 * XP / level engine.
 *
 * Design goals (see spec §16):
 * - XP maps directly to meaningful activity (minutes studied, tasks done,
 *   weekly goals, milestones) — not exploitable by idle taps.
 * - Levels should feel meaningful and not fly by: each level requires more
 *   XP than the last (smooth quadratic-ish curve).
 */

export const XP_PER_STUDY_MINUTE = 1 // 25 min session = 25 XP, 45 min = 45 XP
export const XP_PER_TASK = 10
export const XP_WEEKLY_GOAL_BONUS = 100
export const XP_STREAK_MILESTONE = [50, 100, 200] // bonus at 7/30/100 day streaks

/** XP required to CLIMB from level N to N+1. Grows so early levels come fast
 *  (rewarding, per §16/§48) and later levels take sustained effort. */
export function xpForLevel(level: number): number {
  // level 1->2 needs 80xp, and grows roughly quadratically after that
  return Math.round(80 + Math.pow(level, 1.55) * 18)
}

export interface LevelInfo {
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
  progress: number // 0..1
}

export function levelFromXP(totalXP: number): LevelInfo {
  let level = 1
  let remaining = totalXP
  let needed = xpForLevel(level)
  while (remaining >= needed) {
    remaining -= needed
    level += 1
    needed = xpForLevel(level)
  }
  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: needed,
    progress: needed > 0 ? remaining / needed : 0,
  }
}

export function xpForSession(actualMinutes: number): number {
  return Math.max(1, Math.round(actualMinutes * XP_PER_STUDY_MINUTE))
}
