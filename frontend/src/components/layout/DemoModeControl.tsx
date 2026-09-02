import { useState } from 'react'
import { RotateCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'

export function DemoModeControl() {
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    setLoading(true)
    try {
      await api.resetDemo()
      toast.success('Demo scenario loaded', {
        description: 'CIV-042 and the full sample dataset are ready to walk through.',
      })
      window.setTimeout(() => window.location.reload(), 600)
    } catch {
      toast.error('Could not load the demo scenario', { description: 'Check that the CivicLens API is running.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-civic-700 border-civic-200">
          <Sparkles className="h-3.5 w-3.5" />
          Demo Mode
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Presenter controls</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={loading} onSelect={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="font-medium">Load Demo Scenario</span>
            <span className="text-xs text-muted-foreground">Resets to the deterministic CIV-042 walkthrough</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
