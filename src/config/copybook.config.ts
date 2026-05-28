import type { GridType } from '@/interfaces/copybook'
import { FONTS } from './fonts.config'

export const DEFAULT_TEXT = '你好世界'

export const GRID_TYPES: { label: string, value: GridType }[] = [
  { label: '田字格', value: 'tian' },
  { label: '米字格', value: 'mi' },
  { label: '回宫格', value: 'huigong' },
  { label: '九宫格', value: 'jiugong' },
  { label: '回田格', value: 'huitian' },
  { label: '回米格', value: 'huimi' },
  { label: '作文格', value: 'zuowen' },
]

export const FONT_FAMILIES = FONTS.map(f => ({
  label: f.label,
  id: f.id,
  fallback: f.fallback,
}))

export const FONT_WEIGHTS = [
  { label: '常规', value: 'normal' },
  { label: '中等', value: '500' },
  { label: '粗体', value: 'bold' },
]

export const COLOR_PALETTE: { name: string, colors: string[] }[] = [
  { name: 'gray', colors: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', 'black'] },
  { name: 'red', colors: ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'] },
  { name: 'orange', colors: ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'] },
  { name: 'green', colors: ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'] },
  { name: 'blue', colors: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'] },
  { name: 'purple', colors: ['#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#581c87'] },
]

export const DEFAULT_MARGIN = { top: 36, right: 36, bottom: 36, left: 36 }

export const COPYBOOK_NAV_ITEMS = [
  { label: '← 首页', href: '/' },
  { label: '汉字字帖', href: '/copybook/hanzi' },
]
