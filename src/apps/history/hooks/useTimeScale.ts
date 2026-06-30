export interface TimeDomain {
  start: number
  end: number
}

/** 年份 ↔ 像素 x 坐标的线性映射，所有车道共享同一实例 */
export interface TimeScale {
  /** 年份 → 左边缘 x 坐标 */
  x: (year: number) => number
  /** 起止年份 → 像素宽度 */
  width: (start: number, end: number) => number
  /** 整条时间轴的总像素宽度 */
  totalWidth: number
}

/**
 * 创建一个时间坐标映射
 * 不同国家共享同一 domain 与 pxPerYear，保证横向按年份对齐、可比较
 */
export function createTimeScale(domain: TimeDomain, pxPerYear: number): TimeScale {
  return {
    x: year => (year - domain.start) * pxPerYear,
    width: (start, end) => (end - start) * pxPerYear,
    totalWidth: (domain.end - domain.start) * pxPerYear,
  }
}
