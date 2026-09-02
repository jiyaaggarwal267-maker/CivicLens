import { AlertTriangle, Circle, TrendingUp } from 'lucide-react'
import type { PriorityLevel } from '@/types'
import { cn } from '@/lib/utils'

const CONFIG: Record<PriorityLevel, { label: string; classes: string; Icon: typeof Circle }> = {
  HIGH: { label: 'HIGH PRIORITY', classes: 'bg-red-50 text-red-700 ring-red-600/20', Icon: AlertTriangle },
  MEDIUM: { label: 'MEDIUM PRIORITY', classes: 'bg-amber-50 text-amber-700 ring-amber-600/20', Icon: TrendingUp },
  LOW: { label: 'LOW PRIORITY', classes: 'bg-slate-100 text-slate-600 ring-slate-500/20', Icon: Circle },
}

export function PriorityBadge({ level, className }: { level: PriorityLevel; className?: string }) {
  const { label, classes, Icon } = CONFIG[level]
  return (
    <span className={cn('relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset', classes, className)}>
      {level === 'HIGH' && <span className="absolute -left-1 -top-1 h-2 w-2 animate-ping rounded-full bg-red-500" />}
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

export function PriorityScore({ score, className }: { score: number; className?: string }) {
  const color = score >= 70 ? 'text-red-600' : score >= 40 ? 'text-amber-600' : 'text-slate-500'
  return (
    <span className={cn('font-bold tabular-nums', color, className)}>
      {score}
      <span className="text-muted-foreground font-medium text-[0.7em]">/100</span>
    </span>
  )
}
