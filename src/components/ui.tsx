import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Settings as SettingsIcon, ChevronLeft } from 'lucide-react'

export function ProgressBar({ value, className = '', color = 'var(--color-moss-500)' }: { value: number; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-earth-700/70 ${className}`}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-earth-700/50 bg-earth-850/70 p-4 ${className}`}>
      {children}
    </div>
  )
}

export function PageHeader({
  title, subtitle, settingsLink = true, back,
}: { title: string; subtitle?: string; settingsLink?: boolean; back?: string }) {
  return (
    <div className="mb-5 flex items-start justify-between">
      <div>
        {back && (
          <Link to={back} className="mb-1 inline-flex items-center gap-1 text-sm text-mist-600 hover:text-mist-200">
            <ChevronLeft size={16} /> Back
          </Link>
        )}
        <h1 className="font-display text-2xl font-semibold text-mist-100">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-mist-600">{subtitle}</p>}
      </div>
      {settingsLink && (
        <Link
          to="/settings"
          className="rounded-full border border-earth-700/60 p-2 text-mist-400 transition-colors hover:text-mist-100"
          aria-label="Settings"
        >
          <SettingsIcon size={19} />
        </Link>
      )}
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-earth-700/60 px-6 py-10 text-center">
      <p className="font-display text-lg text-mist-200">{title}</p>
      <p className="max-w-xs text-sm text-mist-600">{body}</p>
      {action}
    </div>
  )
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'moss' | 'amber' | 'red' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-earth-700/60 text-mist-400',
    moss: 'bg-moss-500/15 text-moss-400',
    amber: 'bg-amber-500/15 text-amber-400',
    red: 'bg-red-400/15 text-red-300',
  }
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>
}

export function Button({
  children, onClick, variant = 'primary', className = '', type = 'button', disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const variants: Record<string, string> = {
    primary: 'bg-moss-500 text-earth-950 hover:bg-moss-400 active:bg-moss-600',
    secondary: 'bg-earth-700 text-mist-100 hover:bg-earth-600',
    ghost: 'bg-transparent text-mist-400 hover:text-mist-100 hover:bg-earth-800',
    danger: 'bg-transparent text-red-400 border border-red-400/30 hover:bg-red-400/10',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
