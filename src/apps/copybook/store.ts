import type { GridType, Margin } from '@copybook/interfaces'
import { DEFAULT_MARGIN, DEFAULT_TEXT } from '@copybook/config'
import { atom } from 'nanostores'

export const copybookText = atom<string>(DEFAULT_TEXT)
export const copybookGridType = atom<GridType>('tian')
export const copybookGridSize = atom<number>(14)
export const copybookRowGap = atom<number>(2)
export const copybookMargin = atom<Margin>({ ...DEFAULT_MARGIN })
export const copybookFontFamily = atom<string>('tianyingzhang')
export const copybookFontWeight = atom<string>('normal')
export const copybookFontSize = atom<number>(68)
export const copybookFontOffsetY = atom<number>(0)
export const copybookTraceCount = atom<number>(5)
export const copybookTraceColor = atom<string>('#fca5a5')
export const copybookLineColor = atom<string>('#cbd5e1')
export const copybookHighlightFirst = atom<boolean>(true)
export const copybookInsertEmptyRow = atom<boolean>(false)
export const copybookInsertEmptyCol = atom<boolean>(false)
export const copybookResolvedFont = atom<string>('serif')
export const copybookShowPinyin = atom<boolean>(false)
export const copybookPinyinMap = atom<Record<number, string>>({})
