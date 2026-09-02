import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IssueDetail } from '@/types'

const STAGES = ['Report', 'Consolidate', 'Prioritize', 'Assign', 'Verify', 'Confirm'] as const

function computeStageIndex(issue: IssueDetail): number {
  if (issue.department || issue.status !== 'OPEN') {
    const latestResolution = issue.resolutions[0]
    if (issue.feedbacks.length > 0) return 5
    if (latestResolution && latestResolution.verificationStatus !== 'PENDING') return 4
    if (latestResolution) return 4
    if (issue.department) return 3
  }
  return 2
}

export function LifecycleStages({ issue }: { issue: IssueDetail }) {
  const activeIndex = computeStageIndex(issue)

  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
      {STAGES.map((stage, idx) => {
        const done = idx < activeIndex
        const active = idx === activeIndex
        return (
          <div key={stage} className="flex shrink-0 items-center">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-bold transition-colors',
                  done && 'bg-civic-600 text-white',
                  active && 'bg-civic-100 text-civic-700 ring-2 ring-civic-600',
                  !done && !active && 'bg-secondary text-muted-foreground'
                )}
              >
                {done ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  active ? 'text-civic-700 font-semibold' : done ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {stage}
              </span>
            </div>
            {idx < STAGES.length - 1 && <span className={cn('mx-2 h-px w-6 shrink-0', done ? 'bg-civic-600' : 'bg-border')} />}
          </div>
        )
      })}
    </div>
  )
}
