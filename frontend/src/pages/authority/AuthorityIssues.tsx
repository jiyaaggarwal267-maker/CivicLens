import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/issue/StatusBadge'
import { SeverityBadge } from '@/components/issue/SeverityBadge'
import { PriorityScore } from '@/components/issue/PriorityBadge'
import { CategoryIcon } from '@/components/issue/CategoryIcon'
import { api } from '@/lib/api'
import { CATEGORY_LABELS, DEPARTMENT_LABELS } from '@/lib/format'
import type { IssueStatus, IssueSummary } from '@/types'

const FILTERS: Array<{ value: 'ALL' | IssueStatus; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REOPENED', label: 'Reopened' },
]

export function AuthorityIssues() {
  const [issues, setIssues] = useState<IssueSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | IssueStatus>('ALL')
  const navigate = useNavigate()

  useEffect(() => {
    api
      .listIssues()
      .then((res) => setIssues(res.issues))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => (filter === 'ALL' ? issues : issues.filter((i) => i.status === filter)), [issues, filter])

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Issues</h1>
      <p className="mt-1 text-muted-foreground">Full list of civic issues tracked by CivicLens.</p>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'ALL' | IssueStatus)} className="mt-6">
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="mt-4">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading issues...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((issue) => (
                  <TableRow key={issue.id} className="cursor-pointer" onClick={() => navigate(`/authority/issues/${issue.id}`)}>
                    <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{issue.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={issue.category} className="h-4 w-4 text-civic-600" />
                        <span className="font-medium text-foreground">{CATEGORY_LABELS[issue.category]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{issue.locationName.split(',')[0]}</TableCell>
                    <TableCell>{issue.reportCount}</TableCell>
                    <TableCell>
                      <SeverityBadge severity={issue.severity} />
                    </TableCell>
                    <TableCell>
                      <PriorityScore score={issue.priorityScore} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {issue.department ? DEPARTMENT_LABELS[issue.department] : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={issue.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
