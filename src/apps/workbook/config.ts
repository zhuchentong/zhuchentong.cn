import type { Margin } from './interfaces'

export const WORKBOOK_NAV_ITEMS = [
  { label: '← 首页', href: '/' },
  { label: '拼音练习', href: '/workbook/pinyin' },
]

export interface InitialGroup {
  id: string
  title: string
  initials: string[]
}

export interface FinalGroup {
  id: string
  title: string
  finals: string[]
}

export const INITIAL_GROUPS: InitialGroup[] = [
  { id: 's1', title: 'b p m f', initials: ['b', 'p', 'm', 'f'] },
  { id: 's2', title: 'd t n l', initials: ['d', 't', 'n', 'l'] },
  { id: 's3', title: 'g k h', initials: ['g', 'k', 'h'] },
  { id: 's4', title: 'j q x', initials: ['j', 'q', 'x'] },
  { id: 's5', title: 'zh ch sh r', initials: ['zh', 'ch', 'sh', 'r'] },
  { id: 's6', title: 'z c s', initials: ['z', 'c', 's'] },
]

export const FINAL_GROUPS: FinalGroup[] = [
  { id: 'y1', title: 'a o e', finals: ['a', 'o', 'e'] },
  { id: 'y2', title: 'i u ü', finals: ['i', 'u', 'ü'] },
  { id: 'y3', title: 'ai ei ui', finals: ['ai', 'ei', 'ui'] },
  { id: 'y4', title: 'ao ou iu', finals: ['ao', 'ou', 'iu'] },
  { id: 'y5', title: 'ie üe er', finals: ['ie', 'üe', 'er'] },
  { id: 'y6', title: 'an en in un ün üan', finals: ['an', 'en', 'in', 'un', 'ün', 'üan'] },
  { id: 'y7', title: 'ang eng ing ong', finals: ['ang', 'eng', 'ing', 'ong'] },
]

export const DEFAULT_INITIALS: string[] = []
export const DEFAULT_FINALS = ['a', 'o', 'e']

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
  initials: [] as string[],
  finals: ['a', 'o', 'e'] as string[],
  questionCount: 24,
  answerMode: 'hide-keyword' as const,
  highlightEnabled: true,
  highlightColor: '#000000',
  gridSize: 17,
  questionGap: 2,
  margin: { ...DEFAULT_MARGIN },
  lineColor: '#cbd5e1',
  answerColor: '#ef4444',
  fontFamily: 'tianyingzhang',
  fontWeight: 'normal',
  fontSize: 68,
  fontColor: '#000000',
  seed: Date.now(),
}
