// scripts/import-nce3.mjs
// 新概念英语第三册：从 JSON 导入数据库
// 源：docs/new_concept_english/3_format/*.json
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/import-nce3.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import postgres from 'postgres'

const BASE = (process.argv[2]?.startsWith('http') ? process.argv[2] : 'http://localhost:4321').replace(/\/$/, '')
const SRC_DIR = new URL('../docs/new_concept_english/3_format/', import.meta.url).pathname

const textbook = { stage: '其他', name: '新概念英语第三册', publisher: '外研社' }

// 手动加载 .env
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]])
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

async function api(path, options) {
  const res = await fetch(`${BASE}${path}`, options)
  const json = await res.json()
  if (!res.ok)
    throw new Error(`${path} 失败: ${json.error ?? res.status}`)
  return json.data
}

async function ensureTextbook() {
  const list = await api('/english/api/textbooks')
  const existing = list.find(tb =>
    tb.stage === textbook.stage && tb.name === textbook.name && tb.publisher === textbook.publisher,
  )
  if (existing)
    return existing
  return api('/english/api/textbooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(textbook),
  })
}

/** 删除某教材的全部课文句子 */
async function clearSentences(textbookId) {
  const sql = postgres(`postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_DB}`)
  const r = await sql`delete from english_sentence where textbook_id = ${textbookId} returning id`
  await sql.end()
  return r.length
}

// ── 主流程 ────────────────────────────────────────────────────────

const files = readdirSync(SRC_DIR)
  .filter(f => /\.json$/i.test(f))
  .map(f => ({ path: join(SRC_DIR, f), lesson: Number(f.replace(/\.json$/i, '')) }))
  .filter(x => Number.isFinite(x.lesson))
  .sort((a, b) => a.lesson - b.lesson)

console.log(`目标服务：${BASE}`)
console.log(`源目录：${SRC_DIR}`)
console.log(`发现 ${files.length} 个 JSON\n`)

const lessons = []
let withTrans = 0
for (const { path } of files) {
  const data = JSON.parse(readFileSync(path, 'utf8'))
  lessons.push(data)
  if (data.aligned)
    withTrans++
}

const wordItems = []
const sentenceItems = []
let nullTrans = 0
for (const d of lessons) {
  for (const w of d.words)
    wordItems.push({ unitNumber: d.lesson, word: w.word, meaning: w.meaning })
  for (const s of d.sentences) {
    sentenceItems.push({ unitNumber: d.lesson, sentence: s.sentence, translation: s.translation ?? undefined })
    if (!s.translation)
      nullTrans++
  }
}

console.log(`待导入：${lessons.length} 课 / ${wordItems.length} 词 / ${sentenceItems.length} 句`)
console.log(`  其中 ${withTrans} 课带完整译文，${sentenceItems.length - nullTrans} 句有译文、${nullTrans} 句待补\n`)

// 确保教材
console.log('准备教材…')
const tb = await ensureTextbook()
console.log(`  · 教材 id=${tb.id}`)

// 清理旧句子
console.log('\n清理该教材旧课文句子…')
const cleared = await clearSentences(tb.id)
console.log(`  · 已删除 ${cleared} 条旧句子`)

// 导入单词
console.log('\n导入单词…')
const wordResult = await api('/english/api/batch/words', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ textbookId: tb.id, words: wordItems }),
})
console.log(`  ✓ 总计 ${wordResult.total} 条：新建 ${wordResult.created}，更新 ${wordResult.updated}`)

// 导入句子（按课分批）
console.log('\n导入课文句子…')
let totalCreated = 0
let totalSkipped = 0
for (const d of lessons) {
  const lessonSentences = d.sentences.map(s => ({
    unitNumber: d.lesson,
    sentence: s.sentence,
    translation: s.translation ?? undefined,
  }))
  const result = await api('/english/api/batch/sentences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textbookId: tb.id, sentences: lessonSentences }),
  })
  totalCreated += result.created
  totalSkipped += result.skipped
}
console.log(`  ✓ 总计 ${sentenceItems.length} 条：新建 ${totalCreated}，跳过 ${totalSkipped}`)

console.log(`\n完成。导入 ${lessons.length}/${files.length} 课。`)
