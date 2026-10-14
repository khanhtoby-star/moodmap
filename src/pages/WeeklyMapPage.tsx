import { ArrowRight, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppFrame } from '../components/Layout.tsx'
import { ActivityCard, type Metric } from '../components/ui/activity-card.tsx'
import { PrimaryButton } from '../components/ui/PrimaryButton.tsx'
import { habits, useMoodMap } from '../context/MoodMapContext.tsx'

const moodColor = ['#dce4df', '#d3e6d7', '#acd7b5', '#72b985', '#3d8a5c']
const moodFace = ['😔', '😕', '😐', '🙂', '😄']

const activityHabits = [
  { id: 'sleep', label: 'Sleep' },
  { id: 'water', label: 'Hydration' },
  { id: 'move', label: 'Movement' },
] as const

export function WeeklyMapPage() {
  const navigate = useNavigate()
  const { selectedMood, completedHabits, selectedHabits, savedToday, summary, toggleCompletedHabit, saveCheckIn, refreshSummary } = useMoodMap()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    refreshSummary().catch((err) => setError(err instanceof Error ? err.message : 'Could not load your map.'))
  }, [refreshSummary])

  const selectedGoals = habits.filter((habit) => selectedHabits.includes(habit.id))
  const metrics: Metric[] = activityHabits.map((habit) => {
    const rate = summary?.habit_rates[habit.id] ?? 0
    return { label: habit.label, value: String(rate), trend: rate, unit: '%' }
  })

  const onToggleGoal = async (habitId: string) => {
    if (!savedToday) {
      navigate('/check-in')
      return
    }
    const next = completedHabits.includes(habitId) ? completedHabits.filter((id) => id !== habitId) : [...completedHabits, habitId]
    toggleCompletedHabit(habitId)
    try {
      await saveCheckIn(next)
      await refreshSummary()
    } catch (err) {
      toggleCompletedHabit(habitId)
      setError(err instanceof Error ? err.message : 'Could not update the habit.')
    }
  }

  return (
    <AppFrame navigation>
      <section className="mx-auto w-full max-w-3xl py-8 sm:py-12">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#47855f]">Your patterns</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.055em] sm:text-5xl">Weekly mood map</h1>
          </div>
          <span className="rounded-full bg-[#e4f2e7] px-3 py-1.5 text-sm font-bold text-[#2c7047]">Last 7 days</span>
        </div>

        {error && <p role="alert" className="mt-6 rounded-xl bg-[#fbeaea] px-4 py-3 text-sm font-semibold text-[#a03b3b]">{error}</p>}

        <div className="mt-8 rounded-3xl border border-white bg-white p-5 shadow-xl shadow-[#173c2c]/5 sm:p-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-[#718078]">Average mood</p>
              <p className="mt-1 text-4xl font-bold tracking-[-0.06em]">
                {summary?.average_mood ?? '–'}<span className="text-lg text-[#829087]"> / 5</span>
              </p>
              <p className="mt-1 text-xs font-semibold text-[#8a978f]">{summary ? `${summary.checkins_this_week} of 7 days checked in` : 'Loading…'}</p>
            </div>
            <div className="rounded-xl bg-[#e9f5eb] p-3 text-[#3d8a5c]">
              <TrendingUp size={23} />
            </div>
          </div>

          <div className="mt-8 flex h-44 items-end justify-between gap-2 border-b border-[#e4eae5] pb-1">
            {(summary?.week ?? []).map((item, index) => {
              const isToday = index === 6
              return (
                <div key={item.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2" title={item.mood ? `${item.date}: mood ${item.mood}/5` : `${item.date}: no check-in`}>
                  {item.mood ? (
                    <div className="w-full max-w-11 rounded-t-xl transition-all" style={{ height: `${item.mood * 18}%`, backgroundColor: moodColor[item.mood - 1] }} />
                  ) : (
                    <div className="h-2 w-full max-w-11 rounded-full border border-dashed border-[#c9d3cc]" />
                  )}
                  <span className={`text-xs font-semibold ${isToday ? 'text-[#3d8a5c]' : 'text-[#7b8880]'}`}>{isToday ? 'Today' : item.day}</span>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f4f8f4] px-4 py-3">
            <span className="text-sm text-[#607067]">{savedToday ? 'Your check-in is included in today’s map.' : 'You haven’t checked in today yet.'}</span>
            <span className="text-lg">{savedToday && selectedMood ? moodFace[selectedMood - 1] : '·'}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ActivityCard
            category="Share of check-in days this week"
            metrics={metrics}
            dailyGoals={selectedGoals.map((habit) => ({
              id: habit.id,
              title: habit.label,
              isCompleted: completedHabits.includes(habit.id),
            }))}
            onAddGoal={() => navigate('/habits')}
            onToggleGoal={onToggleGoal}
            onViewDetails={() => navigate('/check-in')}
          />

          <article className="rounded-3xl bg-[#f9ecd9] p-5">
            <p className="text-sm font-bold text-[#94622a]">Small insight</p>
            <p className="mt-2 font-bold text-[#4d3a22]">{summary?.insight ?? 'Loading your insight…'}</p>
            <p className="mt-1 text-sm leading-6 text-[#806747]">Based on {summary?.total_checkins ?? 0} check-in{summary?.total_checkins === 1 ? '' : 's'} so far.</p>
          </article>
        </div>

        <PrimaryButton
          type="button"
          onClick={() => navigate('/complete')}
          label="Finish check-in"
          icon={<ArrowRight size={18} />}
          className="mt-7 w-full justify-center px-5 py-4"
        />
      </section>
    </AppFrame>
  )
}
