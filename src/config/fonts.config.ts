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
]

export const FONT_MAP = new Map(FONTS.map(f => [f.id, f]))

export const ALLOWED_FONT_IDS = new Set(FONTS.map(f => f.id))
