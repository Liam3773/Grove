import type { LifetimeStats, WorldObjectDef } from '../types'

/**
 * worldProgression.ts
 *
 * The world is driven entirely by this configuration list rather than
 * scattered if-statements. Each entry defines what it is, which category
 * it renders in, and a `requirement` predicate evaluated against the
 * player's LifetimeStats. To add a new unlockable object later, add one
 * entry here — nothing else needs to change.
 *
 * Multiple variables feed progression on purpose (§6): raw hours, streaks,
 * task completion, subject breadth, and mastery all unlock different things,
 * so the world reflects the *shape* of the user's effort, not just a clock.
 */

const h = (minutes: number) => minutes * 60

export const WORLD_UNLOCKS: WorldObjectDef[] = [
  {
    id: 'bare_earth',
    name: 'A patch of earth',
    description: 'Every grove starts somewhere.',
    category: 'terrain',
    requirement: () => true,
    requirementLabel: 'Always here',
  },
  {
    id: 'first_grass',
    name: 'Grass',
    description: 'Soft ground cover spreads across the plot.',
    category: 'terrain',
    requirement: (s) => s.totalStudyMinutes >= 30,
    requirementLabel: '30 minutes studied',
  },
  {
    id: 'first_sprout',
    name: 'First sprout',
    description: 'A tiny shoot breaks the soil.',
    category: 'plant',
    requirement: (s) => s.totalStudyMinutes >= h(1),
    requirementLabel: '1 hour studied',
  },
  {
    id: 'wildflowers',
    name: 'Wildflowers',
    description: 'Small flowers appear along the grass.',
    category: 'plant',
    requirement: (s) => s.totalSessions >= 5,
    requirementLabel: '5 study sessions completed',
  },
  {
    id: 'first_tree',
    name: 'First tree',
    description: 'A young tree takes root.',
    category: 'plant',
    requirement: (s) => s.totalStudyMinutes >= h(5),
    requirementLabel: '5 hours studied',
  },
  {
    id: 'second_tree',
    name: 'A second tree',
    description: 'The grove is no longer alone.',
    category: 'plant',
    requirement: (s) => s.subjectsWithSessions >= 2,
    requirementLabel: 'Study 2 different subjects',
  },
  {
    id: 'stream',
    name: 'A quiet stream',
    description: 'Water finds its way through the grove.',
    category: 'water',
    requirement: (s) => s.totalStudyMinutes >= h(10),
    requirementLabel: '10 hours studied',
  },
  {
    id: 'rocks',
    name: 'Rocks & stones',
    description: 'Weathered stones settle into the landscape.',
    category: 'decoration',
    requirement: (s) => s.currentStreak >= 3 || s.longestStreak >= 3,
    requirementLabel: '3 day study streak',
  },
  {
    id: 'pond',
    name: 'Pond',
    description: 'The stream widens into a still pond.',
    category: 'water',
    requirement: (s) => s.totalStudyMinutes >= h(20),
    requirementLabel: '20 hours studied',
  },
  {
    id: 'path',
    name: 'Pathway',
    description: 'A worn path winds through the grove.',
    category: 'path',
    requirement: (s) => s.totalTasksCompleted >= 15,
    requirementLabel: '15 tasks completed',
  },
  {
    id: 'small_grove',
    name: 'Small grove of trees',
    description: 'Several trees now stand together.',
    category: 'plant',
    requirement: (s) => s.totalStudyMinutes >= h(35),
    requirementLabel: '35 hours studied',
  },
  {
    id: 'study_cabin',
    name: 'Study cabin',
    description: 'A small cabin appears at the edge of the grove.',
    category: 'building',
    requirement: (s) => s.totalStudyMinutes >= h(60),
    requirementLabel: '60 hours studied',
  },
  {
    id: 'first_mastery',
    name: 'Flowering vine',
    description: 'Deep understanding shows itself in bloom.',
    category: 'plant',
    requirement: (s) => s.masteredTopics >= 1,
    requirementLabel: 'Master your first topic',
  },
  {
    id: 'lanterns',
    name: 'Lanterns',
    description: 'Warm light appears along the path at night.',
    category: 'decoration',
    requirement: (s) => s.longestStreak >= 7,
    requirementLabel: '7 day streak (ever)',
  },
  {
    id: 'orchard',
    name: 'Orchard',
    description: 'Fruit trees line the far edge of the grove.',
    category: 'plant',
    requirement: (s) => s.totalStudyMinutes >= h(100),
    requirementLabel: '100 hours studied',
  },
  {
    id: 'bridge',
    name: 'Little bridge',
    description: 'A wooden bridge crosses the pond.',
    category: 'path',
    requirement: (s) => s.wellnessDaysBalanced >= 10,
    requirementLabel: 'Balance study & movement on 10 days',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'The grove has become a proper forest.',
    category: 'plant',
    requirement: (s) => s.totalStudyMinutes >= h(150),
    requirementLabel: '150 hours studied',
  },
  {
    id: 'village',
    name: 'Small village',
    description: 'More buildings settle among the trees.',
    category: 'building',
    requirement: (s) => s.totalStudyMinutes >= h(250),
    requirementLabel: '250 hours studied',
  },
  {
    id: 'observatory',
    name: 'Observatory',
    description: 'A place to study the sky, for a mind that studies everything.',
    category: 'building',
    requirement: (s) => s.subjectsWithSessions >= 5 && s.totalStudyMinutes >= h(150),
    requirementLabel: '5 subjects studied & 150 hours total',
  },
]

/** Returns the set of unlocked object ids for the given stats, plus which
 *  ones are newly unlocked compared to a previous set (for "NEW DISCOVERY"
 *  moments — see §26). */
export function evaluateWorldUnlocks(
  stats: LifetimeStats,
  previouslyUnlocked: string[]
): { unlockedIds: string[]; newlyUnlocked: WorldObjectDef[] } {
  const unlockedIds: string[] = []
  const newlyUnlocked: WorldObjectDef[] = []
  for (const def of WORLD_UNLOCKS) {
    if (def.requirement(stats)) {
      unlockedIds.push(def.id)
      if (!previouslyUnlocked.includes(def.id)) newlyUnlocked.push(def)
    }
  }
  return { unlockedIds, newlyUnlocked }
}

export function worldObjectById(id: string): WorldObjectDef | undefined {
  return WORLD_UNLOCKS.find((d) => d.id === id)
}
