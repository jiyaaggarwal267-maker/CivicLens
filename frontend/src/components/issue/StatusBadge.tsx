import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS } from '@/lib/format'
import type { IssueStatus } from '@/types'
import { cn } from '@/lib/utils'
import { Building2, Circle, PlayCircle, CheckCircle2, RefreshCw } from 'lucide-react'

const STATUS_STYLES: Record<IssueStatus, string> = {
  OPEN: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  ASSIGNED: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  RESOLVED: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
  REOPENED: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
}

const STATUS_ICONS: Record<IssueStatus, typeof Circle> = {
  OPEN: Circle,
  ASSIGNED: Building2,
  IN_PROGRESS: PlayCircle,
  RESOLVED: CheckCircle2,
  REOPENED: RefreshCw,
}

export function StatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  const Icon = STATUS_ICONS[status]
  return (
    <Badge variant="outline" className={cn('gap-1 border-transparent', STATUS_STYLES[status], className)}>
      <Icon className={cn('h-3 w-3', status === 'IN_PROGRESS' && 'animate-pulse')} />
      {STATUS_LABELS[status]}
    </Badge>
  )
}
