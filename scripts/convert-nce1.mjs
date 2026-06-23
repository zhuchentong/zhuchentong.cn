// scripts/convert-nce1.mjs
// 新概念英语第一册：逐文件 TXT → JSON 转换器
// 源：docs/new_concept_english/1/*.TXT（UTF-8）
// 产物：docs/new_concept_english/1_format/{lesson}.json
// 对齐失败的文件输出 aligned:false 并附 raw 供人工修正
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC_DIR = new URL('../docs/new_concept_english/1/', import.meta.url).pathname
const OUT_DIR = new URL('../docs/new_concept_english/1_format/', import.meta.url).pathname

// ── 解析工具 ──────────────────────────────────────────────────────

const POS_RE = /^(?:n|v|pron|int|adj|num|adv|art|prep|conj|aux|modal|possessive adjective)\b/i
const CJK_RE = /[\u4E00-\u9FFF]/

/** 剥离说话人标签（英文 STEVEN: / 中文 杰克逊先生：） */
function stripSpeaker(line) {
  const en = line.match(/^[A-Z][A-Z .&'-]*:([\s\S]*)$/)
  if (en)
    return en[1].trim()
  const zh = line.match(/^[^：:]{1,12}[：:]([\s\S]*)$/)
  if (zh)
    return zh[1].trim()
  return line
}

/** 按说话人轮次分组（去标签、合并续行） */
function groupTurns(lines) {
  const turns = []
  for (const raw of lines) {
    if (!raw.trim())
      continue
    const indent = raw.length - raw.trimStart().length
    const line = raw.trim()
    const stripped = stripSpeaker(line)
    const hasLabel = stripped !== line && stripped.length > 0
    if (hasLabel) {
      turns.push(stripped)
    }
    else if (indent >= 6 && turns.length > 0) {
      turns[turns.length - 1] += ` ${line}`
    }
    else {
      turns.push(line)
    }
  }
  return turns.filter(t => t.length > 0)
}

/**
 * 合并英文折行：以逗号结尾，或无终止符且下一句小写开头（仅英文）
 *  处理 "clouds in the sky," / "My wife and I are walking" 等折行残片
 */
function mergeWrap(turns) {
  const out = []
  for (const t of turns) {
    const prev = out[out.length - 1]
    if (out.length > 0 && (prev.endsWith(',') || (!/[.!?]["')\]]?$/.test(prev) && /^[a-z]/.test(t))))
      out[out.length - 1] += ` ${t}`
    else
      out.push(t)
  }
  return out
}

/** 拆分段落为独立句子（按句终止符），英文保护 Mr./Mrs. 等缩写 */
function splitSentences(turn, zh = false) {
  if (zh) {
    const parts = turn.match(/[^。！？]*[。！？]+["'）\]]*|[^。！？]+$/g) || [turn]
    return parts.map(p => p.trim()).filter(Boolean)
  }
  const PH = '\uFFFF'
  const masked = turn
    .replace(/\b(Mr|Mrs|Ms|Dr|St|Prof|Mt|Jr|Sr)\./g, `$1${PH}`)
    .replace(/\b((?:[A-Z]\.\s?){2,})/gi, m => m.replace(/\./g, PH))
  const parts = masked.match(/[^.!?]*[.!?]+["')\]]*|[^.!?]+$/g) || [turn]
  return parts.map(p => p.replaceAll(PH, '.').trim()).filter(Boolean)
}

/**
 * 按连续省略号 … … 切分英文轮次（仅在含 2+ 个 … 时）
 *  处理 "We're tired … … and thirsty" → ["We're tired …", "… and thirsty"]
 *  单个尾随 … 视为一次停顿，不切分
 */
function splitAtEllipsis(turn) {
  const count = (turn.match(/…/g) || []).length
  if (count < 2)
    return [turn]
  const parts = turn.split(/…\s*…/)
  if (parts.length <= 1)
    return [turn]
  const out = []
  for (let i = 0; i < parts.length; i++) {
    let p = parts[i].trim()
    if (!p)
      continue
    if (i < parts.length - 1)
      p = `${p} …`
    if (i > 0)
      p = `… ${p}`
    out.push(p)
  }
  return out
}

/** 切三段：课文 / 生词 / 译文（用中文锚点） */
function splitSections(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const wordIdx = lines.findIndex(l => l.includes('生词和短语'))
  const transIdx = lines.findIndex((l, i) => i > wordIdx && l.includes('参考译文'))
  const listenIdx = lines.findIndex(l => /Listen to the tape/i.test(l))
  const textStart = listenIdx >= 0 ? listenIdx + 2 : 0
  return {
    titleLines: lines.slice(0, listenIdx >= 0 ? listenIdx : wordIdx),
    textLines: lines.slice(textStart, wordIdx),
    wordLines: lines.slice(wordIdx + 1, transIdx >= 0 ? transIdx : lines.length),
    transLines: transIdx >= 0 ? lines.slice(transIdx + 1) : [],
  }
}

/** 解析生词段：去括注，返回 [{ word, meaning }] */
function parseWords(wordLines) {
  const words = []
  let pending = null
  for (const raw of wordLines) {
    const line = raw.replace(/\s+/g, ' ').trim()
    if (!line)
      continue
    const hasCJK = CJK_RE.test(line)
    const isPOS = POS_RE.test(line)
    if (pending && (hasCJK || isPOS)) {
      words.push({ word: pending, meaning: line.replace(/\s{2,}/g, ' ').trim() })
      pending = null
    }
    else if (!hasCJK && !isPOS) {
      // 去掉词尾括注（如 read (read, read) → read）
      pending = line.replace(/\s*\(.*$/, '').trim()
    }
  }
  return words
}

/** 解析标题 */
function parseTitle(titleLines, lesson) {
  const text = titleLines.map(l => l.trim()).filter(Boolean)
  const en = text.find(l => /Lesson/i.test(l))?.replace(/^.*?Lesson\s*\d+\s*/, '').trim() || ''
  return { en: en || `Lesson ${lesson}`, zh: text[1] ?? '' }
}

/** 解析单个文件 → 课程对象 */
function parseLesson(text, lesson) {
  const { titleLines, textLines, wordLines, transLines } = splitSections(text)
  const title = parseTitle(titleLines, lesson)
  const words = parseWords(wordLines)

  // 统一按句切分：英文（合并逗号折行 → 省略号切分 → 按句号切分）；
  // 中文（按句号切分，不合并逗号折行）
  const en = mergeWrap(groupTurns(textLines)).flatMap(splitAtEllipsis).flatMap(t => splitSentences(t, false))
  const zh = groupTurns(transLines).flatMap(t => splitSentences(t, true))

  const aligned = en.length === zh.length && en.length > 0
  // 对齐：配对译文；未对齐：英文全部入库，译文留空（附 raw 备日后补）
  const sentences = aligned
    ? en.map((s, i) => ({ sentence: s, translation: zh[i] }))
    : en.map(s => ({ sentence: s, translation: null }))

  const obj = { lesson, title, words, sentences, aligned }
  if (!aligned)
    obj.raw = { en, zh }
  return obj
}

// ── 主流程 ────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true })
// 清空旧 JSON（避免旧命名 1.json 与新 001.json 并存）
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

const flagged = []
for (const { file, lesson } of files) {
  const text = readFileSync(file, 'utf8')
  const obj = parseLesson(text, lesson)
  const outPath = join(OUT_DIR, `${String(lesson).padStart(3, '0')}.json`)
  writeFileSync(outPath, `${JSON.stringify(obj, null, 2)}\n`)
  const mark = obj.aligned ? '✓' : '○'
  const trans = obj.aligned ? `${obj.sentences.length} 句(带译文)` : `${obj.sentences.length} 句(仅英文)`
  console.log(`  ${mark} Lesson ${String(lesson).padStart(3)}: ${obj.words.length} 词 / ${trans}`)
  if (!obj.aligned)
    flagged.push(lesson)
}

console.log(`\n完成：${files.length} 个 JSON 已生成于 ${OUT_DIR}`)
if (flagged.length > 0) {
  console.log(`\n○ ${flagged.length} 个文件未对齐（英文已入库，译文待补）：`)
  console.log(`   ${flagged.join(', ')}`)
  console.log(`   这些 JSON 含 raw.{en,zh} 供日后补译文联想到管理后台。`)
}
