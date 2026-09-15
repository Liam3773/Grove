import { NavLink } from 'react-router-dom'
import { Home, Timer, CalendarDays, TrendingUp, Trees } from 'lucide-react'

const ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/study', label: 'Study', icon: Timer, end: false },
  { to: '/plan', label: 'Plan', icon: CalendarDays, end: false },
  { to: '/progress', label: 'Progress', icon: TrendingUp, end: false },
  { to: '/world', label: 'World', icon: Trees, end: false },
]

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-earth-700/60 bg-earth-950/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-1">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors min-h-[52px] ${
                  isActive ? 'text-moss-400' : 'text-mist-600 hover:text-mist-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.3 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
