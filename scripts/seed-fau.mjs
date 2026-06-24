// scripts/seed-fau.mjs
// 走遍美国（Family Album, U.S.A.）：批量导入 单词 + 课文句子 + 单元元数据
// 源：docs/family-album-usa/words.json（单词，含词性）+ family-album-usa.json（对话句子）
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-fau.mjs [baseURL]
// 幂等：教材按 stage+name+publisher 复用；单词 upsert 去重；句子按 position upsert；单元元数据 upsert
import { readFileSync } from 'node:fs'
import process from 'node:process'
import postgres from 'postgres'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')
const WORDS_SRC = new URL('../docs/family-album-usa/words.json', import.meta.url).pathname
const DIALOG_SRC = new URL('../docs/family-album-usa/family-album-usa.json', import.meta.url).pathname

const textbook = { stage: '其他', name: '走遍美国', publisher: '其他' }

// 加载 .env（DB 连接信息，用于写 english_unit 元数据）
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]])
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
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

/** 写单元元数据（标题）到 english_unit，upsert 幂等 */
async function ensureUnits(textbookId, unitMetas) {
  const sql = postgres(`postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_DB}`)
  for (const u of unitMetas) {
    await sql`
      insert into english_unit (textbook_id, unit_number, title, position)
      values (${textbookId}, ${u.unitNumber}, ${u.title}, ${u.position})
      on conflict (textbook_id, unit_number)
      do update set title = ${u.title}, position = ${u.position}
    `
  }
  await sql.end()
}

// ── 主流程 ────────────────────────────────────────────────────────

console.log(`目标服务：${BASE}`)
console.log(`单词源：${WORDS_SRC}`)
console.log(`对话源：${DIALOG_SRC}\n`)

// 1. 准备教材
console.log('准备教材…')
const tb = await ensureTextbook()

// 2. 收集单词（从 words.json）
const wordEntries = JSON.parse(readFileSync(WORDS_SRC, 'utf8'))
const wordItems = wordEntries.map(w => ({
  unitNumber: w.unitNumber,
  word: w.word,
  phonetic: w.phonetic || undefined,
  meaning: w.meaning,
}))
console.log(`\n单词：${wordItems.length} 条，覆盖 ${new Set(wordItems.map(w => w.unitNumber)).size} 个单元`)

// 3. 收集课文句子 + 单元元数据（从对话 JSON）
const episodes = JSON.parse(readFileSync(DIALOG_SRC, 'utf8'))
const sentenceItems = []
const unitMetas = []
for (const ep of episodes) {
  for (const act of ep.acts) {
    const unitNumber = (ep.number - 1) * 3 + act.number
    const title = `${ep.english_title} - Act ${act.number}`
    unitMetas.push({ unitNumber, title, position: unitNumber })
    for (const line of act.lines) {
      sentenceItems.push({
        unitNumber,
        sentence: line.english,
        translation: line.chinese?.trim() || undefined,
      })
    }
  }
}
console.log(`课文句子：${sentenceItems.length} 条`)
console.log(`单元元数据：${unitMetas.length} 条（含标题）`)

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

// 6. 写单元元数据（标题）
console.log('\n写单元元数据（标题）…')
await ensureUnits(tb.id, unitMetas)
console.log(`  ✓ ${unitMetas.length} 个单元标题已写入`)

// 7. 汇总
console.log('\n各集汇总：')
for (const ep of episodes) {
  const start = (ep.number - 1) * 3 + 1
  const words = wordItems.filter(w => w.unitNumber >= start && w.unitNumber < start + 3).length
  const sents = sentenceItems.filter(s => s.unitNumber >= start && s.unitNumber < start + 3).length
  console.log(`  Ep ${String(ep.number).padStart(2)} ${ep.english_title}: ${words} 词 / ${sents} 句`)
}

console.log('\n完成。')
