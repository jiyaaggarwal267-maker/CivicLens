import { Link } from 'react-router-dom'
import { MapPin, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { PriorityScore } from './PriorityBadge'
import { CategoryIcon } from './CategoryIcon'
import { CATEGORY_LABELS } from '@/lib/format'
import type { IssueSummary } from '@/types'

export function IssueCard({ issue, to }: { issue: IssueSummary; to: string }) {
  return (
    <Link to={to}>
      <Card className="group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-elevated">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-civic-50 text-civic-600">
          <CategoryIcon category={issue.category} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-muted-foreground">{issue.code}</span>
            <StatusBadge status={issue.status} />
          </div>
          <h3 className="mt-0.5 truncate font-semibold text-foreground group-hover:text-civic-700">
            {CATEGORY_LABELS[issue.category]} — {issue.locationName.split(',')[0]}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {issue.locationName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {issue.reportCount} report{issue.reportCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <PriorityScore score={issue.priorityScore} className="text-xl" />
          <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">Priority</div>
        </div>
      </Card>
    </Link>
  )
}
