import cnchar from 'cnchar'
import 'cnchar-poly'

/** 多音字信息 */
export interface PolyCharInfo {
  /** 汉字 */
  char: string
  /** 在原文中的位置索引 */
  index: number
  /** 所有读音（带声调） */
  pinyins: string[]
}

/**
 * 解析多音字拼音格式
 * cnchar-poly 返回的多音字格式为 "(pinyin1|pinyin2|...)"
 * @param raw - cnchar 返回的原始拼音字符串
 * @returns 拼音数组
 */
function parsePolyPinyin(raw: string): string[] {
  // 多音字格式：(pinyin1|pinyin2|...)
  if (raw.startsWith('(') && raw.endsWith(')')) {
    return raw.slice(1, -1).split('|')
  }
  return [raw]
}

/**
 * 获取文本中每个字的拼音
 * 支持自定义拼音覆盖（通过 pinyinMap 参数）
 * @param text - 输入文本
 * @param pinyinMap - 自定义拼音映射（索引 → 拼音），优先级高于自动查询
 * @returns 与文本等长的拼音数组
 */
export function getPinyinForChars(text: string, pinyinMap: Record<number, string>): string[] {
  const chars = Array.from(text)
  return chars.map((ch, i) => {
    // 优先使用自定义拼音
    if (pinyinMap[i]) {
      return pinyinMap[i]
    }
    // 使用 cnchar 查询拼音（支持多音字、声调、小写）
    const result = cnchar.spell(ch, 'poly', 'array', 'tone', 'low')
    const pinyins = parsePolyPinyin(result[0])
    // 多音字取第一个读音
    return pinyins[0]
  })
}

/**
 * 提取文本中的多音字及其所有读音
 * 遍历文本，找出所有多音字并返回其位置和读音列表
 * @param text - 输入文本
 * @returns 多音字信息数组
 */
export function getPolyChars(text: string): PolyCharInfo[] {
  const chars = Array.from(text)
  const result: PolyCharInfo[] = []
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    // 跳过非多音字
    if (!cnchar.isPolyWord(ch)) {
      continue
    }
    // 查询所有读音
    const spellResult = cnchar.spell(ch, 'poly', 'array', 'tone', 'low')
    const pinyins = parsePolyPinyin(spellResult[0])
    // 只有一个读音的不算多音字
    if (pinyins.length <= 1) {
      continue
    }
    result.push({ char: ch, index: i, pinyins })
  }
  return result
}
