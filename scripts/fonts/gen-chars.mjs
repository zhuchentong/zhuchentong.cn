// scripts/fonts/gen-chars.mjs
// 从 zispace/hanzi-chars 拉取标准字表，生成字体子集化所需的字符集
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const destFile = path.resolve(__dirname, 'chars.txt')

// 字表配置：key = 文件名（zispace/hanzi-chars 仓库路径），label = 显示名
const CHARLISTS = {
  yiwu: {
    label: '义务教育常用字表（3500字）',
    url: 'https://raw.githubusercontent.com/zispace/hanzi-chars/main/data-charlist/%E3%80%8A%E4%B9%89%E5%8A%A1%E6%95%99%E8%82%B2%E8%AF%AD%E6%96%87%E8%AF%BE%E7%A8%8B%E3%80%8B%EF%BC%882022%E5%B9%B4%E7%89%88%EF%BC%89%E5%B8%B8%E7%94%A8%E5%AD%97%E8%A1%A8.txt',
  },
  hsk: {
    label: 'HSK汉字表（3000字）',
    url: 'https://raw.githubusercontent.com/zispace/hanzi-chars/main/data-charset/GF%200025-2021%E3%80%8A%E5%9B%BD%E9%99%85%E4%B8%AD%E6%96%87%E6%95%99%E8%82%B2%E4%B8%AD%E6%96%87%E6%B0%B4%E5%B9%B3%E7%AD%89%E7%BA%A7%E6%A0%87%E5%87%86%E3%80%89%E6%B1%89%E5%AD%97%E8%A1%A8.txt',
  },
  gb2312: {
    label: 'GB/T 2312（6763字）',
    url: 'https://raw.githubusercontent.com/zispace/hanzi-chars/main/data-charset/GBT%202312-1980.txt',
  },
}

const CHINESE_PUNCTUATION = '，。、；：？！\u201C\u201D\u2018\u2019（）【】《》—…·'

async function fetchCharlist(key) {
  const config = CHARLISTS[key]
  if (!config) {
    console.error(`Unknown charlist: ${key}`)
    console.error(`Available: ${Object.keys(CHARLISTS).join(', ')}`)
    process.exit(1)
  }

  console.log(`Fetching: ${config.label}`)
  const res = await fetch(config.url)
  if (!res.ok) {
    console.error(`Failed to fetch (${res.status}): ${config.url}`)
    process.exit(1)
  }

  const text = await res.text()
  const cjkChars = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#'))
      continue
    const ch = trimmed[0]
    if (/[\u4E00-\u9FFF]/.test(ch)) {
      cjkChars.push(ch)
    }
  }

  // 去重
  const unique = [...new Set(cjkChars)]
  return unique
}

async function main() {
  const selectedKey = process.argv[2] || 'yiwu'
  const cjkChars = await fetchCharlist(selectedKey)

  // ASCII 可见字符
  let ascii = ''
  for (let i = 0x20; i <= 0x7E; i++) {
    ascii += String.fromCodePoint(i)
  }

  const allChars = ascii + CHINESE_PUNCTUATION + cjkChars.join('')
  fs.writeFileSync(destFile, allChars, 'utf-8')

  console.log(`Generated ${allChars.length} total characters (${cjkChars.length} CJK, ${allChars.length - cjkChars.length} non-CJK)`)
  console.log(`Saved to: ${destFile}`)
}

main()
