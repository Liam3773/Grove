import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, LogOut, RefreshCw, CloudOff, CloudCheck, Loader2, User as UserIcon } from 'lucide-react'
import { useSync, type SyncStatus } from '../data/SyncContext'
import { Card, PageHeader, Button } from '../components/ui'

type Mode = 'signin' | 'create'

export default function Account() {
  const navigate = useNavigate()
  const {
    available, user, authLoading, initializing, status, errorMessage, pendingMerge,
    signUp, signIn, signOutUser, syncNow, confirmMergeLocal, dismissMerge,
  } = useSync()

  if (authLoading || (user && initializing)) {
    return (
      <div className="animate-rise">
        <PageHeader title="Account" back="/" />
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 size={22} className="animate-spin text-mist-500" />
          <p className="text-sm text-mist-500">Checking your account…</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-rise">
      <PageHeader title="Account" back="/" />

      {!available && (
        <Card className="mb-4">
          <p className="text-sm text-mist-400">
            Account sync isn't set up for this Grove yet — you can still use everything locally.
          </p>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => navigate('/')}>
            Continue without account
          </Button>
        </Card>
      )}

      {available && !user && (
        <SignedOutPanel signUp={signUp} signIn={signIn} onSkip={() => navigate('/')} />
      )}

      {available && user && (
        <SignedInPanel
          email={user.email ?? ''}
          status={status}
          errorMessage={errorMessage}
          pendingMerge={pendingMerge}
          signOutUser={signOutUser}
          syncNow={syncNow}
          confirmMergeLocal={confirmMergeLocal}
          dismissMerge={dismissMerge}
        />
      )}
    </div>
  )
}

function SignedOutPanel({
  signUp, signIn, onSkip,
}: {
  signUp: (email: string, password: string, username?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  onSkip: () => void
}) {
  const location = useLocation()
  const initialMode = (location.state as { mode?: Mode } | null)?.mode ?? 'signin'
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function validate(): string | null {
    if (!email.trim() || !email.includes('@')) return 'Please enter a valid email.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    if (mode === 'create' && password !== confirm) return 'Passwords don\u2019t match.'
    if (mode === 'create' && !username.trim()) return 'Please enter a username.'
    if (mode === 'create' && !/^[a-zA-Z0-9_]{3,15}$/.test(username.trim())) return 'Username must be 3-15 characters and contain only letters, numbers, and underscores.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'create') {
        await signUp(email.trim(), password, username.trim())
      } else {
        await signIn(email.trim(), password)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="mb-4">
      <div className="mb-5 flex rounded-xl bg-earth-900 p-1">
        <button
          type="button"
          onClick={() => { setMode('signin'); setError(null) }}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'signin' ? 'bg-moss-500 text-earth-950' : 'text-mist-400'}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => { setMode('create'); setError(null) }}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === 'create' ? 'bg-moss-500 text-earth-950' : 'text-mist-400'}`}
        >
          Create account
        </button>
      </div>

      <p className="mb-5 text-sm text-mist-500">
        {mode === 'signin'
          ? 'Sign in to load your Grove on this device.'
          : 'Create a Grove account to sync your progress across devices.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'create' && (
          <LabeledInput icon={UserIcon} type="text" placeholder="Username" value={username} onChange={setUsername} autoComplete="off" />
        )}
        <LabeledInput icon={Mail} type="email" placeholder="Email" value={email} onChange={setEmail} autoComplete="email" />
        <LabeledInput icon={Lock} type="password" placeholder="Password" value={password} onChange={setPassword} autoComplete={mode === 'create' ? 'new-password' : 'current-password'} />
        {mode === 'create' && (
          <LabeledInput icon={Lock} type="password" placeholder="Confirm password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <button onClick={onSkip} className="mt-4 w-full text-center text-xs text-mist-600 hover:text-mist-300">
        Continue without account
      </button>
    </Card>
  )
}

function LabeledInput({
  icon: Icon, type, placeholder, value, onChange, autoComplete,
}: {
  icon: typeof Mail
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-earth-700 bg-earth-900 px-3 py-2.5">
      <Icon size={16} className="shrink-0 text-mist-600" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full bg-transparent text-sm text-mist-100 placeholder:text-mist-600 focus:outline-none"
      />
    </div>
  )
}

function statusLabel(status: SyncStatus): string {
  switch (status) {
    case 'synced': return 'Synced'
    case 'syncing': return 'Syncing…'
    case 'offline': return 'Offline — will sync when back online'
    case 'error': return 'Couldn\u2019t reach your account'
    case 'local': return 'Saved locally'
    default: return 'Signed in'
  }
}

function SignedInPanel({
  email, status, errorMessage, pendingMerge, signOutUser, syncNow, confirmMergeLocal, dismissMerge,
}: {
  email: string
  status: SyncStatus
  errorMessage: string | null
  pendingMerge: boolean
  signOutUser: () => Promise<void>
  syncNow: () => Promise<void>
  confirmMergeLocal: () => Promise<void>
  dismissMerge: () => void
}) {
  const [busy, setBusy] = useState(false)
  const isSynced = status === 'synced'

  return (
    <>
      <Card className="mb-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-mist-600">Account</p>
        <p className="mb-4 text-sm text-mist-100">{email}</p>

        <div className="mb-4 flex items-center gap-2 text-sm">
          {isSynced ? <CloudCheck size={16} className="text-moss-400" /> : <CloudOff size={16} className="text-mist-500" />}
          <span className={isSynced ? 'text-moss-400' : 'text-mist-500'}>{statusLabel(status)}</span>
        </div>
        {errorMessage && <p className="mb-4 text-xs text-red-400">{errorMessage}</p>}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={busy}
            onClick={async () => { setBusy(true); try { await syncNow() } finally { setBusy(false) } }}
          >
            <RefreshCw size={15} /> Sync now
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
            disabled={busy}
            onClick={async () => { setBusy(true); try { await signOutUser() } finally { setBusy(false) } }}
          >
            <LogOut size={15} /> Sign out
          </Button>
        </div>
      </Card>

      {pendingMerge && (
        <Card className="mb-4 border-amber-400/30 bg-amber-400/5">
          <p className="mb-1 text-sm font-semibold text-mist-100">Sync this Grove?</p>
          <p className="mb-4 text-xs text-mist-500">
            This account doesn't have a Grove yet. Uploading will make what's on this device the one that follows you everywhere.
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={busy}
              onClick={async () => { setBusy(true); try { await confirmMergeLocal() } finally { setBusy(false) } }}
            >
              Sync this Grove
            </Button>
            <Button variant="secondary" className="flex-1" onClick={dismissMerge} disabled={busy}>
              Not now
            </Button>
          </div>
        </Card>
      )}
    </>
  )
}
