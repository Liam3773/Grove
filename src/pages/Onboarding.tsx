import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../data/AppDataContext'
import { Button } from '../components/ui'
import { SUGGESTED_SUBJECTS } from '../data/defaults'
import { WorldScene } from '../features/world/WorldScene'

export default function Onboarding() {
  const { updateSettings, seedSuggestedSubjects } = useAppData()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [chosen, setChosen] = useState<string[]>([])
  const [target, setTarget] = useState(90)

  function finish() {
    updateSettings({
      userName: name.trim(),
      dailyStudyTargetMinutes: target,
      onboardingComplete: true,
    })
    if (chosen.length) seedSuggestedSubjects(chosen)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center">
      {step === 0 && (
        <div className="animate-rise flex w-full max-w-sm flex-col items-center">
          <WorldScene unlockedIds={['bare_earth']} unlockedDefs={[]} width={280} height={160} animated={false} className="mb-6 rounded-2xl" />
          <h1 className="font-display text-3xl text-mist-100 mb-3">Build something while you study.</h1>
          <p className="mb-8 text-sm text-mist-500">
            Grove turns your real study time into a small world that grows alongside you — no ads, no accounts, nothing to buy.
          </p>
          <Button onClick={() => setStep(1)} className="w-full">Get started</Button>
        </div>
      )}

      {step === 1 && (
        <div className="animate-rise w-full max-w-sm">
          <h1 className="font-display text-2xl text-mist-100 mb-2">What's your name?</h1>
          <p className="mb-6 text-sm text-mist-500">So your dashboard can greet you properly.</p>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="mb-8 w-full rounded-xl border border-earth-700 bg-earth-850 px-4 py-3 text-center text-lg text-mist-100 placeholder:text-mist-600"
          />
          <Button onClick={() => setStep(2)} className="w-full">Continue</Button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-rise w-full max-w-sm">
          <h1 className="font-display text-2xl text-mist-100 mb-2">Choose your subjects</h1>
          <p className="mb-6 text-sm text-mist-500">You can add, rename, or remove these anytime.</p>
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {SUGGESTED_SUBJECTS.map((s) => {
              const active = chosen.includes(s.name)
              return (
                <button
                  key={s.name}
                  onClick={() => setChosen((c) => (active ? c.filter((n) => n !== s.name) : [...c, s.name]))}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${active ? 'border-transparent text-earth-950' : 'border-earth-700 text-mist-300'}`}
                  style={active ? { background: s.color } : undefined}
                >
                  {s.name}
                </button>
              )
            })}
          </div>
          <Button onClick={() => setStep(3)} className="w-full">Continue</Button>
          <button onClick={() => setStep(3)} className="mt-3 text-xs text-mist-600">Skip for now</button>
        </div>
      )}

      {step === 3 && (
        <div className="animate-rise w-full max-w-sm">
          <h1 className="font-display text-2xl text-mist-100 mb-2">Daily study target</h1>
          <p className="mb-6 text-sm text-mist-500">A gentle target — you can change this anytime.</p>
          <p className="font-display text-4xl text-moss-400 mb-4">{target} min</p>
          <input
            type="range" min={15} max={240} step={15}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="mb-10 w-full accent-[var(--color-moss-500)]"
          />
          <Button onClick={() => setStep(4)} className="w-full">Continue</Button>
        </div>
      )}

      {step === 4 && (
        <div className="animate-rise w-full max-w-sm">
          <WorldScene unlockedIds={['bare_earth']} unlockedDefs={[]} width={280} height={160} animated={false} className="mb-6 rounded-2xl" />
          <h1 className="font-display text-2xl text-mist-100 mb-3">Your world starts here.</h1>
          <p className="mb-8 text-sm text-mist-500">Every session you complete will help it grow.</p>
          <Button onClick={finish} className="w-full">Enter Grove</Button>
        </div>
      )}
    </div>
  )
}
