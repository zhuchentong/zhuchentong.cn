import type { Country } from '../interfaces'

/** 日本历史朝代数据（转译自参考项目 data/japan/period.json） */
export const japan: Country = {
  id: 'japan',
  name: '日本',
  dynasties: [
    { name: '弥生时代', start: -400, end: 250 },
    {
      name: '大和时代',
      start: 250,
      end: 710,
      child: [
        { name: '古坟时代', start: 250, end: 538 },
        { name: '飞鸟时代', start: 538, end: 710 },
      ],
    },
    { name: '奈良时代', start: 710, end: 794 },
    { name: '平安时代', start: 794, end: 1185 },
    { name: '镰仓时代', start: 1185, end: 1333 },
    { name: '建武新政', start: 1333, end: 1336 },
    {
      name: '室町时代',
      start: 1336,
      end: 1573,
      child: [
        { name: '南北朝', start: 1336, end: 1392 },
        { name: '战国', start: 1467, end: 1573 },
      ],
    },
    { name: '安土桃山时代', start: 1568, end: 1603 },
    { name: '江户时代', start: 1603, end: 1868 },
    { name: '明治时代', start: 1868, end: 1912 },
    { name: '大正时代', start: 1912, end: 1926 },
    { name: '昭和时代', start: 1926, end: 1989 },
    { name: '平成时代', start: 1989, end: 2019 },
    { name: '令和时代', start: 2019, end: 2019 },
  ],
}
