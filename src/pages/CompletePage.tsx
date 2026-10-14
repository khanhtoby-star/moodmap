import { CheckCircle2, Flame, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppFrame } from '../components/Layout.tsx'
import { PrimaryButton } from '../components/ui/PrimaryButton.tsx'
import { useMoodMap } from '../context/MoodMapContext.tsx'

export function CompletePage() {
  const navigate = useNavigate()
  const { completedHabits, selectedHabits, savedToday, summary, refreshSummary } = useMoodMap()
  useEffect(() => { refreshSummary().catch(() => undefined) }, [refreshSummary])
  const streak = summary?.streak ?? 0
  const done = completedHabits.filter((id) => selectedHabits.includes(id)).length
  return <AppFrame navigation><section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12 text-center"><div className="mx-auto grid size-24 place-items-center rounded-full bg-[#dff2e3] text-[#3d8a5c] shadow-lg shadow-[#3d8a5c]/10"><CheckCircle2 size={48} strokeWidth={2.2} /></div><p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-[#47855f]">{savedToday ? 'Check-in complete' : 'Not checked in yet'}</p><h1 className="mt-3 text-5xl font-bold tracking-[-0.065em] sm:text-6xl">{savedToday ? 'You showed up for yourself.' : 'Your day is still open.'}</h1><p className="mx-auto mt-5 max-w-md text-lg leading-8 text-[#68756e]">{savedToday ? 'That’s today’s data point. Come back tomorrow and keep building a clearer picture of what helps.' : 'A quick check-in keeps your streak going and adds today to your mood map.'}</p><div className="mt-9 grid grid-cols-2 gap-4 text-left"><div className="rounded-3xl bg-[#173c2c] p-5 text-white"><Flame className="text-[#9ee2ad]" size={25} /><p className="mt-6 text-4xl font-bold">{summary ? streak : '–'}</p><p className="mt-1 text-sm text-[#c5dfca]">day streak</p></div><div className="rounded-3xl bg-white p-5 shadow-lg shadow-[#173c2c]/5"><p className="text-sm font-bold text-[#548264]">Today</p><p className="mt-6 text-4xl font-bold text-[#23342a]">{done}<span className="text-lg text-[#839087]">/{selectedHabits.length}</span></p><p className="mt-1 text-sm text-[#718078]">habits complete</p></div></div><p className="mt-4 text-sm text-[#718078]">{summary ? `${summary.total_checkins} check-in${summary.total_checkins === 1 ? '' : 's'} saved in total` : ''}</p><PrimaryButton type="button" onClick={() => navigate('/check-in')} label={savedToday ? 'View today’s check-in' : 'Check in now'} icon={<RotateCcw size={18} />} variant="green" className="mt-7 w-full justify-center px-5 py-4" /><button type="button" onClick={() => navigate('/weekly-map')} className="mt-3 text-sm font-bold text-[#577264] hover:text-[#173c2c]">Back to my mood map</button></section></AppFrame>
}
