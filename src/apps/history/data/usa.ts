import type { Country } from '../interfaces'

/** 美国历史数据（按史实自编，沿用既有格式） */
export const usa: Country = {
  id: 'usa',
  name: '美国',
  dynasties: [
    { name: '殖民地时期', start: 1607, end: 1776 },
    {
      name: '美利坚合众国',
      start: 1776,
      end: 2014,
      child: [
        // 《独立宣言》后的战争年份；作合众国子项，避免顶层与合众国重叠
        { name: '独立战争', start: 1776, end: 1783 },
        { name: '南北战争', start: 1861, end: 1865 },
        { name: '冷战时期', start: 1947, end: 1991 },
      ],
    },
  ],
}
