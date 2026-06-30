import type { Country } from '../interfaces'

/** 古印度历史朝代数据（转译自参考项目 data/india/period.json） */
export const india: Country = {
  id: 'india',
  name: '古印度',
  dynasties: [
    { name: '哈拉帕文化时期', start: -2500, end: -1500 },
    { name: '吠陀时期', start: -1500, end: -700 },
    { name: '恒河流域列国', start: -700, end: -400 },
    { name: '孔雀王朝', start: -322, end: -185 },
    { name: '外族入侵（贵霜王朝）', start: -150, end: 300 },
    { name: '笈多王朝', start: 320, end: 600 },
    { name: '戒日王朝', start: 606, end: 647 },
    { name: '阿拉伯入侵', start: 700, end: 1200 },
    { name: '德里苏丹王朝', start: 1206, end: 1526 },
    { name: '莫卧儿王朝', start: 1526, end: 1757 },
    { name: '英国统治', start: 1757, end: 1947 },
    { name: '印度共和国', start: 1950, end: 2014 },
  ],
}
