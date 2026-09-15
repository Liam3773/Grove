import type { AchievementDef, LifetimeStats } from '../types'

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_step', name: 'First step', description: 'Complete your first study session.', check: (s) => s.totalSessions >= 1 },
  { id: 'roots', name: 'Roots', description: 'Study for 5 hours in total.', check: (s) => s.totalStudyMinutes >= 300 },
  { id: 'growing', name: 'Growing', description: 'Study for 25 hours in total.', check: (s) => s.totalStudyMinutes >= 1500 },
  { id: 'forest', name: 'Forest', description: 'Study for 100 hours in total.', check: (s) => s.totalStudyMinutes >= 6000 },
  { id: 'dedicated', name: 'Dedicated', description: 'Study 7 days in a row.', check: (s) => s.longestStreak >= 7 },
  { id: 'marathon', name: 'Marathon', description: 'Study for 2 hours in a single day.', check: (s) => s.longestSingleDayMinutes >= 120 },
  { id: 'balanced', name: 'Balanced', description: 'Study and exercise on the same day.', check: (s) => s.wellnessDaysBalanced >= 1 },
  { id: 'master', name: 'Master', description: 'Mark a topic as mastered.', check: (s) => s.masteredTopics >= 1 },
  { id: 'explorer', name: 'Explorer', description: 'Study 3 different subjects.', check: (s) => s.subjectsWithSessions >= 3 },
  { id: 'finisher', name: 'Finisher', description: 'Complete 25 tasks.', check: (s) => s.totalTasksCompleted >= 25 },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Reach a 30 day streak.', check: (s) => s.longestStreak >= 30 },
]

export function evaluateAchievements(
  stats: LifetimeStats,
  alreadyUnlocked: string[]
): { unlockedIds: string[]; newlyUnlocked: AchievementDef[] } {
  const unlockedIds: string[] = []
  const newlyUnlocked: AchievementDef[] = []
  for (const def of ACHIEVEMENTS) {
    if (def.check(stats)) {
      unlockedIds.push(def.id)
      if (!alreadyUnlocked.includes(def.id)) newlyUnlocked.push(def)
    }
  }
  return { unlockedIds, newlyUnlocked }
}
