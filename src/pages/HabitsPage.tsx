import { ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppFrame, Progress } from '../components/Layout.tsx'
import { PrimaryButton } from '../components/ui/PrimaryButton.tsx'
import { habits, useMoodMap } from '../context/MoodMapContext.tsx'

export function HabitsPage() {
  const navigate = useNavigate(); const { selectedHabits, toggleSelectedHabit, saveHabits } = useMoodMap()
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null)
  const onContinue = async () => {
    setBusy(true); setError(null)
    try { await saveHabits(); navigate('/check-in') } catch (err) { setError(err instanceof Error ? err.message : 'Could not save your habits.') } finally { setBusy(false) }
  }
  return <AppFrame><section className="mx-auto flex w-full max-w-3xl flex-1 flex-col py-10 sm:py-16"><div className="flex items-center justify-between"><p className="text-sm font-bold uppercase tracking-[0.15em] text-[#47855f]">Set your focus</p><Progress current={1} /></div><h1 className="mt-5 max-w-xl text-4xl font-bold tracking-[-0.055em] sm:text-5xl">What would you like to make space for?</h1><p className="mt-4 max-w-xl text-lg leading-7 text-[#68756e]">Choose a few habits to include in your daily check-in. You can always change these later.</p><div className="mt-9 grid gap-3 sm:grid-cols-2">{habits.map((habit) => { const selected = selectedHabits.includes(habit.id); return <button key={habit.id} type="button" onClick={() => toggleSelectedHabit(habit.id)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${selected ? 'border-[#5a9c6e] bg-[#eaf5ec] shadow-sm' : 'border-[#e0e6e1] bg-white hover:border-[#9dc9a8]'}`}><span className={`grid size-11 place-items-center rounded-xl text-xl ${selected ? 'bg-[#3d8a5c] text-white' : 'bg-[#f1f5f1] text-[#4d6255]'}`}>{selected ? <Check size={20} /> : habit.icon}</span><span className="font-bold text-[#23342a]">{habit.label}</span></button> })}</div>{error && <p role="alert" className="mt-6 rounded-xl bg-[#fbeaea] px-4 py-3 text-sm font-semibold text-[#a03b3b]">{error}</p>}<div className="mt-8 flex items-center justify-between"><p className="text-sm text-[#718078]">{selectedHabits.length} selected</p><PrimaryButton type="button" disabled={selectedHabits.length === 0 || busy} onClick={onContinue} label={busy ? 'Saving…' : 'Continue'} icon={<ArrowRight size={18} />} className="px-5 py-3.5" /></div></section></AppFrame>
}
