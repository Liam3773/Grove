import type { AppData, Settings, Subject } from '../types'

export const DEFAULT_SETTINGS: Settings = {
  userName: '',
  onboardingComplete: false,
  dailyStudyTargetMinutes: 90,
  weeklyStudyTargetMinutes: 600,
  theme: 'dark',
  soundEnabled: false,
  animationsEnabled: true,
  defaultSessionMinutes: 25,
  worldName: 'Your Grove',
  reducedMotion: false,
}

// Suggested starter subjects (offered, not forced, during onboarding)
export const SUGGESTED_SUBJECTS: Array<Pick<Subject, 'name' | 'color' | 'icon' | 'plantKind'>> = [
  { name: 'Maths', color: '#7fb88f', icon: 'sigma', plantKind: 'oak' },
  { name: 'English', color: '#d8a5c0', icon: 'book', plantKind: 'blossom' },
  { name: 'French', color: '#9db4e8', icon: 'globe', plantKind: 'lavender' },
  { name: 'Irish', color: '#8fc9a0', icon: 'leaf', plantKind: 'clover' },
  { name: 'History', color: '#c7a37a', icon: 'scroll', plantKind: 'ancient' },
  { name: 'Business', color: '#e0b563', icon: 'briefcase', plantKind: 'hedge' },
  { name: 'Physics', color: '#7ec8d8', icon: 'atom', plantKind: 'pine' },
]

export function emptyAppData(): AppData {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    subjects: [],
    topics: [],
    tasks: [],
    sessions: [],
    wellness: [],
    routine: [],
    world: { unlockedObjectIds: [], worldName: 'Your Grove' },
    achievements: [],
  }
}
