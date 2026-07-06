import cnchar from 'cnchar'
import 'cnchar-poly'

/**
 * 去除拼音声调符号、ü→v、去空格、小写，得到打字比对串
 *
 * 注意：cnchar 输出的带调 ü 是预组合字符（如 ǚ = U+01DA），NFD 后会分解为
 * u + 分音符(U+0308) + 声调符。必须只剥声调符（保留分音符），再把 u+分音符 → v，
 * 否则分音符会被声调正则一并剥掉，导致 nǚ→nu（应为 nv）。
 * （j/q/x 后的 ü 按规范省略分音符写作 u，cnchar 已正确输出 qu/xu，不受影响）
 */
export function toPinyinTarget(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300\u0301\u0304\u030C]/g, '')
    .replace(/u\u0308/gi, 'v')
    .replace(/\s+/g, '')
    .toLowerCase()
}

/**
 * 解析 cnchar-poly 多音字格式 "(pinyin1|pinyin2|...)"，返回读音数组
 */
function parsePolyPinyin(raw: string): string[] {
  if (raw.startsWith('(') && raw.endsWith(')'))
    return raw.slice(1, -1).split('|')
  return [raw]
}

/**
 * 取单个汉字的默认带调拼音（多音字取首个读音）
 */
export function getCharPinyin(ch: string): string {
  const result = cnchar.spell(ch, 'poly', 'array', 'tone', 'low')
  if (!result.length)
    return ''
  const pinyins = parsePolyPinyin(result[0])
  return pinyins[0] ?? ''
}

/**
 * 取词语（多字）的带调拼音，逐字查询后空格拼接
 * "春天" → "chūn tiān"
 */
export function getWordPinyin(word: string): string {
  return Array.from(word).map(getCharPinyin).filter(Boolean).join(' ')
}
