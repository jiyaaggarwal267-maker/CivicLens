import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Users } from 'lucide-react'
import { IssueMap } from '@/components/map/IssueMap'
import { CategoryIcon } from '@/components/issue/CategoryIcon'
import { PriorityScore } from '@/components/issue/PriorityBadge'
import { StatusBadge } from '@/components/issue/StatusBadge'
import { api } from '@/lib/api'
import { CATEGORY_LABELS } from '@/lib/format'
import type { MapIssue } from '@/types'
import { cn } from '@/lib/utils'

export function MapPage() {
  const [issues, setIssues] = useState<MapIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | undefined>(undefined)

  useEffect(() => {
    api
      .getMapIssues()
      .then((res) => setIssues(res.issues))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...issues].sort((a, b) => b.priorityScore - a.priorityScore)

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Civic Issue Map</h1>
      <p className="mt-2 text-muted-foreground">Every tracked issue across Dwarka, color-coded by priority.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="order-2 max-h-[600px] space-y-2 overflow-y-auto lg:order-1">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading map data...
            </div>
          )}
          {!loading &&
            sorted.map((issue) => (
              <Link
                key={issue.id}
                to={`/issues/${issue.id}`}
                onMouseEnter={() => setSelected(issue.id)}
                onMouseLeave={() => setSelected(undefined)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-civic-300 hover:bg-civic-50/50',
                  selected === issue.id && 'border-civic-400 bg-civic-50'
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-civic-50 text-civic-600">
                  <CategoryIcon category={issue.category} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{issue.code}</span>
                    <StatusBadge status={issue.status} />
                  </div>
                  <p className="truncate text-sm font-medium text-foreground">
                    {CATEGORY_LABELS[issue.category]} — {issue.locationName.split(',')[0]}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" /> {issue.reportCount} reports
                  </p>
                </div>
                <PriorityScore score={issue.priorityScore} />
              </Link>
            ))}
        </div>
        <div className="order-1 lg:order-2">
          <IssueMap issues={issues} className="h-[420px] lg:h-[600px]" focusId={selected} />
        </div>
      </div>
    </div>
  )
}
