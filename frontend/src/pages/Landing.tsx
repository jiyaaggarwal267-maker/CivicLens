import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Copy,
  Gauge,
  Layers,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IssueMap } from '@/components/map/IssueMap'
import { api } from '@/lib/api'
import { CATEGORY_LABELS } from '@/lib/format'
import type { MapIssue, Stats } from '@/types'

const STEPS = [
  {
    icon: Camera,
    title: 'Citizens report',
    description: 'A photo, a location, a short description — submitted in under a minute from any device.',
  },
  {
    icon: Gauge,
    title: 'AI understands it',
    description: 'Computer vision classifies the issue and assesses severity automatically, no manual triage.',
  },
  {
    icon: Copy,
    title: 'Duplicates consolidate',
    description: 'Nearby reports of the same problem merge into a single civic issue with a clear report count.',
  },
  {
    icon: TrendingUp,
    title: 'Priority is calculated',
    description: 'Severity, report volume, traffic exposure, and age combine into a transparent 0–100 score.',
  },
  {
    icon: Users,
    title: 'Authorities act',
    description: 'The right department is recommended, issues are assigned, and status is tracked to resolution.',
  },
  {
    icon: ShieldCheck,
    title: 'Resolution is verified',
    description: 'Before/after photos are AI-compared, and the reporting citizen confirms the fix in person.',
  },
]

export function Landing() {
  const [mapIssues, setMapIssues] = useState<MapIssue[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.getMapIssues().then((res) => setMapIssues(res.issues)).catch(() => {})
    api.getStats().then(setStats).catch(() => {})
  }, [])

  const topIssue = mapIssues[0]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-civic-50/60 via-white to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(37,99,235,0.15) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, black 40%, transparent 100%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-civic-300/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl"
        />

        <div className="container relative grid grid-cols-1 gap-12 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-civic-200 bg-civic-50 px-3 py-1 text-xs font-semibold text-civic-700">
              <Sparkles className="h-3 w-3" />
              AI-powered civic operations
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              See the problem.
              <br />
              Connect the reports.
              <br />
              <span className="bg-gradient-to-r from-civic-600 to-civic-sky bg-clip-text text-transparent">
                Verify the solution.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              CivicLens transforms fragmented citizen complaints into prioritized, actionable, and verifiable civic
              issues.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="gap-2 shadow-[0_0_0_1px_rgba(37,99,235,0.15),0_10px_24px_-8px_rgba(37,99,235,0.55)] transition-transform hover:-translate-y-0.5 hover:scale-[1.02]"
              >
                <Link to="/report">
                  Report an Issue <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 transition-transform hover:-translate-y-0.5">
                <Link to="/authority">
                  <ShieldCheck className="h-4 w-4" /> Authority Dashboard
                </Link>
              </Button>
            </div>

            {stats && (
              <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6">
                <div>
                  <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Layers className="h-3 w-3" /> Tracked
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-foreground">{stats.total}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <AlertTriangle className="h-3 w-3" /> High priority
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-red-600">{stats.highPriority}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" /> Resolved
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-success">{stats.resolved}</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="map-3d-frame relative">
            {topIssue && (
              <div className="glass absolute -top-6 left-6 z-[401] hidden animate-fade-in rounded-xl px-4 py-3 sm:block">
                <p className="text-xs font-semibold text-muted-foreground">
                  {topIssue.code} · {CATEGORY_LABELS[topIssue.category]}, {topIssue.locationName.split(',')[0]}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-lg font-bold text-red-600">
                  {topIssue.priorityScore}/100
                  <span className="text-xs font-semibold text-red-600">{topIssue.priorityLevel} PRIORITY</span>
                </p>
              </div>
            )}
            <div className="map-3d-frame-inner">
              <IssueMap issues={mapIssues} className="h-[420px] shadow-elevated lg:h-[480px]" interactive={false} />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">One lifecycle, fully connected</h2>
          <p className="mt-3 text-muted-foreground">
            From a citizen's photo to a verified fix — every step is tracked, scored, and auditable.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, idx) => (
            <Card
              key={step.title}
              className="group relative overflow-hidden p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-elevated hover:border-civic-200"
            >
              <span className="absolute right-4 top-4 text-4xl font-extrabold text-slate-100 transition-colors group-hover:text-civic-50">
                {idx + 1}
              </span>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-civic-50 text-civic-600 transition-transform duration-200 group-hover:scale-110 group-hover:bg-civic-600 group-hover:text-white">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-border bg-gradient-to-br from-civic-700 via-civic-700 to-civic-900">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="container relative flex flex-col items-center gap-6 py-16 text-center text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">See something that needs fixing?</h2>
          <p className="max-w-md text-civic-100">
            It takes less than a minute to report, and CivicLens makes sure it doesn't get lost in the noise.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="gap-2 transition-transform hover:-translate-y-0.5 hover:scale-[1.02]"
          >
            <Link to="/report">
              Report an Issue <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
