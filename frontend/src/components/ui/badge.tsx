import * as React from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-civic-600 text-white',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground bg-white',
        success: 'border-transparent bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
        warning: 'border-transparent bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
        destructive: 'border-transparent bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
        info: 'border-transparent bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
