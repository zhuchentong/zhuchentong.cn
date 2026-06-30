import type { Country } from '../interfaces'

/** 古埃及历史朝代数据（转译自参考项目 data/egypt/period.json） */
export const egypt: Country = {
  id: 'egypt',
  name: '古埃及',
  dynasties: [
    {
      name: '前王朝时期',
      start: -4000,
      end: -3100,
      child: [
        { name: '阿姆拉特时期', start: -4000, end: -3500 },
        { name: '格尔塞时期', start: -3500, end: -3100 },
      ],
    },
    { name: '早王朝时期', start: -3100, end: -2686 },
    { name: '古王国时期', start: -2686, end: -2181 },
    { name: '第一中间时期', start: -2181, end: -2055 },
    { name: '中王国时期', start: -2055, end: -1650 },
    { name: '第二中间时期', start: -1650, end: -1550 },
    { name: '新王国时期', start: -1550, end: -1069 },
    { name: '第三中间时期', start: -1069, end: -664 },
    { name: '阿契美尼德王朝', start: -525, end: -332 },
    { name: '托勒密时期', start: -332, end: -30 },
    { name: '罗马及拜占庭治理时期', start: -30, end: 641 },
    { name: '萨珊时期', start: 621, end: 629 },
    { name: '阿拉伯治理时期', start: 641, end: 969 },
    { name: '法蒂玛时期', start: 969, end: 1171 },
    { name: '阿尤布时期', start: 1171, end: 1250 },
    { name: '马木留克时期', start: 1250, end: 1517 },
    { name: '奥斯曼治理时期', start: 1517, end: 1867 },
    { name: '法国治理时期', start: 1798, end: 1801 },
    { name: '穆罕默德·阿里时期', start: 1805, end: 1882 },
    { name: '赫迪夫领时期', start: 1867, end: 1914 },
    { name: '英国治理时期', start: 1882, end: 1953 },
    { name: '苏丹国时期', start: 1914, end: 1922 },
    { name: '王国时期', start: 1922, end: 1953 },
    { name: '共和国时期', start: 1953, end: 2014 },
  ],
}
