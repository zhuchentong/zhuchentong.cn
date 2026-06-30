import type { Country } from '../interfaces'

/** 古希腊历史朝代数据（转译自参考项目 data/greece/period.json） */
export const greece: Country = {
  id: 'greece',
  name: '古希腊',
  dynasties: [
    {
      name: '爱琴文明',
      start: -2700,
      end: -1050,
      child: [
        { name: '克里特文明', start: -2500, end: -1450 },
        { name: '迈锡尼文明', start: -1600, end: -1050 },
      ],
    },
    { name: '荷马时代', start: -1100, end: -950 },
    { name: '古风文明', start: -950, end: -650 },
    { name: '古典文明', start: -650, end: -400 },
    { name: '马其顿统治时代', start: -395, end: -323 },
    { name: '希腊化时代', start: -323, end: -146 },
    { name: '罗马时期', start: -146, end: 324 },
    { name: '拜占庭时期', start: 324, end: 1453 },
    { name: '奥斯曼统治时期', start: 1453, end: 1829 },
    { name: '现代希腊', start: 1829, end: 2014 },
  ],
}
