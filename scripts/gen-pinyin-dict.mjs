import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const cnchar = require('cnchar')
require('cnchar-words')
cnchar.use(require('cnchar-words'))
const { pinyin } = require('pinyin-pro')

const WORDS_PER_PINYIN = 40
const CHAR_MIN = 0x4E00
const CHAR_MAX = 0x9FFF

function getBase(p) {
  const map = {
    ā: 'a',
    á: 'a',
    ǎ: 'a',
    à: 'a',
    ē: 'e',
    é: 'e',
    ě: 'e',
    è: 'e',
    ī: 'i',
    í: 'i',
    ǐ: 'i',
    ì: 'i',
    ō: 'o',
    ó: 'o',
    ǒ: 'o',
    ò: 'o',
    ū: 'u',
    ú: 'u',
    ǔ: 'u',
    ù: 'u',
    ǖ: 'v',
    ǘ: 'v',
    ǚ: 'v',
    ǜ: 'v',
    ü: 'v',
  }
  let r = p
  for (const [k, v] of Object.entries(map)) r = r.replaceAll(k, v)
  return r
}

function shuffle(arr) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const PINYIN_TABLE = {
  a: ['a', 'ai', 'an', 'ang', 'ao'],
  o: ['o', 'ou'],
  e: ['e', 'ei', 'en', 'eng', 'er'],
  i: ['yi', 'ya', 'ye', 'yao', 'you', 'yan', 'yin', 'yang', 'ying', 'yong', 'yu', 'yue', 'yuan', 'yun'],
  u: ['wu', 'wa', 'wai', 'wei', 'wan', 'wen', 'wang', 'weng', 'wo'],
  b: ['ba', 'bai', 'ban', 'bang', 'bao', 'bei', 'ben', 'beng', 'bi', 'bian', 'biao', 'bie', 'bin', 'bing', 'bo', 'bu'],
  p: ['pa', 'pai', 'pan', 'pang', 'pao', 'pei', 'pen', 'peng', 'pi', 'pian', 'piao', 'pie', 'pin', 'ping', 'po', 'pu'],
  m: ['ma', 'mai', 'man', 'mang', 'mao', 'mei', 'men', 'meng', 'mi', 'mian', 'miao', 'mie', 'min', 'ming', 'mo', 'mou', 'mu'],
  f: ['fa', 'fan', 'fang', 'fei', 'fen', 'feng', 'fo', 'fou', 'fu'],
  d: ['da', 'dai', 'dan', 'dang', 'dao', 'de', 'deng', 'di', 'dian', 'diao', 'die', 'ding', 'diu', 'dong', 'dou', 'du', 'duan', 'dui', 'dun', 'duo'],
  t: ['ta', 'tai', 'tan', 'tang', 'tao', 'te', 'teng', 'ti', 'tian', 'tiao', 'tie', 'ting', 'tong', 'tou', 'tu', 'tuan', 'tui', 'tun', 'tuo'],
  n: ['na', 'nai', 'nan', 'nang', 'nao', 'ne', 'nei', 'nen', 'neng', 'ni', 'nian', 'niang', 'niao', 'nie', 'nin', 'ning', 'niu', 'nong', 'nu', 'nuan', 'nv', 'nve'],
  l: ['la', 'lai', 'lan', 'lang', 'lao', 'le', 'lei', 'leng', 'li', 'lia', 'lian', 'liang', 'liao', 'lie', 'lin', 'ling', 'liu', 'long', 'lou', 'lu', 'luan', 'lun', 'luo', 'lv', 'lve'],
  g: ['ga', 'gai', 'gan', 'gang', 'gao', 'ge', 'gei', 'gen', 'geng', 'gong', 'gou', 'gu', 'gua', 'guai', 'guan', 'guang', 'gui', 'gun', 'guo'],
  k: ['ka', 'kai', 'kan', 'kang', 'kao', 'ke', 'ken', 'keng', 'kong', 'kou', 'ku', 'kua', 'kuai', 'kuan', 'kuang', 'kui', 'kun', 'kuo'],
  h: ['ha', 'hai', 'han', 'hang', 'hao', 'he', 'hei', 'hen', 'heng', 'hong', 'hou', 'hu', 'hua', 'huai', 'huan', 'huang', 'hui', 'hun', 'huo'],
  j: ['ji', 'jia', 'jian', 'jiang', 'jiao', 'jie', 'jin', 'jing', 'jiong', 'jiu', 'ju', 'juan', 'jue', 'jun'],
  q: ['qi', 'qia', 'qian', 'qiang', 'qiao', 'qie', 'qin', 'qing', 'qiong', 'qiu', 'qu', 'quan', 'que', 'qun'],
  x: ['xi', 'xia', 'xian', 'xiang', 'xiao', 'xie', 'xin', 'xing', 'xiong', 'xiu', 'xu', 'xuan', 'xue', 'xun'],
  zh: ['zha', 'zhai', 'zhan', 'zhang', 'zhao', 'zhe', 'zhen', 'zheng', 'zhong', 'zhou', 'zhu', 'zhua', 'zhuai', 'zhuan', 'zhuang', 'zhui', 'zhun', 'zhuo'],
  ch: ['cha', 'chai', 'chan', 'chang', 'chao', 'che', 'chen', 'cheng', 'chong', 'chou', 'chu', 'chuai', 'chuan', 'chuang', 'chui', 'chun', 'chuo'],
  sh: ['sha', 'shai', 'shan', 'shang', 'shao', 'she', 'shei', 'shen', 'sheng', 'shou', 'shu', 'shua', 'shuai', 'shuan', 'shuang', 'shui', 'shun', 'shuo'],
  r: ['ran', 'rang', 'rao', 're', 'ren', 'reng', 'ri', 'rong', 'rou', 'ru', 'ruan', 'rui', 'run', 'ruo'],
  z: ['za', 'zai', 'zan', 'zang', 'zao', 'ze', 'zei', 'zen', 'zeng', 'zi', 'zong', 'zou', 'zu', 'zuan', 'zui', 'zun', 'zuo'],
  c: ['ca', 'cai', 'can', 'cang', 'cao', 'ce', 'cen', 'ceng', 'ci', 'cong', 'cou', 'cu', 'cuan', 'cui', 'cun', 'cuo'],
  s: ['sa', 'sai', 'san', 'sang', 'sao', 'se', 'sen', 'seng', 'si', 'song', 'sou', 'su', 'suan', 'sui', 'sun', 'suo'],
}

function findCharsWithPinyin(basePinyin) {
  const chars = []
  for (let i = CHAR_MIN; i <= CHAR_MAX; i++) {
    const ch = String.fromCharCode(i)
    const py = pinyin(ch, { toneType: 'symbol', type: 'array' })
    if (py.length > 0 && getBase(py[0]) === basePinyin) {
      chars.push(ch)
    }
  }
  return chars
}

function generateForPinyin(basePinyin) {
  const candidates = []
  const seen = new Set()

  const chars = findCharsWithPinyin(basePinyin)
  for (const ch of chars) {
    const wordList = cnchar.words(ch) || []
    for (const word of wordList) {
      if (word.length !== 2 || seen.has(word))
        continue

      const pyList = pinyin(word, { toneType: 'symbol', type: 'array' })
      if (pyList.length !== 2)
        continue

      const bases = pyList.map(getBase)
      const hasMatch = bases.includes(basePinyin)
      if (!hasMatch)
        continue

      seen.add(word)
      const highlight = bases.map(b => b === basePinyin)

      candidates.push({
        words: word,
        pinyin: pyList,
        highlight,
      })
    }
  }

  return shuffle(candidates).slice(0, WORDS_PER_PINYIN)
}

function validateEntry(entry, basePinyin) {
  const { words, pinyin: pyList, highlight } = entry
  const errors = []

  const actualPy = pinyin(words, { toneType: 'symbol', type: 'array' })

  if (actualPy.length !== pyList.length) {
    errors.push(`${words}: pinyin length mismatch: stored=${pyList.length} actual=${actualPy.length}`)
    return errors
  }

  for (let i = 0; i < pyList.length; i++) {
    if (pyList[i] !== actualPy[i]) {
      errors.push(`${words}[${i}]: pinyin mismatch stored=${pyList[i]} actual=${actualPy[i]}`)
    }
  }

  const bases = pyList.map(getBase)
  const hasMatch = bases.includes(basePinyin)
  if (!hasMatch) {
    errors.push(`${words}: no character has base pinyin "${basePinyin}", got [${bases.join(',')}]`)
  }

  for (let i = 0; i < highlight.length; i++) {
    if (highlight[i] && bases[i] !== basePinyin) {
      errors.push(`${words}[${i}]: highlighted but base "${bases[i]}" !== "${basePinyin}"`)
    }
  }

  return errors
}

const allPinyin = Object.values(PINYIN_TABLE).flat()
console.log(`Total pinyin to generate: ${allPinyin.length}`)

const dict = {}
let totalErrors = 0
let totalGenerated = 0
const warnings = []

for (const bp of allPinyin) {
  process.stdout.write(`${bp}...`)
  const entries = generateForPinyin(bp)

  if (entries.length < WORDS_PER_PINYIN) {
    warnings.push(`${bp}: ${entries.length}/${WORDS_PER_PINYIN}`)
  }

  let errorsForThis = 0
  for (const entry of entries) {
    const errs = validateEntry(entry, bp)
    if (errs.length > 0) {
      errorsForThis++
      if (errorsForThis <= 3) {
        for (const e of errs) console.error(`  ERROR: ${e}`)
      }
    }
  }

  if (errorsForThis > 0) {
    console.log(`✗ ${errorsForThis} errors`)
    totalErrors += errorsForThis
  }
  else {
    console.log(`✓ ${entries.length}`)
  }

  dict[bp] = entries
  totalGenerated += entries.length
}

console.log('\n--- Warnings (less than target) ---')
warnings.forEach(w => console.log(`  ${w}`))

const outPath = new URL('../src/apps/workbook/assets/data/pinyin-dict.json', import.meta.url)
writeFileSync(outPath, `${JSON.stringify(dict, null, 2)}\n`)

console.log(`\nTotal: ${totalGenerated} words for ${allPinyin.length} pinyin`)
console.log(`Errors: ${totalErrors}`)
console.log(`Written to: ${outPath.pathname}`)
