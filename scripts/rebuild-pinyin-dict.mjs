import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

const DICT_INITIALS = ['b','p','m','f','d','t','n','l','g','k','h','j','q','x','zh','ch','sh','r','z','c','s','y','w']
const SORTED_INITIALS = [...DICT_INITIALS].sort((a, b) => b.length - a.length)

const TONE_MAP = {
  'ā':'a','á':'a','ǎ':'a','à':'a',
  'ē':'e','é':'e','ě':'e','è':'e',
  'ī':'i','í':'i','ǐ':'i','ì':'i',
  'ō':'o','ó':'o','ǒ':'o','ò':'o',
  'ū':'u','ú':'u','ǔ':'u','ù':'u',
  'ǖ':'v','ǘ':'v','ǚ':'v','ǜ':'v',
}

function removeTone(py) {
  return py.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, c => TONE_MAP[c] || c)
}

function getTeachingFinal(key) {
  const initial = SORTED_INITIALS.find(i => key.startsWith(i))
  const dictFinal = initial ? key.slice(initial.length) : key
  if (dictFinal === 'v') return { initial, final: 'ü' }
  if (dictFinal === 've') return { initial, final: 'üe' }
  if (dictFinal === 'ue') return { initial, final: 'üe' }
  if (dictFinal === 'un' && initial && ['j','q','x','y'].includes(initial)) return { initial, final: 'ün' }
  if (dictFinal === 'uan' && initial && ['j','q','x','y'].includes(initial)) return { initial, final: 'üan' }
  return { initial, final: dictFinal }
}

const srcPath = resolve(rootDir, 'src/apps/workbook/assets/data/pinyin-dict.json')
const destPath = srcPath

const oldDict = JSON.parse(readFileSync(srcPath, 'utf-8'))
const keys = Object.keys(oldDict)

const newDict = {}
for (const k of keys) {
  for (const q of oldDict[k]) {
    if (newDict[q.words]) continue
    newDict[q.words] = q.pinyin.map(py => {
      const info = getTeachingFinal(removeTone(py))
      return { pinyin: py, initial: info.initial || null, final: info.final }
    })
  }
}

const entries = Object.entries(newDict)
  .map(([word, syllables]) => `  ${JSON.stringify(word)}:${JSON.stringify(syllables)}`)
  .join(',\n')
writeFileSync(destPath, `{\n${entries}\n}\n`)

const origWords = new Set()
for (const k of keys) for (const q of oldDict[k]) origWords.add(q.words)

console.log(`Keys: ${keys.length} → Words: ${Object.keys(newDict).length} (deduped from ${origWords.size})`)
console.log(`Written to ${destPath}`)
