import cnchar from 'cnchar'
import 'cnchar-poly'

export interface PolyCharInfo {
  char: string
  index: number
  pinyins: string[]
}

function parsePolyPinyin(raw: string): string[] {
  if (raw.startsWith('(') && raw.endsWith(')')) {
    return raw.slice(1, -1).split('|')
  }
  return [raw]
}

export function getPinyinForChars(text: string, pinyinMap: Record<number, string>): string[] {
  const chars = Array.from(text)
  return chars.map((ch, i) => {
    if (pinyinMap[i]) {
      return pinyinMap[i]
    }
    const result = cnchar.spell(ch, 'poly', 'array', 'tone', 'low')
    const pinyins = parsePolyPinyin(result[0])
    return pinyins[0]
  })
}

export function getPolyChars(text: string): PolyCharInfo[] {
  const chars = Array.from(text)
  const result: PolyCharInfo[] = []
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (!cnchar.isPolyWord(ch)) {
      continue
    }
    const spellResult = cnchar.spell(ch, 'poly', 'array', 'tone', 'low')
    const pinyins = parsePolyPinyin(spellResult[0])
    if (pinyins.length <= 1) {
      continue
    }
    result.push({ char: ch, index: i, pinyins })
  }
  return result
}
