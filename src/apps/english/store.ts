import { atom } from 'nanostores'

/** 当前选中的课本 ID */
export const selectedTextbookId = atom<number | null>(null)

/** 当前选中的单元号（1/2/3...，0 表示无单元课本） */
export const selectedUnitNumber = atom<number | null>(null)
