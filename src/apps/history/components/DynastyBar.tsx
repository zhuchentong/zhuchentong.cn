import type { Dynasty } from '@history/interfaces'
import type { TimeScale } from '../hooks/useTimeScale'

/** 各层级条带高度（level 1 主朝代 / level 2 子朝代），单位 px */
const LV_HEIGHT = [140, 56]

/** 条带宽度小于此值则默认隐藏文字（hover 时仍显示），避免重叠 */
const MIN_LABEL_WIDTH = 28

export interface DynastyBarProps {
  dynasty: Dynasty
  /** 层级，1 = 主朝代，2 = 子朝代 */
  level: number
  /** 配色板索引（子朝代继承父朝代，保持同色系） */
  colorIndex: number
  scale: TimeScale
  /** 当前车道顶部 y 坐标 */
  laneTop: number
  /** 是否处于 hover 高亮态（子朝代随父朝代一起高亮） */
  isHovered?: boolean
  /** 顶层朝代的 hover 标识（仅顶层 g 的鼠标事件使用） */
  rootKey?: string
  /** hover 变化回调；仅顶层传入，子朝代传 undefined（靠嵌套继承父级 hover） */
  onHoverChange?: (key: string | null) => void
}

export default function DynastyBar({
  dynasty,
  level,
  colorIndex,
  scale,
  laneTop,
  isHovered = false,
  rootKey,
  onHoverChange,
}: DynastyBarProps) {
  const height = LV_HEIGHT[level - 1] ?? LV_HEIGHT[0]
  // 父条从车道顶部起；子条贴底（覆盖父条下部），形成"父子堆叠"
  const y = level === 1 ? laneTop : laneTop + LV_HEIGHT[0] - LV_HEIGHT[1]
  const x = scale.x(dynasty.start)
  const width = Math.max(1, scale.width(dynasty.start, dynasty.end))

  const paletteSize = 12
  const fill = `var(--dynasty-${colorIndex % paletteSize})`
  // 方案 B：基础半透明使重叠期混色透出；hover 时提到满透明
  const baseOpacity = level === 1 ? 0.65 : 0.5
  const fillOpacity = isHovered ? 1 : baseOpacity
  const showLabel = isHovered || width >= MIN_LABEL_WIDTH
  const labelY = level === 1 ? y + 26 : y + height / 2 + 5
  const labelSize = isHovered ? 16 : 14
  const labelWeight = isHovered ? 700 : level === 1 ? 600 : 500
  const stroke = isHovered ? 'white' : 'var(--background)'
  const strokeWidth = isHovered ? 2.5 : 1

  // 鼠标事件仅顶层 g 绑定（onHoverChange 由顶层传入；子朝代为 undefined）
  const hoverHandlers = onHoverChange
    ? {
        onMouseEnter: () => onHoverChange(rootKey ?? null),
        onMouseLeave: () => onHoverChange(null),
      }
    : {}

  return (
    <g {...hoverHandlers}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        rx={2}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={labelY}
          textAnchor="middle"
          fontSize={labelSize}
          fill="white"
          fontWeight={labelWeight}
          style={{ pointerEvents: 'none' }}
        >
          {dynasty.name}
        </text>
      )}
      {dynasty.child?.map(child => (
        <DynastyBar
          key={`${child.name}-${child.start}`}
          dynasty={child}
          level={level + 1}
          colorIndex={colorIndex}
          scale={scale}
          laneTop={laneTop}
          isHovered={isHovered}
        />
      ))}
    </g>
  )
}
