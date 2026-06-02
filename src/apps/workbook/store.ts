import type { Margin, Question } from './interfaces'
import { atom } from 'nanostores'
import { DEFAULT_PINYIN_CONFIG } from './config'

export const pinyinChapter = atom<number>(DEFAULT_PINYIN_CONFIG.chapter)
export const pinyinQuestionCount = atom<number>(DEFAULT_PINYIN_CONFIG.questionCount)
export const pinyinAnswerMode = atom<'all' | 'hide-keyword' | 'hidden'>(DEFAULT_PINYIN_CONFIG.answerMode)
export const pinyinHighlightEnabled = atom<boolean>(DEFAULT_PINYIN_CONFIG.highlightEnabled)
export const pinyinHighlightColor = atom<string>(DEFAULT_PINYIN_CONFIG.highlightColor)
export const pinyinGridSize = atom<number>(DEFAULT_PINYIN_CONFIG.gridSize)
export const pinyinQuestionGap = atom<number>(DEFAULT_PINYIN_CONFIG.questionGap)
export const pinyinMargin = atom<Margin>({ ...DEFAULT_PINYIN_CONFIG.margin })
export const pinyinLineColor = atom<string>(DEFAULT_PINYIN_CONFIG.lineColor)
export const pinyinAnswerColor = atom<string>(DEFAULT_PINYIN_CONFIG.answerColor)
export const pinyinFontWeight = atom<string>(DEFAULT_PINYIN_CONFIG.fontWeight)
export const pinyinFontSize = atom<number>(DEFAULT_PINYIN_CONFIG.fontSize)
export const pinyinFontColor = atom<string>(DEFAULT_PINYIN_CONFIG.fontColor)
export const pinyinSeed = atom<number>(DEFAULT_PINYIN_CONFIG.seed)
export const pinyinQuestions = atom<Question[]>([])
