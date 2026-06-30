import type { Country } from '../interfaces'
import { china } from './china'
import { egypt } from './egypt'
import { greece } from './greece'
import { india } from './india'
import { japan } from './japan'
import { russia } from './russia'

/** 当前年份：用于把各文明"延续至今"的末位朝代结束年延展到现在 */
const CURRENT_YEAR = new Date().getFullYear()

/**
 * 末位延续至今的文明
 * 原始数据忠实于参考项目（止于 2014），"延展至今"统一在此处理，避免散落各文件
 */
const raw: Country[] = [china, egypt, greece, india, japan, russia]

export const ALL_COUNTRIES: Country[] = raw.map((country, i) => {
  const dynasties = country.dynasties
  const last = dynasties[dynasties.length - 1]
  return {
    ...country,
    // 末位朝代结束年统一延展到当前年份
    dynasties: last ? [...dynasties.slice(0, -1), { ...last, end: CURRENT_YEAR }] : dynasties,
    accent: `var(--dynasty-${i % 12})`,
  }
})
