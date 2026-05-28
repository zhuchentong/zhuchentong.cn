import type { GridType, Margin } from '@/interfaces/copybook'
import { atom } from 'nanostores'
import { DEFAULT_MARGIN, DEFAULT_TEXT } from '@/config/copybook.config'

export const copybookText = atom<string>(DEFAULT_TEXT)
export const copybookGridType = atom<GridType>('tian')
export const copybookGridSize = atom<number>(10)
export const copybookRowGap = atom<number>(2)
export const copybookMargin = atom<Margin>({ ...DEFAULT_MARGIN })
export const copybookFontFamily = atom<string>('--font-ma-shan-zheng')
export const copybookFontWeight = atom<string>('normal')
export const copybookFontSize = atom<number>(68)
export const copybookFontOffsetY = atom<number>(0)
export const copybookTraceCount = atom<number>(20)
export const copybookTraceColor = atom<string>('#e2e8f0')
export const copybookLineColor = atom<string>('#94a3b8')
export const copybookHighlightFirst = atom<boolean>(true)
export const copybookInsertEmptyRow = atom<boolean>(false)
export const copybookInsertEmptyCol = atom<boolean>(false)
