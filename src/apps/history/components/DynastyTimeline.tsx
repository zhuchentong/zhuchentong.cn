import type { Country, Dynasty } from '@history/interfaces'
import { getDomain, MAX_PX_PER_YEAR, MIN_PX_PER_YEAR } from '@history/constants'
import { createTimeScale } from '@history/hooks/useTimeScale'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import CountrySelector from './CountrySelector'
import DynastyBar from './DynastyBar'
import DynastyNav from './DynastyNav'
import TimelineAxis from './TimelineAxis'

/** 时间基线（刻度）的 y 坐标 */
const AXIS_Y = 44
/** 时间轴 SVG 行高（基线贴近底部，刻度/标注在其上方） */
const AXIS_SVG_HEIGHT = 46
/** 单条车道高度（含车道间留白） */
const LANE_HEIGHT = 156
/** 条带在车道内的垂直偏移（居中） */
const LANE_BAR_OFFSET = 8
/** 滚轮缩放灵敏度 */
const WHEEL_SENSITIVITY = 0.0015
/** 默认选中的国家 */
const DEFAULT_SELECTED = ['china']

function clampPx(value: number): number {
  return Math.min(Math.max(value, MIN_PX_PER_YEAR), MAX_PX_PER_YEAR)
}

export interface DynastyTimelineProps {
  countries: Country[]
}

export default function DynastyTimeline({ countries }: DynastyTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 选中的国家（客户端交互状态）
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_SELECTED)
  const visibleCountries = useMemo(
    () => countries.filter(c => selectedIds.includes(c.id)),
    [countries, selectedIds],
  )

  const domain = useMemo(() => getDomain(visibleCountries), [visibleCountries])

  // 缩放独立 state
  const [pxPerYear, setPxPerYear] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  // hover 中的朝代 key（null = 无）；用于把 hovered 条带渲染到最后 = 最顶层
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const handleHover = useCallback((key: string | null) => setHoveredKey(key), [])

  // 供一次性挂载的事件 handler 读取最新值的 ref
  const domainRef = useRef(domain)
  const pxPerYearRef = useRef(pxPerYear)
  useEffect(() => {
    domainRef.current = domain
  }, [domain])
  useEffect(() => {
    pxPerYearRef.current = pxPerYear
  }, [pxPerYear])

  // 滚轮缩放时记录"光标下的年份 + 光标相对容器 x"
  const pendingZoomRef = useRef<{ year: number, cursorX: number } | null>(null)

  const scale = useMemo(() => createTimeScale(domain, pxPerYear), [domain, pxPerYear])

  // 挂载时按容器宽度自适应缩放，使整个时间轴刚好容纳在视口
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el)
      return
    const span = domainRef.current.end - domainRef.current.start
    setPxPerYear(clampPx(el.clientWidth / span))
  }, [])

  // 缩放变化后，把光标下的年份重新对齐到光标位置（避免跳变）
  useLayoutEffect(() => {
    const el = scrollRef.current
    const pending = pendingZoomRef.current
    if (!el || !pending)
      return
    pendingZoomRef.current = null
    const { year, cursorX } = pending
    const maxX = Math.max(0, el.scrollWidth - el.clientWidth)
    const targetX = (year - domainRef.current.start) * pxPerYear - cursorX
    el.scrollLeft = Math.min(Math.max(0, targetX), maxX)
  }, [pxPerYear])

  // 挂载非 passive 滚轮监听（React onWheel 为 passive，无法 preventDefault）
  useEffect(() => {
    const el = scrollRef.current
    if (!el)
      return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const d = domainRef.current
      const current = pxPerYearRef.current
      const yearAtCursor = d.start + (el.scrollLeft + cursorX) / current
      const next = clampPx(current * Math.exp(-e.deltaY * WHEEL_SENSITIVITY))
      pendingZoomRef.current = { year: yearAtCursor, cursorX }
      setPxPerYear(next)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // 拖拽平移（2D：横向 + 纵向），仅鼠标左键；触摸走原生滚动
  const dragStateRef = useRef<{ startX: number, startY: number, scrollX: number, scrollY: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0)
      return
    const el = scrollRef.current
    if (!el)
      return
    dragStateRef.current = { startX: e.clientX, startY: e.clientY, scrollX: el.scrollLeft, scrollY: el.scrollTop }
    el.setPointerCapture(e.pointerId)
    setHoveredKey(null)
    setIsDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current
    const el = scrollRef.current
    if (!st || !el)
      return
    el.scrollLeft = st.scrollX - (e.clientX - st.startX)
    el.scrollTop = st.scrollY - (e.clientY - st.startY)
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current
    const el = scrollRef.current
    if (!st || !el)
      return
    dragStateRef.current = null
    if (el.hasPointerCapture(e.pointerId))
      el.releasePointerCapture(e.pointerId)
    setIsDragging(false)
  }

  // 朝代导航：居中到该朝代中点，不改变缩放
  const navigateTo = useCallback((dynasty: Dynasty) => {
    const el = scrollRef.current
    if (!el)
      return
    const center = (dynasty.start + dynasty.end) / 2
    const maxX = Math.max(0, el.scrollWidth - el.clientWidth)
    const target = Math.min(Math.max(0, scale.x(center) - el.clientWidth / 2), maxX)
    el.scrollTo({ left: target, behavior: 'smooth' })
  }, [scale])

  const totalWidth = scale.totalWidth
  const showNav = visibleCountries.length === 1
  const navDynasties = visibleCountries[0]?.dynasties ?? []

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="shrink-0 space-y-2 border-b border-border bg-background px-4 py-2">
        {showNav && <DynastyNav dynasties={navDynasties} onNavigate={navigateTo} />}
        <div className="flex items-center justify-between gap-2">
          <CountrySelector countries={countries} selectedIds={selectedIds} onChange={setSelectedIds} />
          <p className="text-[11px] text-muted-foreground">滚轮缩放 · 拖拽平移</p>
        </div>
      </div>
      <div
        ref={scrollRef}
        className={`flex-1 select-none overflow-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div style={{ width: totalWidth }}>
          {/* 时间轴：sticky-top，纵向滚动时始终可见 */}
          <div className="sticky top-0 z-30 bg-background">
            <svg width={totalWidth} height={AXIS_SVG_HEIGHT} className="block">
              <TimelineAxis domain={domain} scale={scale} y={AXIS_Y} pxPerYear={pxPerYear} />
            </svg>
          </div>
          {/* 每个国家一条车道：独立 SVG 共享同一 scale，按年份横向对齐 */}
          {visibleCountries.map(country => (
            <div key={country.id} className="relative flex items-center" style={{ height: LANE_HEIGHT, width: totalWidth }}>
              <svg
                className="absolute inset-0 block"
                width={totalWidth}
                height={LANE_HEIGHT}
                style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
              >
                {country.dynasties.map((dynasty, i) => {
                  const barKey = `${country.id}-${dynasty.name}-${dynasty.start}`
                  if (barKey === hoveredKey)
                    return null
                  return (
                    <DynastyBar
                      key={barKey}
                      dynasty={dynasty}
                      level={1}
                      colorIndex={i}
                      scale={scale}
                      laneTop={LANE_BAR_OFFSET}
                      rootKey={barKey}
                      onHoverChange={handleHover}
                    />
                  )
                })}
                {country.dynasties.map((dynasty, i) => {
                  const barKey = `${country.id}-${dynasty.name}-${dynasty.start}`
                  if (barKey !== hoveredKey)
                    return null
                  return (
                    <DynastyBar
                      key={barKey}
                      dynasty={dynasty}
                      level={1}
                      colorIndex={i}
                      scale={scale}
                      laneTop={LANE_BAR_OFFSET}
                      isHovered
                      rootKey={barKey}
                      onHoverChange={handleHover}
                    />
                  )
                })}
              </svg>
              {/* 国名标签：sticky-left，横向滚动时钉在左侧 */}
              <div className="sticky left-0 z-20 ml-1 flex items-center gap-1.5 rounded bg-background/95 px-2 py-1 text-xs font-medium shadow-sm ring-1 ring-border backdrop-blur-sm">
                <span
                  className="inline-block size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: country.accent }}
                />
                {country.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
