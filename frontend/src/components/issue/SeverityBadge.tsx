import { Badge } from '@/components/ui/badge'
import type { Severity } from '@/types'
import { cn } from '@/lib/utils'

const SEVERITY_STYLES: Record<Severity, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-red-50 text-red-700',
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <Badge variant="outline" className={cn('border-transparent font-semibold', SEVERITY_STYLES[severity], className)}>
      {severity.charAt(0) + severity.slice(1).toLowerCase()}
    </Badge>
  )
}
