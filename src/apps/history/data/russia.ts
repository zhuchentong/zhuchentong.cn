import type { Country } from '../interfaces'

/** 俄罗斯历史朝代数据（转译自参考项目 data/russia/period.json） */
export const russia: Country = {
  id: 'russia',
  name: '俄罗斯',
  dynasties: [
    { name: '留里克王朝', start: 862, end: 1598 },
    { name: '大动乱时期', start: 1598, end: 1613 },
    { name: '罗曼诺夫王朝', start: 1613, end: 1917 },
    { name: '苏维埃时期', start: 1917, end: 1991 },
    { name: '新俄罗斯', start: 1991, end: 2014 },
  ],
}
