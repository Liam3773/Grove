import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Upload, AlertTriangle } from 'lucide-react'
import { useAppData } from '../data/AppDataContext'
import { useSync, type SyncStatus } from '../data/SyncContext'
import { Card, PageHeader, Button, Pill } from '../components/ui'

export default function Settings() {
  const { data, updateSettings, exportData, importData, resetData } = useAppData()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const s = data.settings

  async function handleExport() {
    const json = await exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grove-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text()
      await importData(text)
      setImportMsg('Backup restored successfully.')
    } catch {
      setImportMsg('That file could not be read as a Grove backup.')
    }
  }

  async function handleReset() {
    await resetData()
    setConfirmingReset(false)
    navigate('/onboarding')
  }

  return (
    <div className="animate-rise">
      <PageHeader title="Settings" settingsLink={false} back="/" />

      <Section title="Profile">
        <Field label="Your name">
          <input
            value={s.userName}
            onChange={(e) => updateSettings({ userName: e.target.value })}
            className="w-full rounded-lg border border-earth-700 bg-earth-900 px-3 py-2 text-sm text-mist-100"
            placeholder="Liam"
          />
        </Field>
        <Field label="World name">
          <input
            value={data.world.worldName}
            onChange={(e) => updateSettings({ worldName: e.target.value })}
            className="w-full rounded-lg border border-earth-700 bg-earth-900 px-3 py-2 text-sm text-mist-100"
            placeholder="Your Grove"
          />
        </Field>
      </Section>

      <Section title="Study">
        <Field label={`Daily target — ${s.dailyStudyTargetMinutes} min`}>
          <input
            type="range" min={15} max={300} step={15}
            value={s.dailyStudyTargetMinutes}
            onChange={(e) => updateSettings({ dailyStudyTargetMinutes: Number(e.target.value) })}
            className="w-full accent-[var(--color-moss-500)]"
          />
        </Field>
        <Field label={`Weekly target — ${Math.round(s.weeklyStudyTargetMinutes / 60)}h`}>
          <input
            type="range" min={120} max={2400} step={60}
            value={s.weeklyStudyTargetMinutes}
            onChange={(e) => updateSettings({ weeklyStudyTargetMinutes: Number(e.target.value) })}
            className="w-full accent-[var(--color-moss-500)]"
          />
        </Field>
      </Section>

      <Section title="Timer">
        <Field label={`Default session length — ${s.defaultSessionMinutes} min`}>
          <input
            type="range" min={5} max={90} step={5}
            value={s.defaultSessionMinutes}
            onChange={(e) => updateSettings({ defaultSessionMinutes: Number(e.target.value) })}
            className="w-full accent-[var(--color-moss-500)]"
          />
        </Field>
      </Section>

      <Section title="Appearance & sound">
        <ToggleRow label="Animations" checked={s.animationsEnabled} onChange={(v) => updateSettings({ animationsEnabled: v })} />
        <ToggleRow label="Reduced motion" checked={s.reducedMotion} onChange={(v) => updateSettings({ reducedMotion: v })} />
        <ToggleRow label="Ambient sound" checked={s.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} />
      </Section>

      <AccountSection />

      <Section title="Data">
        <p className="mb-3 text-xs text-mist-600">
          Grove stores everything on this device only. Export a backup so you never lose progress if you switch browsers or phones.
        </p>
        <div className="mb-3 flex gap-2">
          <Button variant="secondary" onClick={handleExport} className="flex-1">
            <Download size={15} /> Export data
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} className="flex-1">
            <Upload size={15} /> Import data
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
          />
        </div>
        {importMsg && <p className="mb-3 text-xs text-moss-400">{importMsg}</p>}

        {!confirmingReset ? (
          <Button variant="danger" onClick={() => setConfirmingReset(true)} className="w-full">
            Reset all progress
          </Button>
        ) : (
          <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-3">
            <p className="mb-3 flex items-start gap-2 text-xs text-red-300">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              This permanently deletes every subject, session, task, and world unlock on this device. Consider exporting a backup first.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmingReset(false)} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={handleReset} className="flex-1">Yes, reset everything</Button>
            </div>
          </div>
        )}
      </Section>

      <p className="pb-6 pt-2 text-center text-xs text-mist-700">Grove · no ads, no accounts, no subscriptions.</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mist-600">{title}</p>
      <div className="space-y-4">{children}</div>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs text-mist-500">{label}</p>
      {children}
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-mist-200">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`h-6 w-11 rounded-full transition-colors ${checked ? 'bg-moss-500' : 'bg-earth-700'}`}
      >
        <span className={`block h-5 w-5 rounded-full bg-mist-100 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

// ---------- Account (cloud sync) ----------

function signedInStatusText(status: SyncStatus): string {
  switch (status) {
    case 'synced':
      return 'Your grove is synced.'
    case 'syncing':
      return 'Syncing your grove…'
    case 'offline':
      return "You're offline — Grove is still saving on this device."
    case 'error':
      return "Couldn't reach your account — still saving locally."
    case 'local':
    default:
      return 'Getting ready to sync…'
  }
}

function signedInPill(status: SyncStatus): { label: string; tone: 'neutral' | 'moss' | 'amber' | 'red' } {
  switch (status) {
    case 'synced':
      return { label: 'Synced', tone: 'moss' }
    case 'syncing':
      return { label: 'Syncing', tone: 'amber' }
    case 'offline':
      return { label: 'Offline', tone: 'neutral' }
    case 'error':
      return { label: 'Error', tone: 'red' }
    case 'local':
    default:
      return { label: 'Local', tone: 'neutral' }
  }
}

function AccountSection() {
  const sync = useSync()
  const [formMode, setFormMode] = useState<'signup' | 'signin' | null>(null)

  if (!sync.available) {
    return (
      <Section title="Account">
        <p className="text-xs text-mist-600">
          Account sync isn&rsquo;t set up for this build — Grove keeps working fully offline on this device.
        </p>
      </Section>
    )
  }

  if (sync.authLoading) {
    return (
      <Section title="Account">
        <p className="text-xs text-mist-600">Checking your account…</p>
      </Section>
    )
  }

  if (sync.pendingMerge) {
    return (
      <Section title="Account">
        <p className="text-sm text-mist-200">We found an existing grove on this device.</p>
        <p className="mb-1 text-xs text-mist-600">Would you like to sync it to your account?</p>
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1" onClick={sync.confirmMergeLocal}>Sync my grove</Button>
          <Button variant="secondary" className="flex-1" onClick={sync.dismissMerge}>Keep local</Button>
        </div>
      </Section>
    )
  }

  if (!sync.user) {
    return (
      <Section title="Account">
        {formMode ? (
          <AuthForm mode={formMode} onModeChange={setFormMode} onCancel={() => setFormMode(null)} />
        ) : (
          <>
            <p className="mb-3 text-sm text-mist-200">Your grove lives on this device.</p>
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1" onClick={() => setFormMode('signup')}>Create account</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setFormMode('signin')}>Sign in</Button>
            </div>
          </>
        )}
      </Section>
    )
  }

  const pill = signedInPill(sync.status)

  return (
    <Section title="Account">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-mist-200">{signedInStatusText(sync.status)}</p>
          <p className="truncate text-xs text-mist-600">{sync.user.email ?? 'Signed in'}</p>
        </div>
        <Pill tone={pill.tone}>{pill.label}</Pill>
      </div>
      {sync.errorMessage && <p className="mt-3 text-xs text-red-300">{sync.errorMessage}</p>}
      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={sync.syncNow}
          disabled={sync.status === 'syncing' || sync.status === 'offline'}
        >
          Sync now
        </Button>
        <Button variant="danger" className="flex-1" onClick={sync.signOutUser}>Sign out</Button>
      </div>
    </Section>
  )
}

function AuthForm({
  mode, onModeChange, onCancel,
}: {
  mode: 'signup' | 'signin'
  onModeChange: (mode: 'signup' | 'signin') => void
  onCancel: () => void
}) {
  const sync = useSync()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await sync.signUp(email, password)
      } else {
        await sync.signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Email">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-earth-700 bg-earth-900 px-3 py-2 text-sm text-mist-100"
          placeholder="you@example.com"
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          required
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-earth-700 bg-earth-900 px-3 py-2 text-sm text-mist-100"
          placeholder="At least 6 characters"
        />
      </Field>

      {error && <p className="text-xs text-red-300">{error}</p>}

      <div className="flex gap-2">
        <Button variant="secondary" type="button" className="flex-1" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" className="flex-1" disabled={submitting}>
          {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => { onModeChange(mode === 'signup' ? 'signin' : 'signup'); setError(null) }}
        className="text-xs text-mist-500 hover:text-mist-200"
      >
        {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
    </form>
  )
}
