import { useState } from 'react'
import { useAppData } from '../data/AppDataContext'
import { Card, PageHeader } from '../components/ui'
import { WorldScene, currentTimeOfDay, currentSeason, type TimeOfDay, type Season } from '../features/world/WorldScene'
import { WORLD_UNLOCKS } from '../lib/worldProgression'
import { Lock, Sparkles, Moon, Sun, CloudSun } from 'lucide-react'

const TOD_OPTIONS: { key: TimeOfDay; icon: any; label: string }[] = [
  { key: 'day', icon: Sun, label: 'Day' },
  { key: 'evening', icon: CloudSun, label: 'Evening' },
  { key: 'night', icon: Moon, label: 'Night' },
]

export default function World() {
  const { data, stats } = useAppData()
  const [todOverride, setTodOverride] = useState<TimeOfDay | null>(null)
  const [season] = useState<Season>(currentSeason())

  const unlocked = WORLD_UNLOCKS.filter((d) => data.world.unlockedObjectIds.includes(d.id))
  const locked = WORLD_UNLOCKS.filter((d) => !data.world.unlockedObjectIds.includes(d.id))

  return (
    <div className="animate-rise">
      <PageHeader title={data.world.worldName || 'Your world'} subtitle="Grown entirely from your own study." />

      <Card className="mb-4 overflow-hidden p-0">
        <WorldScene
          unlockedIds={data.world.unlockedObjectIds}
          unlockedDefs={WORLD_UNLOCKS}
          width={420}
          height={260}
          timeOfDay={todOverride ?? currentTimeOfDay()}
          season={season}
          className="w-full"
        />
        <div className="flex items-center justify-center gap-2 p-3">
          {TOD_OPTIONS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTodOverride(todOverride === key ? null : key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                (todOverride ?? currentTimeOfDay()) === key ? 'border-moss-500 text-moss-400' : 'border-earth-700 text-mist-500'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </Card>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="font-display text-lg text-mist-100">{unlocked.length}</p>
          <p className="text-xs text-mist-600">discovered</p>
        </Card>
        <Card className="text-center">
          <p className="font-display text-lg text-mist-100">{locked.length}</p>
          <p className="text-xs text-mist-600">still to grow</p>
        </Card>
        <Card className="text-center">
          <p className="font-display text-lg text-mist-100 capitalize">{season}</p>
          <p className="text-xs text-mist-600">season</p>
        </Card>
      </div>

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">What's grown so far</p>
      <ul className="mb-6 space-y-2">
        {unlocked.slice().reverse().map((d) => (
          <li key={d.id} className="flex items-start gap-3 rounded-xl border border-earth-700/50 bg-earth-850/50 px-3.5 py-3">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-moss-400" />
            <div>
              <p className="text-sm text-mist-100">{d.name}</p>
              <p className="text-xs text-mist-600">{d.description}</p>
              <p className="mt-0.5 text-[11px] text-moss-500/80">Unlocked after: {d.requirementLabel}</p>
            </div>
          </li>
        ))}
      </ul>

      {locked.length > 0 && (
        <>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">Waiting to grow</p>
          <ul className="space-y-2">
            {locked.slice(0, 6).map((d) => (
              <li key={d.id} className="flex items-start gap-3 rounded-xl border border-dashed border-earth-700/50 px-3.5 py-3 opacity-70">
                <Lock size={15} className="mt-0.5 shrink-0 text-mist-600" />
                <div>
                  <p className="text-sm text-mist-300">{d.name}</p>
                  <p className="text-[11px] text-mist-600">{d.requirementLabel}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 pb-4 text-center text-xs text-mist-600">
        {stats.totalStudyMinutes === 0 ? "Your first tree is waiting." : 'Your grove is waiting for you to come back.'}
      </p>
    </div>
  )
}
