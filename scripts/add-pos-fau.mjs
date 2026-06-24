// scripts/add-pos-fau.mjs
// 走遍美国：为已生成的 words.json 增量添加词性标注
// 格式：同一词性释义用"，"分隔（词性前缀只写一次）；不同词性用"；"分隔
//   photographer — 摄影师        → n. 摄影师
//   appreciate   — 欣赏；感激     → vt. 欣赏，感激
//   set          — 设置；一套     → v. 设置；n. 一套
// 幂等：meaning 已带词性前缀(如 "n. ")的自动跳过
// 用法：node scripts/add-pos-fau.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

const SRC = new URL('../docs/family-album-usa/words.json', import.meta.url).pathname
const CONCURRENCY = Number(process.env.TRANSLATION_CONCURRENCY) || 3
const BATCH = 50 // 每批发送的单词条数

// 加载 .env
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]])
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const API_KEY = process.env.ZHIPUAI_API_KEY
const BASE_URL = process.env.ZHIPUAI_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4'
const MODEL = process.env.ZHIPUAI_MODEL ?? 'glm-5.2'

if (!API_KEY) {
  console.error('✗ 请在 .env 中设置 ZHIPUAI_API_KEY')
  process.exit(1)
}

// ── GLM 调用 ──────────────────────────────────────────────────────

async function callGLM(system, user, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`)
      }
      const data = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (!content)
        throw new Error('API 返回空内容')
      return JSON.parse(content)
    }
    catch (err) {
      if (attempt >= retries)
        throw err
      await new Promise(r => setTimeout(r, 2000 * attempt))
    }
  }
}

// ── 词性标注 ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = [
  '你是英语词典编辑。给定一个英语单词及其现有中文释义，请为释义添加词性标注。',
  '',
  '规则：',
  '1. 判断每个义项的词性，用英文缩写：n. v. vt. vi. adj. adv. prep. conj. art. 等',
  '2. 同一词性的多个释义合并到一个词性前缀下，用中文逗号"，"分隔（词性只写一次）',
  '3. 不同词性的释义组用中文分号"；"分隔',
  '4. 词性放在释义之前，词性后接一个空格再接释义',
  '5. 保持原有释义内容不变，只做词性分组与格式化',
  '',
  '示例：',
  '  photographer — 摄影师          → n. 摄影师',
  '  appreciate — 欣赏；感激        → vt. 欣赏，感激',
  '  set — 设置；一套               → v. 设置；n. 一套',
  '  picture — 照片；图画           → n. 照片，图画',
  '',
  '输出 JSON：{"results": [{"word": "原词", "meaning": "带词性的新释义"}]}',
].join('\n')

/**
 * 为一批单词添加词性
 * @param items [{word, meaning}]
 * @returns Map<word, enrichedMeaning>
 */
async function addPosBatch(items) {
  const numbered = items.map((it, i) => `${i + 1}. ${it.word} — ${it.meaning}`).join('\n')
  const user = [
    `请为以下 ${items.length} 个单词的释义添加词性标注（保持原释义内容，只做词性分组格式化）：`,
    '',
    numbered,
    '',
    `输出 JSON：{"results": [{"word": "原词", "meaning": "带词性的新释义"}]}`,
    `注意：results 数组长度必须等于 ${items.length}，且每个 word 与输入完全一致。`,
  ].join('\n')

  const result = await callGLM(SYSTEM_PROMPT, user)
  const results = result.results ?? result.data ?? []

  const map = new Map()
  for (const r of results) {
    const word = String(r.word ?? '').trim()
    const meaning = String(r.meaning ?? '').trim()
    if (word && meaning)
      map.set(word, meaning)
  }
  return map
}

// ── 主流程 ────────────────────────────────────────────────────────

console.log(`走遍美国 | 词性标注 | ${BASE_URL} / ${MODEL}`)
console.log(`源文件：${SRC}`)
console.log(`并发：${CONCURRENCY} | 批大小：${BATCH}\n`)

const entries = JSON.parse(readFileSync(SRC, 'utf8'))
console.log(`总词条：${entries.length}`)

// 词性前缀检测：如 "n. " "vt. " "v./n. " 已带词性的跳过
const POS_PREFIX_RE = /^[a-z]{1,4}\.\s/

// 收集待处理（按 word 去重，避免重复调用）
const pendingMap = new Map() // word -> meaning
let alreadyDone = 0
for (const e of entries) {
  if (POS_PREFIX_RE.test(e.meaning ?? '')) {
    alreadyDone++
    continue
  }
  if (!pendingMap.has(e.word))
    pendingMap.set(e.word, e.meaning)
}

const pending = [...pendingMap.entries()].map(([word, meaning]) => ({ word, meaning }))
console.log(`已带词性：${alreadyDone}，待处理（去重后）：${pending.length}\n`)

if (pending.length === 0) {
  console.log('全部词条已带词性，无需处理。')
  process.exit(0)
}

// 分批并发处理
const enriched = new Map() // word -> 新释义
let ok = 0
let fail = 0

for (let i = 0; i < pending.length; i += CONCURRENCY * BATCH) {
  // 取 CONCURRENCY 个批，每批 BATCH 个词
  const round = []
  for (let c = 0; c < CONCURRENCY && i + c * BATCH < pending.length; c++) {
    const start = i + c * BATCH
    const batch = pending.slice(start, start + BATCH)
    round.push(batch)
  }

  const settled = await Promise.allSettled(round.map(batch => addPosBatch(batch)))

  for (const r of settled) {
    if (r.status === 'fulfilled') {
      ok += r.value.size
      for (const [w, m] of r.value)
        enriched.set(w, m)
    }
    else {
      fail += BATCH
      console.error(`  ✗ 批次失败: ${r.reason.message}`)
    }
  }

  const done = Math.min(i + CONCURRENCY * BATCH, pending.length)
  console.log(`  进度 ${done}/${pending.length}（累计成功 ${ok}）`)

  // 每轮写回一次（崩溃安全）
  applyAndWrite(entries, enriched)
}

// 汇总
console.log(`\n完成：成功 ${ok}，失败 ${fail}`)
const withPos = entries.filter(e => POS_PREFIX_RE.test(e.meaning ?? '')).length
console.log(`带词性词条：${withPos}/${entries.length}`)
console.log(`已写入：${SRC}`)

if (fail > 0) {
  console.log('\n⚠ 有失败词条，可重新运行本脚本断点续传')
  process.exit(1)
}

/** 把 enriched 映射写回 entries 并落盘 */
function applyAndWrite(allEntries, map) {
  for (const e of allEntries) {
    if (map.has(e.word))
      e.meaning = map.get(e.word)
  }
  writeFileSync(SRC, `${JSON.stringify(allEntries, null, 2)}\n`)
}
