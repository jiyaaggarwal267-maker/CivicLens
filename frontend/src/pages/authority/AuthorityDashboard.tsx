import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, FolderOpen, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/issue/StatusBadge'
import { SeverityBadge } from '@/components/issue/SeverityBadge'
import { PriorityScore } from '@/components/issue/PriorityBadge'
import { CategoryIcon } from '@/components/issue/CategoryIcon'
import { DonutChart } from '@/components/charts/DonutChart'
import { api } from '@/lib/api'
import { CATEGORY_LABELS, DEPARTMENT_LABELS, STATUS_LABELS } from '@/lib/format'
import type { IssueStatus, IssueSummary, Stats } from '@/types'

const STATUS_CHART_COLORS: Record<IssueStatus, string> = {
  OPEN: '#2563EB',
  ASSIGNED: '#6366F1',
  IN_PROGRESS: '#F59E0B',
  RESOLVED: '#16A34A',
  REOPENED: '#DC2626',
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const OVERVIEW_CARDS = [
  { key: 'openIssues' as const, label: 'Open Issues', icon: FolderOpen, tone: 'text-civic-600 bg-civic-50' },
  { key: 'highPriority' as const, label: 'High Priority', icon: AlertTriangle, tone: 'text-red-600 bg-red-50' },
  { key: 'inProgress' as const, label: 'In Progress', icon: Clock, tone: 'text-amber-600 bg-amber-50' },
  { key: 'resolved' as const, label: 'Resolved', icon: CheckCircle2, tone: 'text-success bg-green-50' },
]

export function AuthorityDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [issues, setIssues] = useState<IssueSummary[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api.getStats(), api.listIssues()])
      .then(([statsRes, issuesRes]) => {
        setStats(statsRes)
        setIssues(issuesRes.issues)
      })
      .finally(() => setLoading(false))
  }, [])

  const priorityIssues = issues.filter((i) => i.status !== 'RESOLVED').slice(0, 8)

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">{greeting()}, Authority</h1>
      <p className="mt-1 text-muted-foreground">Here's what needs attention across the city today.</p>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading dashboard...
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OVERVIEW_CARDS.map((card) => (
              <Card key={card.key}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{stats?.[card.key] ?? 0}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.tone}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Priority Issues</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead className="hidden md:table-cell">Reports</TableHead>
                      <TableHead className="hidden md:table-cell">Severity</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="hidden lg:table-cell">Department</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priorityIssues.map((issue) => (
                      <TableRow
                        key={issue.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/authority/issues/${issue.id}`)}
                      >
                        <TableCell className="font-mono text-xs font-semibold text-muted-foreground">{issue.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CategoryIcon category={issue.category} className="h-4 w-4 text-civic-600" />
                            <div>
                              <p className="font-medium text-foreground">{CATEGORY_LABELS[issue.category]}</p>
                              <p className="text-xs text-muted-foreground">{issue.locationName.split(',')[0]}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{issue.reportCount}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <SeverityBadge severity={issue.severity} />
                        </TableCell>
                        <TableCell>
                          <PriorityScore score={issue.priorityScore} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {issue.department ? DEPARTMENT_LABELS[issue.department] : '—'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={issue.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <DonutChart
                    centerLabel="Issues"
                    data={
                      stats?.byStatus.map((row) => ({
                        label: STATUS_LABELS[row.status],
                        value: row.count,
                        color: STATUS_CHART_COLORS[row.status],
                      })) ?? []
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Issues by Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats?.byCategory
                    .sort((a, b) => b.count - a.count)
                    .map((row) => {
                      const max = Math.max(...(stats?.byCategory.map((r) => r.count) ?? [1]))
                      return (
                        <div key={row.category}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">{CATEGORY_LABELS[row.category]}</span>
                            <span className="text-muted-foreground">{row.count}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-secondary">
                            <div
                              className="h-1.5 rounded-full bg-civic-600"
                              style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resolution Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-success">{stats?.resolutionRate ?? 0}%</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stats?.resolved ?? 0} of {stats?.total ?? 0} tracked issues resolved
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
