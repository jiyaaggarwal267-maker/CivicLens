// Minimal dependency-free SVG donut chart. Deliberately hand-rolled (no charting
// library) to keep the bundle small and every color under direct brand control.
export interface DonutDatum {
  label: string
  value: number
  color: string
}

export function DonutChart({
  data,
  size = 168,
  thickness = 22,
  centerLabel,
}: {
  data: DonutDatum[]
  size?: number
  thickness?: number
  centerLabel?: string
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const visible = data.filter((d) => d.value > 0)
  let cumulative = 0

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={thickness} />
          {total > 0 &&
            visible.map((d) => {
              const fraction = d.value / total
              const dash = fraction * circumference
              const dashOffset = -cumulative
              cumulative += dash
              return (
                <circle
                  key={d.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap={visible.length > 1 ? 'butt' : 'round'}
                  className="transition-[stroke-dasharray] duration-700 ease-out"
                />
              )
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{total}</span>
          {centerLabel && <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">{centerLabel}</span>}
        </div>
      </div>

      <ul className="flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-foreground">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
              {d.label}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {d.value}
              <span className="ml-1 font-normal text-muted-foreground">
                ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
