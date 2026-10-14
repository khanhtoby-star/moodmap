import { Activity, ArrowUpRight, CheckCircle2, Plus, Target } from 'lucide-react'
import { useState } from 'react'

const cn = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(' ')

export interface Metric {
  label: 'Sleep' | 'Hydration' | 'Movement'
  value: string
  trend: number
  unit?: '%'
}

export interface Goal {
  id: string
  title: string
  isCompleted: boolean
}

interface ActivityCardProps {
  category?: string
  title?: string
  metrics?: Metric[]
  dailyGoals?: Goal[]
  onAddGoal?: () => void
  onToggleGoal?: (goalId: string) => void
  onViewDetails?: () => void
  className?: string
}

const PRIMARY_GREEN = '#3d8a5c'

export function ActivityCard({
  category = 'Activity',
  title = "Today's Progress",
  metrics = [],
  dailyGoals = [],
  onAddGoal,
  onToggleGoal,
  onViewDetails,
  className,
}: ActivityCardProps) {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null)

  return (
    <div
      className={cn(
        'relative h-full rounded-3xl border border-white bg-white p-5 shadow-xl shadow-[#173c2c]/5 sm:p-6',
        'transition-all duration-300 hover:border-[#cfe0d2]',
        className,
      )}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-full bg-[#e9f5eb] p-2 text-[#3d8a5c]">
          <Activity className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#17221e]">{title}</h3>
          <p className="text-sm text-[#718078]">{category}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="relative flex min-w-0 flex-col items-center"
            onMouseEnter={() => setHoveredMetric(metric.label)}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            <div className="relative size-20 sm:size-24">
              <div className="absolute inset-0 rounded-full bg-[#e6eee8]" />
              <div
                className={cn(
                  'absolute inset-0 rounded-full transition-transform duration-500',
                  hoveredMetric === metric.label && 'scale-105',
                )}
                style={{ background: `conic-gradient(${PRIMARY_GREEN} ${metric.trend}%, transparent 0)` }}
              />
              <div className="absolute inset-1 rounded-full bg-white" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-[#17221e] sm:text-xl">{metric.value}</span>
                {metric.unit && <span className="text-xs text-[#718078]">{metric.unit}</span>}
              </div>
            </div>
            <span className="mt-3 text-center text-sm font-medium text-[#304238]">{metric.label}</span>
            <span className="text-xs text-[#718078]">{metric.trend}%</span>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        <div className="h-px bg-gradient-to-r from-transparent via-[#dfe7e1] to-transparent" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-medium text-[#304238]">
              <Target className="size-4" />
              Today&apos;s Goals
            </h4>
            <button type="button" onClick={onAddGoal} aria-label="Add a habit goal" className="rounded-full p-1.5 transition-colors hover:bg-[#edf4ee]">
              <Plus className="size-4 text-[#548264]" />
            </button>
          </div>

          <div className="space-y-2">
            {dailyGoals.map((goal) => (
              <button
                type="button"
                key={goal.id}
                onClick={() => onToggleGoal?.(goal.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#e0e8e2] bg-[#f6f8f6] p-3 text-left transition-all hover:border-[#bcd5c2]"
              >
                <CheckCircle2 className={cn('size-5 shrink-0', goal.isCompleted ? 'text-[#3d8a5c]' : 'text-[#aab8ae]')} />
                <span className={cn('text-sm', goal.isCompleted ? 'text-[#75827a] line-through' : 'text-[#304238]')}>
                  {goal.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-[#e0e8e2] pt-4">
          <button type="button" onClick={onViewDetails} className="inline-flex items-center gap-2 text-sm font-medium text-[#548264] transition-colors hover:text-[#173c2c]">
            View Activity Details
            <ArrowUpRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}