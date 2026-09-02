import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertCircle, ArrowLeft, Building2, Clock, Loader2, MapPin, RefreshCw, ThumbsDown, ThumbsUp, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/issue/StatusBadge'
import { PriorityBadge, PriorityScore } from '@/components/issue/PriorityBadge'
import { SeverityBadge } from '@/components/issue/SeverityBadge'
import { CategoryIcon } from '@/components/issue/CategoryIcon'
import { Timeline } from '@/components/issue/Timeline'
import { LifecycleStages } from '@/components/issue/LifecycleStages'
import { BeforeAfterSlider } from '@/components/issue/BeforeAfterSlider'
import { IssueMap } from '@/components/map/IssueMap'
import { api, ApiClientError } from '@/lib/api'
import { CATEGORY_LABELS, DEPARTMENT_LABELS, VERIFICATION_LABELS, formatRelativeAge } from '@/lib/format'
import type { IssueDetail as IssueDetailType } from '@/types'
import { cn } from '@/lib/utils'

export function IssueDetail() {
  const { id } = useParams<{ id: string }>()
  const [issue, setIssue] = useState<IssueDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    api
      .getIssue(id)
      .then((res) => setIssue(res.issue))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleFeedback = async (resolved: boolean) => {
    if (!id) return
    setSubmittingFeedback(true)
    try {
      await api.submitFeedback(id, resolved)
      if (resolved) {
        toast.success('Thank you for verifying this issue.')
      } else {
        toast.warning('Issue reopened.', { description: 'This will go back to the authority for another look.' })
      }
      load()
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not submit feedback. Please try again.')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading issue...
      </div>
    )
  }

  if (notFound || !issue) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Issue not found</h1>
        <Button asChild variant="outline">
          <Link to="/issues">Back to Explore Issues</Link>
        </Button>
      </div>
    )
  }

  const heroImage = issue.reports[0]?.imageUrl
  const latestResolution = issue.resolutions[0]
  const showFeedbackPrompt = issue.status === 'RESOLVED' && issue.feedbacks.length === 0

  return (
    <div className="container max-w-5xl py-10">
      <Link to="/issues" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Explore Issues
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-muted-foreground">{issue.code}</span>
            <StatusBadge status={issue.status} />
          </div>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
            <CategoryIcon category={issue.category} className="h-7 w-7 text-civic-600" />
            {CATEGORY_LABELS[issue.category]}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-4 w-4" /> {issue.locationName}
          </p>
        </div>
        <PriorityBadge level={issue.priorityLevel} />
      </div>

      <Card className="mt-6 p-4">
        <LifecycleStages issue={issue} />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {heroImage && (
            <Card className="overflow-hidden">
              <img src={heroImage} alt={`Reported ${CATEGORY_LABELS[issue.category]}`} className="h-72 w-full object-cover sm:h-96" />
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <IssueMap
                issues={[
                  {
                    id: issue.id,
                    code: issue.code,
                    title: issue.title,
                    category: issue.category,
                    severity: issue.severity,
                    status: issue.status,
                    priorityScore: issue.priorityScore,
                    priorityLevel: issue.priorityLevel,
                    latitude: issue.latitude,
                    longitude: issue.longitude,
                    locationName: issue.locationName,
                    reportCount: issue.reportCount,
                  },
                ]}
                className="h-64"
              />
            </CardContent>
          </Card>

          {latestResolution && (
            <Card>
              <CardHeader>
                <CardTitle>Resolution Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BeforeAfterSlider
                  beforeSrc={latestResolution.beforeImageUrl}
                  afterSrc={latestResolution.afterImageUrl}
                  className="h-64 border border-border sm:h-80"
                />
                <p className="text-center text-xs text-muted-foreground">Drag to compare the citizen's photo against the repair.</p>
                <div
                  className={cn(
                    'rounded-lg border p-4',
                    latestResolution.verificationStatus === 'LIKELY_RESOLVED' && 'border-green-200 bg-green-50',
                    latestResolution.verificationStatus === 'UNCLEAR' && 'border-amber-200 bg-amber-50',
                    latestResolution.verificationStatus === 'NOT_RESOLVED' && 'border-red-200 bg-red-50',
                    latestResolution.verificationStatus === 'PENDING' && 'border-border bg-secondary/50'
                  )}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI-assisted verification</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {VERIFICATION_LABELS[latestResolution.verificationStatus]}
                    {latestResolution.verificationStatus === 'LIKELY_RESOLVED' && ' ✓'}
                  </p>
                  {latestResolution.verificationStatus !== 'PENDING' && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {Math.round(latestResolution.verificationConfidence * 100)}% confidence — {latestResolution.verificationNotes}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    AI-assisted verification compares before/after photos and is not a guaranteed outcome — citizen confirmation below is
                    the final word.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {showFeedbackPrompt && (
            <Card className="border-civic-200 bg-civic-50/50">
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-bold text-foreground">Was the issue actually resolved?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your feedback helps ensure reported issues are genuinely fixed.</p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    variant="success"
                    className="gap-2"
                    disabled={submittingFeedback}
                    onClick={() => handleFeedback(true)}
                  >
                    <ThumbsUp className="h-4 w-4" /> Yes, resolved ✓
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                    disabled={submittingFeedback}
                    onClick={() => handleFeedback(false)}
                  >
                    <ThumbsDown className="h-4 w-4" /> No, issue remains ↻
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!showFeedbackPrompt && issue.feedbacks.length > 0 && issue.status === 'RESOLVED' && (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="flex items-center gap-3 p-6">
                <ThumbsUp className="h-6 w-6 text-success" />
                <p className="font-semibold text-foreground">Thank you for verifying this issue.</p>
              </CardContent>
            </Card>
          )}

          {issue.status === 'REOPENED' && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="flex items-center gap-3 p-6">
                <RefreshCw className="h-6 w-6 text-destructive" />
                <div>
                  <p className="font-semibold text-foreground">Issue reopened</p>
                  <p className="text-sm text-muted-foreground">The authority has been notified and will take another look.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Citizen Reports ({issue.reports.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {issue.reports.map((report) => (
                <div key={report.id} className="flex gap-3 rounded-lg border border-border p-3">
                  <img src={report.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{report.reporterName}</p>
                      <span className="text-xs text-muted-foreground">{formatRelativeAge(report.createdAt)} ago</span>
                    </div>
                    {report.description && <p className="mt-0.5 truncate text-sm text-muted-foreground">{report.description}</p>}
                    <div className="mt-1 flex items-center gap-2">
                      <SeverityBadge severity={report.aiSeverity} className="text-[0.65rem]" />
                      <span className="text-xs text-muted-foreground">{Math.round(report.aiConfidence * 100)}% AI confidence</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={issue.events} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Priority Score</CardTitle>
            </CardHeader>
            <CardContent>
              <PriorityScore score={issue.priorityScore} className="text-4xl" />
              <Separator className="my-4" />
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Reports</dt>
                  <dd className="flex items-center gap-1 font-medium">
                    <Users className="h-3.5 w-3.5" /> {issue.reportCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Severity</dt>
                  <dd>
                    <SeverityBadge severity={issue.severity} />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Age</dt>
                  <dd className="flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5" /> {formatRelativeAge(issue.createdAt)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Traffic exposure</dt>
                  <dd className="font-medium">{issue.trafficExposure.charAt(0) + issue.trafficExposure.slice(1).toLowerCase()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {issue.department && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Department</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <p className="font-semibold text-foreground">{DEPARTMENT_LABELS[issue.department]}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
