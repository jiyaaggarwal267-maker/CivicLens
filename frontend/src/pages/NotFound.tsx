import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <Compass className="h-10 w-10 text-muted-foreground" />
      <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
      <p className="max-w-sm text-muted-foreground">The page you're looking for doesn't exist or may have moved.</p>
      <Button asChild>
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  )
}
