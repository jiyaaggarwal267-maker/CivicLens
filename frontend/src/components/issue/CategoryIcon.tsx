import { Construction, Droplets, Lightbulb, Trash2, Waves, CircleDashed, AlertCircle } from 'lucide-react'
import type { Category } from '@/types'
import { cn } from '@/lib/utils'

const ICONS: Record<Category, typeof Construction> = {
  POTHOLE: Construction,
  STREETLIGHT: Lightbulb,
  GARBAGE: Trash2,
  WATER_LEAKAGE: Droplets,
  DAMAGED_FOOTPATH: CircleDashed,
  OPEN_DRAIN: Waves,
  OTHER: AlertCircle,
}

export function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const Icon = ICONS[category] ?? AlertCircle
  return <Icon className={cn('h-4 w-4', className)} />
}
