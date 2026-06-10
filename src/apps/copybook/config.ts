import type { GridType } from '@copybook/interfaces'

export {
  ALLOWED_FONT_IDS,
  FONT_FAMILIES,
  FONT_MAP,
  FONT_WEIGHTS,
  type FontConfig,
  FONTS,
} from '@/config/font.config'

// ─── 练字内容 ───────────────────────────────────────

/** 默认练习文本 */
export const DEFAULT_TEXT = '你好世界'

// ─── 方格类型 ───────────────────────────────────────

/** 可选的方格类型列表，value 对应 GridType 联合类型 */
export const GRID_TYPES: { label: string, value: GridType }[] = [
  { label: '田字格', value: 'tian' },
  { label: '米字格', value: 'mi' },
  { label: '回宫格', value: 'huigong' },
  { label: '九宫格', value: 'jiugong' },
  { label: '回田格', value: 'huitian' },
  { label: '回米格', value: 'huimi' },
  { label: '作文格', value: 'zuowen' },
]

// ─── 字体选项 ───────────────────────────────────────

// ─── 颜色 ───────────────────────────────────────────

/** 描红/线条颜色选择面板，按色系分组 */
export const COLOR_PALETTE: { name: string, colors: string[] }[] = [
  { name: 'gray', colors: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', 'black'] },
  { name: 'red', colors: ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'] },
  { name: 'orange', colors: ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'] },
  { name: 'green', colors: ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'] },
  { name: 'blue', colors: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'] },
  { name: 'purple', colors: ['#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#581c87'] },
]

// ─── 页面布局 ───────────────────────────────────────

/** 默认页边距（mm） */
export const DEFAULT_MARGIN = { top: 20, right: 20, bottom: 20, left: 20 }

// ─── 默认配置 ───────────────────────────────────────

/**
 * 所有配置项的默认值，用于初始化 store 和重置操作
 *
 * fontSize 为方格尺寸的百分比，offsetY 为垂直偏移百分比
 * traceCount 为每个字符的描红重复次数
 */
export const DEFAULT_CONFIG = {
  text: DEFAULT_TEXT,
  gridType: 'tian' as const,
  gridSize: 14,
  rowGap: 2,
  margin: { ...DEFAULT_MARGIN },
  fontFamily: 'tianyingzhang',
  fontWeight: 'normal',
  fontSize: 68,
  fontOffsetY: 0,
  traceCount: 5,
  traceColor: '#fca5a5',
  lineColor: '#cbd5e1',
  highlightFirst: true,
  insertEmptyRow: false,
  insertEmptyCol: false,
  showPinyin: false,
}

// ─── 导航 ───────────────────────────────────────────

/** 字帖页面顶部导航项 */
export const COPYBOOK_NAV_ITEMS = [
  { label: '← 首页', href: '/' },
  { label: '汉字字帖', href: '/copybook/hanzi' },
]
