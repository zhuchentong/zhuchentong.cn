import type { Country } from './interfaces'

/** 缩放范围：每年对应的像素宽度上下限（滚轮缩放在此区间内） */
export const MIN_PX_PER_YEAR = 0.2
export const MAX_PX_PER_YEAR = 15

/** 朝代配色板大小（对应 globals.css 中的 --dynasty-N 变量数量） */
export const DYNASTY_PALETTE_SIZE = 12

/**
 * 从所选国家的朝代数据派生时间域（取年份并集 + 两侧留白）
 * 这样加入时间跨度不同的国家时，时间轴会自动扩展
 */
export function getDomain(countries: Country[]): { start: number, end: number } {
  let min = Infinity
  let max = -Infinity
  const walk = (d: Country['dynasties'][number]) => {
    min = Math.min(min, d.start)
    max = Math.max(max, d.end)
    d.child?.forEach(walk)
  }
  countries.forEach(c => c.dynasties.forEach(walk))
  const pad = 50
  return { start: Math.floor(min - pad), end: Math.ceil(max + pad) }
}
