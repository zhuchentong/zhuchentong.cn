import type { TimeDomain, TimeScale } from '../hooks/useTimeScale'

const NICE_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000]

/** 根据缩放密度选择"好看"的刻度间隔，使刻度间距约 110px */
function niceTickInterval(pxPerYear: number): number {
  const targetYears = 110 / pxPerYear
  for (const step of NICE_STEPS) {
    if (step >= targetYears)
      return step
  }
  return 5000
}

function formatYear(year: number): string {
  if (year < 0)
    return `公元前${Math.abs(year)}`
  if (year === 0)
    return '公元元年'
  return `${year}`
}

export interface TimelineAxisProps {
  domain: TimeDomain
  scale: TimeScale
  /** 基线 y 坐标 */
  y: number
  pxPerYear: number
}

export default function TimelineAxis({ domain, scale, y, pxPerYear }: TimelineAxisProps) {
  const interval = niceTickInterval(pxPerYear)
  const first = Math.ceil(domain.start / interval) * interval

  const ticks: number[] = []
  for (let year = first; year <= domain.end; year += interval) {
    ticks.push(year)
  }

  return (
    <g>
      <line
        x1={0}
        y1={y}
        x2={scale.totalWidth}
        y2={y}
        stroke="var(--border)"
        strokeWidth={1}
      />
      {ticks.map((year) => {
        const tx = scale.x(year)
        return (
          <g key={year}>
            <line
              x1={tx}
              y1={y}
              x2={tx}
              y2={y - 6}
              stroke="var(--muted-foreground)"
              strokeWidth={1}
            />
            <text
              x={tx}
              y={y - 10}
              textAnchor="middle"
              fontSize={11}
              fill="var(--muted-foreground)"
            >
              {formatYear(year)}
            </text>
          </g>
        )
      })}
    </g>
  )
}
