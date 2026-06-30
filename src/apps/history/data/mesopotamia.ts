import type { Country } from '../interfaces'

/** 两河流域（美索不达米亚）历史朝代数据（转译自参考项目 data/mesopotamia/period.json） */
export const mesopotamia: Country = {
  id: 'mesopotamia',
  name: '两河流域',
  dynasties: [
    { name: '早期高度文明', start: -4000, end: -3000 },
    { name: '苏美尔城邦', start: -3000, end: -2371 },
    {
      name: '早亚述时期',
      start: -2500,
      end: -1500,
      child: [
        { name: '阿卡德王国时期', start: -2371, end: -2191 },
        // 注：参考数据此处起止疑似倒置（-2000 ~ -2110），忠实转译，渲染时按 min 宽兜底
        { name: '苏美尔复兴时期', start: -2000, end: -2110 },
        { name: '乌尔第三王朝', start: -2111, end: -2003 },
        { name: '巴比伦王国', start: -1850, end: -1550 },
      ],
    },
    { name: '中亚述时期', start: -1365, end: -1000 },
    { name: '新亚述帝国', start: -1000, end: -612 },
    { name: '新巴比伦王国', start: -626, end: -538 },
    { name: '波斯帝国时期', start: -539, end: -330 },
    { name: '马其顿—希腊时期', start: -330, end: -141 },
    { name: '安息王朝', start: -129, end: 224 },
    { name: '萨珊王朝', start: 224, end: 651 },
  ],
}
