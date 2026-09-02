import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Users } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/format'
import { PriorityScore } from '@/components/issue/PriorityBadge'
import { StatusBadge } from '@/components/issue/StatusBadge'
import { Button } from '@/components/ui/button'
import type { MapIssue, PriorityLevel } from '@/types'
import { cn } from '@/lib/utils'

const PRIORITY_COLOR: Record<PriorityLevel, string> = {
  HIGH: '#DC2626',
  MEDIUM: '#F59E0B',
  LOW: '#2563EB',
}

const PRIORITY_COLOR_DARK: Record<PriorityLevel, string> = {
  HIGH: '#7F1D1D',
  MEDIUM: '#92400E',
  LOW: '#1D4ED8',
}

export const DWARKA_CENTER: [number, number] = [28.585, 77.052]

// A stylized "elevated pin" divIcon — gradient teardrop, inset highlight, drop
// shadow, and a soft ground ellipse — so markers read as 3D landmarks rather
// than flat dots. A small badge surfaces the report count for consolidated
// issues, mirroring how a real ops map signals "this one has more reports."
function createPinIcon(level: PriorityLevel, reportCount: number, focused: boolean): L.DivIcon {
  const color = PRIORITY_COLOR[level]
  const dark = PRIORITY_COLOR_DARK[level]
  const badge =
    reportCount > 1
      ? `<div class="civiclens-pin-badge">${reportCount > 9 ? '9+' : reportCount}</div>`
      : ''

  return L.divIcon({
    className: `civiclens-pin-wrap${focused ? ' is-focused' : ''}`,
    html: `
      <div class="civiclens-pin" style="--pin-color:${color}; --pin-color-dark:${dark}">
        <div class="civiclens-pin-inner"></div>
      </div>
      <div class="civiclens-pin-shadow"></div>
      ${badge}
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 40],
    popupAnchor: [0, -40],
  })
}

function FitBounds({ issues }: { issues: MapIssue[] }) {
  const map = useMap()
  useEffect(() => {
    if (issues.length === 0) return
    const bounds = issues.map((i) => [i.latitude, i.longitude] as [number, number])
    if (bounds.length === 1) {
      map.setView(bounds[0], 15, { animate: false })
    } else {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: false })
    }
  }, [issues, map])
  return null
}

export function IssueMap({
  issues,
  className,
  fitToIssues = true,
  focusId,
  interactive = true,
}: {
  issues: MapIssue[]
  className?: string
  fitToIssues?: boolean
  focusId?: string
  interactive?: boolean
}) {
  const icons = useMemo(
    () =>
      new Map(
        issues.map((issue) => [issue.id, createPinIcon(issue.priorityLevel, issue.reportCount, focusId === issue.id)])
      ),
    [issues, focusId]
  )

  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-border', className)}>
      <MapContainer
        center={DWARKA_CENTER}
        zoom={13}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
        attributionControl={interactive}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitToIssues && <FitBounds issues={issues} />}
        {issues.map((issue) => (
          <Marker key={issue.id} position={[issue.latitude, issue.longitude]} icon={icons.get(issue.id)}>
            {interactive && (
              <Popup>
                <div className="min-w-[200px] space-y-2 p-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{issue.code}</span>
                    <StatusBadge status={issue.status} />
                  </div>
                  <h4 className="font-semibold text-foreground leading-snug">
                    {CATEGORY_LABELS[issue.category]} — {issue.locationName.split(',')[0]}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {issue.reportCount} reports
                    </span>
                    <PriorityScore score={issue.priorityScore} />
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/issues/${issue.id}`}>View Issue</Link>
                  </Button>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {interactive && (
        <div className="glass pointer-events-none absolute bottom-4 left-4 z-[400] rounded-lg px-3 py-2 text-xs font-medium text-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_COLOR.HIGH }} /> High
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_COLOR.MEDIUM }} /> Medium
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_COLOR.LOW }} /> Low
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
