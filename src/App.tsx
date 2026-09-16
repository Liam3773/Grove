import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAppData } from './data/AppDataContext'
import { useSync } from './data/SyncContext'
import { BottomNav } from './components/BottomNav'
import Home from './pages/Home'
import Study from './pages/Study'
import Plan from './pages/Plan'
import ProgressPage from './pages/Progress'
import World from './pages/World'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import SubjectDetail from './pages/SubjectDetail'
import Account from './pages/Account'

export default function App() {
  const { loading, data } = useAppData()
  const { authLoading, initializing, user } = useSync()
  const location = useLocation()

  // While Firebase is confirming a persisted sign-in (or pulling down a
  // returning user's cloud Grove right after sign-in), hold off on the
  // onboarding decision below — otherwise a returning user briefly sees
  // onboarding flash before their synced data loads in.
  const settlingAccount = authLoading || (Boolean(user) && initializing)

  if (loading || settlingAccount) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-earth-900">
        <div className="h-10 w-10 animate-pulse rounded-full bg-moss-500/40" />
        <p className="text-sm text-mist-600">Growing your grove…</p>
      </div>
    )
  }

  const needsOnboarding =
    !data.settings.onboardingComplete && location.pathname !== '/onboarding' && location.pathname !== '/account'

  if (needsOnboarding) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    )
  }

  // If we are on the onboarding route but onboarding is actually complete, redirect to home.
  if (data.settings.onboardingComplete && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />
  }

  const showNav = location.pathname !== '/onboarding'

  return (
    <div className={data.settings.reducedMotion ? 'reduced-motion' : ''}>
      <div className="mx-auto min-h-screen max-w-xl px-4 pt-6" style={{ paddingBottom: showNav ? '96px' : '24px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<Study />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/world" element={<World />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account" element={<Account />} />
          <Route path="/subjects/:id" element={<SubjectDetail />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
    </div>
  )
}
