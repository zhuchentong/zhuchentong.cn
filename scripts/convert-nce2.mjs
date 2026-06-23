// scripts/convert-nce2.mjs
// 新概念英语第二册：逐文件 GBK TXT → JSON 转换器
// 源：docs/new_concept_english/2/*.TXT（GBK）
// 产物：docs/new_concept_english/2_format/{lesson}.json
// 特点：散文段落按句末符+大写/引号 切分；译文留空（AI 后补），源译文存 raw.zh
import { execSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC_DIR = new URL('../docs/new_concept_english/2/', import.meta.url).pathname
const OUT_DIR = new URL('../docs/new_concept_english/2_format/', import.meta.url).pathname

// ── 解析工具 ──────────────────────────────────────────────────────

const POS_RE = /^(?:n|v|pron|int|adj|num|adv|art|prep|conj|aux|modal|possessive adjective)\b/i
const CJK_RE = /[\u4E00-\u9FFF]/

/** GBK → UTF-8（调用系统 iconv，不改源文件） */
function decodeGbk(filePath) {
  return execSync(`iconv -f GBK -t UTF-8 "${filePath}"`).toString('utf8')
}

/**
 * 按句末符切分单个段落/行
 * 规则：. ! ? 后须跟 空白+大写字母或引号 才视为句子边界
 * 保护缩写 Mr./Mrs./Dr. 等
 */
function splitSentences(text) {
  const PH = '\uFFFF'
  const masked = text
    .replace(/\b(Mr|Mrs|Ms|Dr|St|Prof|Mt|Jr|Sr|No|vs|etc|Inc|Ltd)\./g, `$1${PH}`)
    .replace(/\b((?:[A-Z]\.){2,})/g, m => m.replace(/\./g, PH))

  // 句末符 + 空白 + (大写字母 | 直/弯引号) → 切分
  const parts = masked.split(/(?<=[.!?])\s+(?=[A-Z'"\u2018\u201C])/)
  return parts
    .map(p => p.replaceAll(PH, '.').trim())
    .filter(Boolean)
}

/** 切三段：标题区 / 课文 / 生词 / 译文（用锚点定位） */
function splitSections(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const listenIdx = lines.findIndex(l => /First listen/i.test(l))
  const wordIdx = lines.findIndex(l => l.includes('生词和短语'))
  const transIdx = lines.findIndex((l, i) => i > wordIdx && l.includes('参考译文'))

  // 课文区间 = listenIdx 到 wordIdx 之间
  // 跳过指令(EN+ZH) + 理解问题 + 空行：找到 listenIdx 后第一个空行
  const textLines = listenIdx >= 0 ? lines.slice(listenIdx, wordIdx) : lines.slice(0, wordIdx)
  const blankOffset = textLines.findIndex(l => l.trim() === '')
  const passageStart = blankOffset >= 0 ? blankOffset + 1 : 3 // 回退：跳 3 个非空行
  const passageLines = textLines.slice(passageStart)

  return {
    titleLines: lines.slice(0, listenIdx >= 0 ? listenIdx : wordIdx),
    passageLines,
    wordLines: lines.slice(wordIdx + 1, transIdx >= 0 ? transIdx : lines.length),
    transLines: transIdx >= 0 ? lines.slice(transIdx + 1) : [],
  }
}

/**
 * 解析生词段：返回 [{ word, meaning }]
 * NCE2 格式：`private  adj. 私人的`（单词 + 双空格 + 词性. 释义）
 */
function parseWords(wordLines) {
  const words = []
  for (const raw of wordLines) {
    const line = raw.trim()
    if (!line || !/[a-z]/i.test(line))
      continue

    // 优先按 2+ 空格分割：word | POS. meaning
    const parts = line.split(/\s{2,}/).map(s => s.trim()).filter(Boolean)
    if (parts.length >= 2 && POS_RE.test(parts[1])) {
      words.push({ word: parts[0], meaning: parts.slice(1).join('  ') })
    }
    else if (POS_RE.test(line)) {
      // 回退：单空格 `word POS. meaning`
      const m = line.match(/^(\S+) (.*)$/)
      if (m)
        words.push({ word: m[1], meaning: m[2] })
    }
  }
  return words
}

/** 解析标题 */
function parseTitle(titleLines, lesson) {
  const text = titleLines.map(l => l.trim()).filter(Boolean)
  // NCE2: ["Lesson N", "English Title", "Chinese Title"]
  const en = text.find(l => !/Lesson\s/i.test(l) && /[a-z]/i.test(l)) ?? ''
  const zh = text.find(l => CJK_RE.test(l)) ?? ''
  return { en: en || `Lesson ${lesson}`, zh }
}

/** 解析单个文件 → 课程对象 */
function parseLesson(text, lesson) {
  const { titleLines, passageLines, wordLines, transLines } = splitSections(text)
  const title = parseTitle(titleLines, lesson)
  const words = parseWords(wordLines)

  // 逐行切分句子（保留对话行边界，段落内按句末符切分）
  const sentences = passageLines
    .map(l => l.trim())
    .filter(l => l && /[a-z]/i.test(l)) // 只保留含英文的非空行
    .flatMap(l => splitSentences(l))
    .map(s => ({ sentence: s, translation: null }))

  // 源参考译文（整段，供 AI 对齐）
  const rawZh = transLines.map(l => l.trim()).filter(Boolean).join('\n')

  return {
    lesson,
    title,
    words,
    sentences,
    aligned: false,
    raw: { zh: rawZh },
  }
}

// ── 主流程 ────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true })
for (const f of readdirSync(OUT_DIR)) {
  if (/\.json$/i.test(f))
    rmSync(join(OUT_DIR, f))
}

const files = readdirSync(SRC_DIR)
  .filter(f => /\.TXT$/i.test(f))
  .map(f => ({ file: join(SRC_DIR, f), lesson: Number(f.replace(/\.TXT$/i, '')) }))
  .filter(x => Number.isFinite(x.lesson))
  .sort((a, b) => a.lesson - b.lesson)

console.log(`源目录：${SRC_DIR}`)
console.log(`输出：${OUT_DIR}`)
console.log(`发现 ${files.length} 个源文件\n`)

let totalSentences = 0
let totalWords = 0
for (const { file, lesson } of files) {
  const text = decodeGbk(file)
  const obj = parseLesson(text, lesson)
  totalSentences += obj.sentences.length
  totalWords += obj.words.length
  const outPath = join(OUT_DIR, `${String(lesson).padStart(3, '0')}.json`)
  writeFileSync(outPath, `${JSON.stringify(obj, null, 2)}\n`)
  console.log(`  ○ Lesson ${String(lesson).padStart(3)}: ${obj.words.length} 词 / ${obj.sentences.length} 句`)
}

console.log(`\n完成：${files.length} 个 JSON 已生成于 ${OUT_DIR}`)
console.log(`汇总：${totalWords} 词 / ${totalSentences} 句`)
