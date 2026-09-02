import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CircleUserRound, Loader2, MapPin, Navigation, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { UploadDropzone } from '@/components/report/UploadDropzone'
import { LocationPicker } from '@/components/report/LocationPicker'
import { SeverityBadge } from '@/components/issue/SeverityBadge'
import { CategoryIcon } from '@/components/issue/CategoryIcon'
import { useRole } from '@/context/RoleContext'
import { api, ApiClientError } from '@/lib/api'
import { CATEGORY_LABELS } from '@/lib/format'
import type { CreateReportResponse } from '@/types'
import { cn } from '@/lib/utils'

const DWARKA_SECTOR_10 = { lat: 28.5921, lng: 77.046, name: 'Dwarka Sector 10, New Delhi' }

const PROCESSING_STEPS = ['Image analyzed', 'Issue classified', 'Location identified', 'Duplicate check completed']

export function Report() {
  const { citizenSession } = useRole()
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [latitude, setLatitude] = useState(DWARKA_SECTOR_10.lat)
  const [longitude, setLongitude] = useState(DWARKA_SECTOR_10.lng)
  const [locationName, setLocationName] = useState(DWARKA_SECTOR_10.name)

  const [submitting, setSubmitting] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [result, setResult] = useState<CreateReportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const stepTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (stepTimer.current) window.clearInterval(stepTimer.current)
    }
  }, [])

  const useDwarka = () => {
    setLatitude(DWARKA_SECTOR_10.lat)
    setLongitude(DWARKA_SECTOR_10.lng)
    setLocationName(DWARKA_SECTOR_10.name)
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not available on this device.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setLocationName('Current location')
      },
      () => toast.error('Could not access your location. Try the map or Dwarka preset instead.')
    )
  }

  const resetForm = () => {
    setFile(null)
    setDescription('')
    setReporterName('')
    setResult(null)
    setError(null)
    setVisibleSteps(0)
  }

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please upload a photo of the issue first.')
      return
    }
    setSubmitting(true)
    setError(null)
    setResult(null)
    setVisibleSteps(0)

    stepTimer.current = window.setInterval(() => {
      setVisibleSteps((prev) => (prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev))
    }, 350)

    try {
      const response = await api.submitReport({
        image: file,
        description: description || undefined,
        latitude,
        longitude,
        locationName,
        reporterName: citizenSession?.name || reporterName || undefined,
      })
      setVisibleSteps(PROCESSING_STEPS.length)
      await new Promise((r) => setTimeout(r, 300))
      setResult(response)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'AI analysis unavailable — please try again.')
    } finally {
      if (stepTimer.current) window.clearInterval(stepTimer.current)
      setSubmitting(false)
    }
  }

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Report a Civic Issue</h1>
      <p className="mt-2 text-muted-foreground">Help your community report problems that need attention.</p>

      {!result && (
        <Card className="mt-8">
          <CardContent className="space-y-8 p-6">
            <div>
              <Label className="mb-2 block">Upload Evidence</Label>
              <UploadDropzone file={file} onChange={setFile} />
            </div>

            <div>
              <Label className="mb-2 block">Location</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Dwarka Sector 10"
                  className="max-w-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={useDwarka} className="gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Use Dwarka Sector 10
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={useMyLocation} className="gap-1.5">
                  <Navigation className="h-3.5 w-3.5" /> Use my location
                </Button>
              </div>
              <div className="mt-3">
                <LocationPicker latitude={latitude} longitude={longitude} onChange={(lat, lng) => {
                  setLatitude(lat)
                  setLongitude(lng)
                }} />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Click the map or drag the pin to fine-tune the exact spot.</p>
            </div>

            <div>
              <Label htmlFor="description" className="mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what happened..."
                rows={4}
              />
            </div>

            {citizenSession ? (
              <div className="flex items-center gap-2 rounded-lg border border-civic-200 bg-civic-50/60 px-3 py-2 text-sm text-civic-700">
                <CircleUserRound className="h-4 w-4" />
                Reporting as <span className="font-semibold">{citizenSession.name}</span>
              </div>
            ) : (
              <div>
                <Label htmlFor="reporterName" className="mb-2 block">
                  Your name <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="reporterName"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="max-w-xs"
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {submitting ? (
              <div className="rounded-lg border border-civic-200 bg-civic-50/60 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-civic-700">
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing report...
                </p>
                <ul className="mt-3 space-y-1.5">
                  {PROCESSING_STEPS.map((step, idx) => (
                    <li
                      key={step}
                      className={cn(
                        'flex items-center gap-2 text-sm transition-opacity duration-200',
                        idx <= visibleSteps ? 'opacity-100 text-foreground' : 'opacity-30 text-muted-foreground'
                      )}
                    >
                      {idx < visibleSteps ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : idx === visibleSteps ? (
                        <Loader2 className="h-4 w-4 animate-spin text-civic-600" />
                      ) : (
                        <span className="h-4 w-4" />
                      )}
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Button size="lg" className="w-full gap-2" onClick={handleSubmit}>
                <Sparkles className="h-4 w-4" />
                Analyze & Submit Report
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="mt-8 animate-slide-up space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-civic-700">
                <Sparkles className="h-4 w-4" /> CivicLens Analysis
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-civic-50 text-civic-600">
                    <CategoryIcon category={result.classification.category} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Issue</p>
                    <p className="font-semibold text-foreground">{CATEGORY_LABELS[result.classification.category]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <SeverityBadge severity={result.classification.severity} className="text-sm" />
                  <div>
                    <p className="text-xs text-muted-foreground">Severity</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">AI Confidence</p>
                  <p className="font-semibold text-foreground">{Math.round(result.classification.confidence * 100)}%</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-semibold text-foreground">{result.issue.locationName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn('overflow-hidden', result.isDuplicate ? 'border-civic-300 bg-civic-50/40' : 'border-green-200 bg-green-50/40')}>
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-foreground">Duplicate Check</p>
              {result.isDuplicate ? (
                <div className="mt-2">
                  <p className="text-lg font-bold text-civic-700">Duplicate detected</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {result.reportCount} citizen reports consolidated into{' '}
                    <span className="font-mono font-semibold text-foreground">{result.issue.code}</span>
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-lg font-bold text-success">No duplicate found</p>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={`/issues/${result.issue.id}`}>View Issue {result.issue.code}</Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={resetForm}>
              <RefreshCw className="h-4 w-4" /> Report Another Issue
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
