import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, PlusCircle, SearchX } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { IssueCard } from '@/components/issue/IssueCard'
import { api } from '@/lib/api'
import type { IssueStatus, IssueSummary } from '@/types'

const FILTERS: Array<{ value: 'ALL' | IssueStatus; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REOPENED', label: 'Reopened' },
]

export function Issues() {
  const [issues, setIssues] = useState<IssueSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | IssueStatus>('ALL')

  useEffect(() => {
    setLoading(true)
    api
      .listIssues()
      .then((res) => setIssues(res.issues))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => (filter === 'ALL' ? issues : issues.filter((i) => i.status === filter)),
    [issues, filter]
  )

  return (
    <div className="container py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Explore Issues</h1>
          <p className="mt-2 text-muted-foreground">Every civic issue reported by the community, ranked by priority.</p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/report">
            <PlusCircle className="h-4 w-4" /> Report an Issue
          </Link>
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'ALL' | IssueStatus)} className="mt-8">
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-6 space-y-3">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading issues...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            <SearchX className="h-8 w-8" />
            <p className="font-medium">No issues match this filter yet.</p>
          </div>
        )}

        {!loading && filtered.map((issue) => <IssueCard key={issue.id} issue={issue} to={`/issues/${issue.id}`} />)}
      </div>
    </div>
  )
}
