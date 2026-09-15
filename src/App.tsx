import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAppData } from './data/AppDataContext'
import { BottomNav } from './components/BottomNav'
import Home from './pages/Home'
import Study from './pages/Study'
import Plan from './pages/Plan'
import ProgressPage from './pages/Progress'
import World from './pages/World'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'
import SubjectDetail from './pages/SubjectDetail'

export default function App() {
  const { loading, data } = useAppData()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-earth-900">
        <div className="h-10 w-10 animate-pulse rounded-full bg-moss-500/40" />
        <p className="text-sm text-mist-600">Growing your grove…</p>
      </div>
    )
  }

  const needsOnboarding = !data.settings.onboardingComplete && location.pathname !== '/onboarding'

  if (needsOnboarding) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    )
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
          <Route path="/subjects/:id" element={<SubjectDetail />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
    </div>
  )
}
