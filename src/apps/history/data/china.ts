import type { Country } from '../interfaces'

/** 中国历史朝代数据（转译自参考项目 data/china/period.json） */
export const china: Country = {
  id: 'china',
  name: '中国',
  dynasties: [
    { name: '夏', start: -2029, end: -1559 },
    { name: '商', start: -1559, end: -1046 },
    { name: '西周', start: -1046, end: -771 },
    {
      name: '东周',
      start: -770,
      end: -256,
      child: [
        { name: '春秋', start: -770, end: -476 },
        { name: '战国', start: -475, end: -221 },
      ],
    },
    { name: '秦', start: -221, end: -207 },
    { name: '西楚', start: -206, end: -202 },
    {
      name: '汉',
      start: -202,
      end: 220,
      child: [
        { name: '西汉', start: -202, end: 8 },
        { name: '新朝', start: 8, end: 23 },
        { name: '东汉', start: 25, end: 220 },
      ],
    },
    { name: '三国', start: 220, end: 280 },
    {
      name: '晋',
      start: 265,
      end: 420,
      child: [
        { name: '西晋', start: 265, end: 316 },
        { name: '东晋', start: 317, end: 420 },
      ],
    },
    { name: '南北朝', start: 420, end: 589 },
    { name: '隋', start: 581, end: 619 },
    { name: '唐', start: 618, end: 907 },
    { name: '五代十国', start: 891, end: 979 },
    {
      name: '宋',
      start: 960,
      end: 1279,
      child: [
        { name: '北宋', start: 960, end: 1127 },
        { name: '南宋', start: 1127, end: 1279 },
      ],
    },
    { name: '元', start: 1271, end: 1368 },
    { name: '明', start: 1368, end: 1644 },
    { name: '清', start: 1636, end: 1912 },
    { name: '中华民国', start: 1912, end: 1949 },
    // 当今政权延续至今，结束年取当前年份
    { name: '中华人民共和国', start: 1949, end: new Date().getFullYear() },
  ],
}
