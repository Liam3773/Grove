import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { useAppData } from '../data/AppDataContext'
import { useSync } from '../data/SyncContext'
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
        <WelcomeStep
          onContinueWithoutAccount={() => setStep(1)}
          onSignIn={() => navigate('/account', { state: { mode: 'signin' } })}
          onAccountCreated={() => setStep(1)}
          onCreateAccountUnavailable={() => navigate('/account', { state: { mode: 'create' } })}
        />
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

function WelcomeStep({
  onContinueWithoutAccount, onSignIn, onAccountCreated, onCreateAccountUnavailable,
}: {
  onContinueWithoutAccount: () => void
  onSignIn: () => void
  onAccountCreated: () => void
  onCreateAccountUnavailable: () => void
}) {
  const { available, signUp } = useSync()
  const [showCreate, setShowCreate] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords don\u2019t match.')

    setSubmitting(true)
    setError(null)
    try {
      await signUp(email.trim(), password)
      // Stay right here in onboarding — account creation shouldn't restart it.
      onAccountCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-rise flex w-full max-w-sm flex-col items-center">
      <WorldScene unlockedIds={['bare_earth']} unlockedDefs={[]} width={280} height={160} animated={false} className="mb-6 rounded-2xl" />
      <h1 className="font-display text-3xl text-mist-100 mb-3">Build something while you study.</h1>
      <p className="mb-8 text-sm text-mist-500">
        Grove turns your real study time into a small world that grows alongside you — no ads, nothing to buy.
      </p>

      {!showCreate && (
        <>
          <Button onClick={onContinueWithoutAccount} className="w-full">Continue without account</Button>
          <div className="mt-3 flex w-full gap-2">
            <Button variant="secondary" onClick={onSignIn} className="flex-1">Sign in</Button>
            <Button
              variant="secondary"
              onClick={() => (available ? setShowCreate(true) : onCreateAccountUnavailable())}
              className="flex-1"
            >
              Create account
            </Button>
          </div>
          <p className="mt-4 text-xs text-mist-600">Already have a Grove? Sign in to pick up where you left off.</p>
        </>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="w-full space-y-3 text-left">
          <p className="mb-1 text-xs text-mist-500">Create an account to sync this Grove across devices.</p>
          <div className="flex items-center gap-2 rounded-xl border border-earth-700 bg-earth-850 px-4 py-3">
            <Mail size={16} className="shrink-0 text-mist-600" />
            <input
              type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email" autoComplete="email"
              className="w-full bg-transparent text-mist-100 placeholder:text-mist-600 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-earth-700 bg-earth-850 px-4 py-3">
            <Lock size={16} className="shrink-0 text-mist-600" />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" autoComplete="new-password"
              className="w-full bg-transparent text-mist-100 placeholder:text-mist-600 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-earth-700 bg-earth-850 px-4 py-3">
            <Lock size={16} className="shrink-0 text-mist-600" />
            <input
              type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password" autoComplete="new-password"
              className="w-full bg-transparent text-mist-100 placeholder:text-mist-600 focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Creating…' : 'Create account'}
          </Button>
          <button
            type="button"
            onClick={() => { setShowCreate(false); setError(null) }}
            className="w-full text-center text-xs text-mist-600 hover:text-mist-300"
          >
            Back
          </button>
        </form>
      )}
    </div>
  )
}
