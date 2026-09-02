import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, FileText, Loader2, LogOut, PlusCircle, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/issue/StatusBadge'
import { PriorityScore } from '@/components/issue/PriorityBadge'
import { CategoryIcon } from '@/components/issue/CategoryIcon'
import { useRole } from '@/context/RoleContext'
import { api } from '@/lib/api'
import { CATEGORY_LABELS, formatRelativeAge } from '@/lib/format'
import type { ReportWithIssue } from '@/types'

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function CitizenDashboard() {
  const { citizenSession, logoutCitizen } = useRole()
  const [reports, setReports] = useState<ReportWithIssue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!citizenSession) return
    api
      .getMyReports(citizenSession.name)
      .then((res) => setReports(res.reports))
      .finally(() => setLoading(false))
  }, [citizenSession])

  const stats = useMemo(() => {
    const uniqueIssues = new Map(reports.map((r) => [r.issue.id, r.issue]))
    const issues = [...uniqueIssues.values()]
    return {
      totalReports: reports.length,
      issuesContributed: issues.length,
      resolved: issues.filter((i) => i.status === 'RESOLVED').length,
      active: issues.filter((i) => i.status !== 'RESOLVED').length,
    }
  }, [reports])

  if (!citizenSession) return null

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border border-civic-100">
            <AvatarFallback className="text-lg">{initials(citizenSession.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-civic-500" /> Welcome back
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{citizenSession.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild className="gap-2">
            <Link to="/report">
              <PlusCircle className="h-4 w-4" /> Report an Issue
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" onClick={logoutCitizen}>
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Reports Submitted', value: stats.totalReports, icon: FileText, tone: 'text-civic-600 bg-civic-50' },
          { label: 'Issues Contributed', value: stats.issuesContributed, icon: Sparkles, tone: 'text-civic-600 bg-civic-50' },
          { label: 'Active', value: stats.active, icon: Clock, tone: 'text-amber-600 bg-amber-50' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, tone: 'text-success bg-green-50' },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}>
                <card.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-foreground">My Reports</h2>
      <div className="mt-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading your reports...
          </div>
        )}

        {!loading && reports.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-foreground">You haven't reported anything yet.</p>
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/report">
                  <PlusCircle className="h-3.5 w-3.5" /> Report your first issue
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading &&
          reports.map((report) => (
            <Link key={report.id} to={`/issues/${report.issue.id}`}>
              <Card className="flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-elevated">
                <img src={report.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{report.issue.code}</span>
                    <StatusBadge status={report.issue.status} />
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate font-medium text-foreground">
                    <CategoryIcon category={report.aiCategory} className="h-3.5 w-3.5 text-civic-600" />
                    {CATEGORY_LABELS[report.aiCategory]} — {report.issue.locationName.split(',')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">Reported {formatRelativeAge(report.createdAt)} ago</p>
                </div>
                <PriorityScore score={report.issue.priorityScore} />
              </Card>
            </Link>
          ))}
      </div>
    </div>
  )
}
