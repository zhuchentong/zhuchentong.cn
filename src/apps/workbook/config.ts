import type { Chapter, Margin } from './interfaces'

export const WORKBOOK_NAV_ITEMS = [
  { label: '← 首页', href: '/' },
  { label: '拼音练习', href: '/workbook/pinyin' },
]

export const CHAPTERS: Chapter[] = [
  { id: 1, title: 'a o e i u ü' },
  { id: 2, title: 'b p m f' },
  { id: 3, title: 'd t n l' },
  { id: 4, title: 'g k h' },
  { id: 5, title: 'j q x' },
  { id: 6, title: 'zh ch sh r' },
  { id: 7, title: 'z c s' },
  { id: 8, title: 'ai ei ao ou' },
  { id: 9, title: 'ia ie ua uo üe' },
  { id: 10, title: 'iao iu uai ui' },
  { id: 11, title: 'an en in un ün' },
  { id: 12, title: 'ang eng ing ong' },
]

export const COLOR_PALETTE = [
  { name: 'gray', colors: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', 'black'] },
  { name: 'red', colors: ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'] },
  { name: 'orange', colors: ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'] },
  { name: 'green', colors: ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'] },
  { name: 'blue', colors: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'] },
  { name: 'purple', colors: ['#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#581c87'] },
]

export const DEFAULT_MARGIN: Margin = { top: 20, right: 20, bottom: 20, left: 20 }

export const DEFAULT_PINYIN_CONFIG = {
  chapter: 1,
  questionCount: 24,
  answerMode: 'hide-keyword' as const,
  highlightEnabled: true,
  highlightColor: '#000000',
  gridSize: 17,
  questionGap: 2,
  margin: { ...DEFAULT_MARGIN },
  lineColor: '#cbd5e1',
  answerColor: '#ef4444',
  fontFamily: 'serif',
  fontWeight: 'normal',
  fontSize: 68,
  fontColor: '#000000',
  seed: Date.now(),
}
