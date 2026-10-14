import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useMoodMap } from './context/MoodMapContext.tsx'
import { CheckInPage } from './pages/CheckInPage.tsx'
import { CompletePage } from './pages/CompletePage.tsx'
import { HabitsPage } from './pages/HabitsPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { WeeklyMapPage } from './pages/WeeklyMapPage.tsx'

// Screens behind the login: without a session the user is sent back to sign in.
function Protected({ children }: { children: ReactNode }) {
  const { session, ready } = useMoodMap()
  if (!ready) return <div className="grid min-h-screen place-items-center text-sm font-semibold text-[#718078]">Loading your MoodMap…</div>
  if (!session) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/habits" element={<Protected><HabitsPage /></Protected>} />
        <Route path="/check-in" element={<Protected><CheckInPage /></Protected>} />
        <Route path="/weekly-map" element={<Protected><WeeklyMapPage /></Protected>} />
        <Route path="/complete" element={<Protected><CompletePage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
