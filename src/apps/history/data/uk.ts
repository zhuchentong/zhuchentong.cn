import type { Country } from '../interfaces'

/** 英国历史朝代数据（按史实自编，沿用既有格式；顶层顺序无重叠） */
export const uk: Country = {
  id: 'uk',
  name: '英国',
  dynasties: [
    { name: '罗马不列颠', start: 43, end: 410 },
    { name: '盎格鲁-撒克逊时期', start: 410, end: 1066 },
    { name: '诺曼王朝', start: 1066, end: 1154 },
    { name: '金雀花王朝', start: 1154, end: 1399 },
    { name: '兰开斯特王朝', start: 1399, end: 1461 },
    { name: '约克王朝', start: 1461, end: 1485 },
    { name: '都铎王朝', start: 1485, end: 1603 },
    {
      name: '斯图亚特王朝',
      start: 1603,
      end: 1714,
      child: [
        // 共和国/护国公时期作斯图亚特子项（王政中断期），避免顶层重叠
        { name: '英格兰共和国（护国公）', start: 1649, end: 1660 },
      ],
    },
    { name: '汉诺威王朝', start: 1714, end: 1901 },
    { name: '温莎王朝', start: 1901, end: 2014 },
  ],
}
