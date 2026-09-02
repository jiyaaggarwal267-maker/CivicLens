import { useCallback, useEffect, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

// Drag (or arrow-key, for accessibility) to reveal how much of the "before"
// photo shows through over the "after" photo. Both images are full-size,
// absolutely stacked, and clip-path reveals the top layer — no measured
// widths, so it stays correct across resizes without a ResizeObserver.
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className,
}: {
  beforeSrc: string
  afterSrc: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}) {
  const [percent, setPercent] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPercent(Math.min(100, Math.max(0, pct)))
  }, [])

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragging.current) return
      updateFromClientX(e.clientX)
    }
    const stopDragging = () => {
      dragging.current = false
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', stopDragging)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', stopDragging)
    }
  }, [updateFromClientX])

  return (
    <div
      ref={containerRef}
      className={cn('group relative select-none overflow-hidden rounded-lg', className)}
      onPointerDown={(e) => {
        dragging.current = true
        updateFromClientX(e.clientX)
      }}
    >
      <img src={afterSrc} alt={afterLabel} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <img
        src={beforeSrc}
        alt={beforeLabel}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ clipPath: `inset(0 ${100 - percent}% 0 0)` }}
      />

      <span className="glass absolute left-2 top-2 rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-foreground">
        {beforeLabel}
      </span>
      <span className="glass absolute right-2 top-2 rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-foreground">
        {afterLabel}
      </span>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.15)]" style={{ left: `${percent}%` }} />

      <div
        role="slider"
        tabIndex={0}
        aria-label={`Reveal ${beforeLabel} vs ${afterLabel}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setPercent((p) => Math.max(0, p - 5))
          if (e.key === 'ArrowRight') setPercent((p) => Math.min(100, p + 5))
        }}
        className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-civic-700 shadow-elevated ring-1 ring-inset ring-border transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-civic-500 group-hover:scale-105"
        style={{ left: `${percent}%` }}
      >
        <GripVertical className="h-4 w-4" />
      </div>
    </div>
  )
}
