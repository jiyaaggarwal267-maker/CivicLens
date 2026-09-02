import {
  CheckCircle2,
  Building2,
  Copy,
  FileImage,
  MessageSquareWarning,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import type { IssueEvent } from '@/types'
import { cn } from '@/lib/utils'

const ICONS: Record<string, typeof CheckCircle2> = {
  REPORTED: Sparkles,
  DUPLICATE_MERGED: Copy,
  ASSIGNED: Building2,
  STATUS_CHANGE: PlayCircle,
  RESOLUTION_UPLOADED: FileImage,
  AI_VERIFICATION: ShieldCheck,
  CITIZEN_FEEDBACK: MessageSquareWarning,
}

export function Timeline({ events }: { events: IssueEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>
  }

  return (
    <ol className="relative border-l border-border pl-6">
      {events.map((event, idx) => {
        const Icon = ICONS[event.type] ?? Sparkles
        const isLast = idx === events.length - 1
        return (
          <li key={event.id} className={cn('relative pb-6', isLast && 'pb-0')}>
            <span className="absolute -left-[1.94rem] flex h-6 w-6 items-center justify-center rounded-full bg-civic-600 text-white ring-4 ring-white">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-muted-foreground">{formatDateTime(event.createdAt)}</span>
              <p className="text-sm text-foreground">{event.message}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
