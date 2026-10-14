import { LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useMoodMap } from '../context/MoodMapContext.tsx'
import { BottomNav } from './ui/BottomNav.tsx'

export function Wordmark() {
  return <Link to="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-[-0.04em] text-[#17221e]"><span className="grid size-7 place-items-center rounded-full bg-[#173c2c] text-sm text-white">m</span>MoodMap</Link>
}

export function Progress({ current }: { current: number }) {
  return <div className="flex gap-1.5" aria-label={`Step ${current} of 3`}>{[1, 2, 3].map((step) => <span key={step} className={`h-1 w-8 rounded-full ${step <= current ? 'bg-[#3d8a5c]' : 'bg-[#d9dfda]'}`} />)}</div>
}

function AccountChip() {
  const { session, signOut } = useMoodMap()
  const navigate = useNavigate()
  if (!session) return <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#5c6a62] shadow-sm">Your daily reset</span>
  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-48 truncate rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#5c6a62] shadow-sm sm:inline">{session.email}</span>
      <button type="button" onClick={() => { signOut(); navigate('/') }} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#5c6a62] shadow-sm transition hover:text-[#173c2c]"><LogOut size={14} />Sign out</button>
    </div>
  )
}

export function AppFrame({ children, navigation = false }: { children: ReactNode; navigation?: boolean }) {
  return <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-24 pt-5 sm:px-8 sm:pt-7"><header className="flex items-center justify-between gap-3"><Wordmark /><AccountChip /></header><div className="flex flex-1 flex-col">{children}</div>{navigation && <BottomNav />}</main>
}
