export interface FontConfig {
  id: string
  label: string
  sourceFile: string
  fallback: string
}

export const FONTS: FontConfig[] = [
  {
    id: 'mashanzheng',
    label: '马善政毛笔楷书',
    sourceFile: 'MaShanZhengMaoBiKaiShu.ttf',
    fallback: 'KaiTi, STKaiti, serif',
  },
  {
    id: 'tianyingzhang',
    label: '田英章楷书',
    sourceFile: 'TianYingZhangKaiShu.ttf',
    fallback: 'KaiTi, STKaiti, serif',
  },
  {
    id: 'pangzhonghua',
    label: '庞中华楷书',
    sourceFile: 'PangZhongHuaKaiShu.ttf',
    fallback: 'KaiTi, STKaiti, serif',
  },
]

export const FONT_MAP = new Map(FONTS.map(f => [f.id, f]))

export const ALLOWED_FONT_IDS = new Set(FONTS.map(f => f.id))

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
