import { BarChart3, House, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const items = [
  { to: '/check-in', label: 'Today', icon: House },
  { to: '/weekly-map', label: 'Map', icon: BarChart3 },
  { to: '/complete', label: 'Streak', icon: Sparkles },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed inset-x-4 bottom-4 z-10 mx-auto flex max-w-sm items-center justify-around rounded-2xl border border-white/70 bg-white/95 p-2 shadow-xl shadow-[#173c2c]/10 backdrop-blur" aria-label="Main navigation">
      {items.map(({ to, label, icon: Icon }) => {
        const active = location.pathname === to

        return (
          <Link
            key={to}
            to={to}
            className={`flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${active ? 'bg-[#e6f3e8] text-[#22633e]' : 'text-[#718078] hover:bg-[#f2f5f2]'}`}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}