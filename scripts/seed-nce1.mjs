// scripts/seed-nce1.mjs
// 新概念英语第一册 单词+课文句子 批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-nce1.mjs [baseURL]
// 幂等：可重复运行——教材按 stage+name+publisher 复用，单词/句子按唯一约束去重
// 源数据：docs/new_concept_english/1/*.TXT（已转码为 UTF-8，72 个主课）
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')
const DATA_DIR = new URL('../docs/new_concept_english/1/', import.meta.url).pathname

// ── 教材信息 ──────────────────────────────────────────────────────
const textbook = {
  stage: '其他',
  name: '新概念英语第一册',
  publisher: '外研社',
}

// ── 解析工具 ──────────────────────────────────────────────────────

/** 已知词性标记 */
const POS_RE = /^(?:n|v|pron|int|adj|num|adv|art|prep|conj|aux|modal|possessive adjective)\b/i
const CJK_RE = /[\u4E00-\u9FFF]/

function toLines(text) {
  return text.replace(/\r\n/g, '\n').split('\n')
}

/** 用中文锚点切三段：课文 / 生词 / 译文 */
function splitSections(text) {
  const lines = toLines(text)
  const wordIdx = lines.findIndex(l => l.includes('生词和短语'))
  const transIdx = lines.findIndex((l, i) => i > wordIdx && l.includes('参考译文'))
  const listenIdx = lines.findIndex(l => /Listen to the tape/i.test(l))
  const textStart = listenIdx >= 0 ? listenIdx + 2 : 0
  return {
    textLines: lines.slice(textStart, wordIdx),
    wordLines: lines.slice(wordIdx + 1, transIdx >= 0 ? transIdx : lines.length),
    transLines: transIdx >= 0 ? lines.slice(transIdx + 1) : [],
  }
}

/** 解析生词段：返回 [{ word, meaning }] */
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
      pending = line
    }
  }
  return words
}

/** 剥离说话人标签（英文 STEVEN: / 中文 杰克逊先生：） */
function stripSpeaker(line) {
  const en = line.match(/^([A-Z][A-Z .&'-]*):(.*)$/)
  if (en)
    return en[2].trim()
  // 中文说话人：1-12 个非冒号字符（可含空格，如「学  生」）后跟全/半角冒号
  const zh = line.match(/^([^：:]{1,12})[：:](.*)$/)
  if (zh)
    return zh[2].trim()
  return line
}

/**
 * 按说话人轮次分组，返回纯文本轮次数组（去标签）
 *  规则：有说话人标签 => 新轮次（无论缩进）；无标签且深缩进 => 续行并入上一轮次；
 *  无标签且浅缩进 => 新轮次（无标签对白，如 Lesson 1）
 */
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
 * 合并未完结轮次：不以终止标点（.!?。！？）结尾的英文轮次并入下一轮次
 *  处理叙事课文中跨行折断但无缩进的句子（如 Lesson 33）
 */
function mergeIncomplete(turns) {
  const out = []
  for (const t of turns) {
    if (out.length > 0 && !/[.!?。！？]["')\]]?$/.test(out[out.length - 1]))
      out[out.length - 1] += ` ${t}`
    else
      out.push(t)
  }
  return out
}

/**
 * 配对英文轮次与中文译文轮次
 *  仅对英文做 mergeIncomplete（处理叙事课文跨行折断）；
 *  中文译文每轮次已是完整一行，省略句末句号属正常，不应合并
 */
function pairSentences(textLines, transLines) {
  const en = mergeIncomplete(groupTurns(textLines))
  const zh = groupTurns(transLines)
  const sentences = []
  const n = Math.min(en.length, zh.length)
  for (let i = 0; i < n; i++) {
    sentences.push({ sentence: en[i], translation: zh[i] })
  }
  // 轮次不匹配时，保留多出的英文句子（无译文）
  for (let i = n; i < en.length; i++) {
    sentences.push({ sentence: en[i], translation: undefined })
  }
  return { sentences, enCount: en.length, zhCount: zh.length }
}

/** 解析单个文件 */
function parseFile(file) {
  const text = readFileSync(file, 'utf8')
  const { textLines, wordLines, transLines } = splitSections(text)
  const words = parseWords(wordLines)
  const { sentences, enCount, zhCount } = pairSentences(textLines, transLines)
  return { words, sentences, enCount, zhCount }
}

// ── API 调用 ──────────────────────────────────────────────────────

async function api(path, options) {
  const res = await fetch(`${BASE}${path}`, options)
  const json = await res.json()
  if (!res.ok)
    throw new Error(`${path} 失败: ${json.error ?? res.status}`)
  return json.data
}

/** 查找或创建教材（幂等） */
async function ensureTextbook() {
  const list = await api('/english/api/textbooks')
  const existing = list.find(tb =>
    tb.stage === textbook.stage && tb.name === textbook.name && tb.publisher === textbook.publisher,
  )
  if (existing) {
    console.log(`  · 命中已有教材：id=${existing.id}`)
    return existing
  }
  const created = await api('/english/api/textbooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(textbook),
  })
  console.log(`  · 新建教材：id=${created.id}`)
  return created
}

// ── 主流程 ────────────────────────────────────────────────────────

async function main() {
  console.log(`目标服务：${BASE}`)
  console.log(`源数据目录：${DATA_DIR}\n`)

  // 1. 收集并按课号排序文件
  const files = readdirSync(DATA_DIR)
    .filter(f => /\.TXT$/i.test(f))
    .map(f => ({ file: join(DATA_DIR, f), lesson: Number(f.replace(/\.TXT$/i, '')) }))
    .filter(x => Number.isFinite(x.lesson))
    .sort((a, b) => a.lesson - b.lesson)

  console.log(`发现 ${files.length} 个源文件\n`)

  // 2. 解析全部文件
  const wordItems = []
  const sentenceItems = []
  const mismatches = []
  for (const { file, lesson } of files) {
    const { words, sentences, enCount, zhCount } = parseFile(file)
    for (const w of words)
      wordItems.push({ unitNumber: lesson, ...w })
    for (const s of sentences)
      sentenceItems.push({ unitNumber: lesson, ...s })
    if (enCount !== zhCount)
      mismatches.push(`Lesson ${lesson}: 英文 ${enCount} 条 / 译文 ${zhCount} 条`)
  }

  console.log(`解析完成：${wordItems.length} 个词条，${sentenceItems.length} 条课文句子`)
  if (mismatches.length > 0) {
    console.log(`\n⚠️ 以下课次英文/译文轮次数不一致（多出英文句子无译文）：`)
    for (const m of mismatches)
      console.log(`  · ${m}`)
  }
  console.log('')

  // --check：仅解析校验，不导入
  if (process.argv.includes('--check')) {
    // 抽样打印 3 课的配对结果供人工核对
    const samples = [53, 89]
    for (const lesson of samples) {
      const sents = sentenceItems.filter(s => s.unitNumber === lesson)
      console.log(`──── Lesson ${lesson} 配对抽样 (${sents.length} 条) ────`)
      for (const s of sents)
        console.log(`  EN: ${s.sentence}\n  ZH: ${s.translation ?? '—'}`)
    }
    console.log('\n--check 完成，未执行导入。')
    return
  }

  // 3. 确保教材存在
  console.log('准备教材…')
  const tb = await ensureTextbook()

  // 4. 批量导入单词
  console.log('\n批量导入单词…')
  const wordResult = await api('/english/api/batch/words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textbookId: tb.id, words: wordItems }),
  })
  console.log(`  ✓ 总计 ${wordResult.total} 条：新建 ${wordResult.created}，更新 ${wordResult.updated}`)

  // 5. 批量导入课文句子
  console.log('\n批量导入课文句子…')
  const sentResult = await api('/english/api/batch/sentences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textbookId: tb.id, sentences: sentenceItems }),
  })
  console.log(`  ✓ 总计 ${sentResult.total} 条：新建 ${sentResult.created}，跳过 ${sentResult.skipped}`)

  // 6. 分课汇总
  console.log('\n各课汇总：')
  const byLesson = new Map()
  for (const { unitNumber } of wordItems)
    byLesson.set(unitNumber, { words: 0, sentences: 0 })
  for (const w of wordItems)
    byLesson.get(w.unitNumber).words++
  for (const s of sentenceItems)
    byLesson.get(s.unitNumber).sentences++
  for (const [lesson, cnt] of [...byLesson].sort((a, b) => a[0] - b[0]))
    console.log(`  Lesson ${String(lesson).padStart(3)}: ${cnt.words} 词 / ${cnt.sentences} 句`)

  console.log('\n完成。')
}

main().catch((err) => {
  console.error('\n✗ 执行失败:', err.message)
  process.exit(1)
})
