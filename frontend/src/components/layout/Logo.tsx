import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2 font-bold text-lg tracking-tight text-foreground', className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-civic-600 text-white shadow-sm">
        <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5">
          <path
            d="M16 6C11.6 6 8 9.4 8 13.6C8 18.9 16 27 16 27C16 27 24 18.9 24 13.6C24 9.4 20.4 6 16 6Z"
            fill="currentColor"
          />
          <circle cx="16" cy="13.5" r="4" className="fill-civic-600" />
        </svg>
      </span>
      CivicLens
    </Link>
  )
}
