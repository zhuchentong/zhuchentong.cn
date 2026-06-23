// scripts/fill-translations.mjs
// 新概念英语：AI 逐句翻译（统一脚本，支持任意册号）
// 用法：node scripts/fill-translations.mjs <册号>
//   node scripts/fill-translations.mjs 2   # NCE2
//   node scripts/fill-translations.mjs 3   # NCE3
// 并发：默认 5 路，可通过 TRANSLATION_CONCURRENCY 环境变量调整
// 断点续传：已有译文的课自动跳过
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const BOOK = Number(process.argv[2])
if (!BOOK) {
  console.error('用法: node scripts/fill-translations.mjs <册号>')
  process.exit(1)
}

const CN_NUM = { 1: '一', 2: '二', 3: '三', 4: '四' }
const DIR = new URL(`../docs/new_concept_english/${BOOK}_format/`, import.meta.url).pathname
const BOOK_CN = CN_NUM[BOOK] ?? String(BOOK)
const CONCURRENCY = Number(process.env.TRANSLATION_CONCURRENCY) || 5

// 加载 .env
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !process.env[m[1]])
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const API_KEY = process.env.ZHIPUAI_API_KEY
const BASE_URL = process.env.ZHIPUAI_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4'
const MODEL = process.env.ZHIPUAI_MODEL ?? 'glm-4-flash'

if (!API_KEY) {
  console.error('✗ 请在 .env 中设置 ZHIPUAI_API_KEY')
  process.exit(1)
}

/** 调用 GLM API，返回 JSON 对象 */
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

/** 为一课生成译文 */
async function translateLesson(lesson) {
  const sentences = lesson.sentences.map(s => s.sentence)
  const count = sentences.length
  const sourceTrans = lesson.raw?.zh ?? ''

  const system = '你是一位专业英语教材翻译助手。你的任务是将英文句子逐句翻译成中文，参考已有的中文译文来保持术语和风格一致。每个英文句子必须得到一个独立的、完整的中文翻译。不要合并或遗漏任何句子。'

  const user = `以下是新概念英语第${BOOK_CN}册第 ${lesson.lesson} 课。

中文参考译文（仅供术语参考）：
${sourceTrans}

请将下列 ${count} 个英文句子逐句翻译为中文，保持参考译文的风格：
${sentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}

输出 JSON 格式：{"translations": ["第1句翻译", "第2句翻译", ...]}
注意：translations 数组长度必须等于 ${count}。`

  const result = await callGLM(system, user)
  const translations = result.translations ?? result.data ?? []

  if (!Array.isArray(translations) || translations.length !== count)
    throw new Error(`译文数量 ${translations.length} ≠ 英文句数 ${count}`)

  return translations
}

/** 处理单课：读取 → 翻译 → 回写 */
async function processLesson(file) {
  const d = JSON.parse(readFileSync(file.path, 'utf8'))
  if (d.sentences.every(s => s.translation))
    return { lesson: file.lesson, status: 'skip', count: d.sentences.length }

  const translations = await translateLesson(d)
  d.sentences = d.sentences.map((s, i) => ({ sentence: s.sentence, translation: translations[i] }))
  d.aligned = true
  delete d.raw
  writeFileSync(file.path, `${JSON.stringify(d, null, 2)}\n`)
  return { lesson: file.lesson, status: 'ok', count: translations.length }
}

// ── 主流程 ────────────────────────────────────────────────────────

const files = readdirSync(DIR)
  .filter(f => /\.json$/i.test(f))
  .map(f => ({ path: join(DIR, f), lesson: Number(f.replace(/\.json$/i, '')) }))
  .sort((a, b) => a.lesson - b.lesson)

console.log(`新概念英语第${BOOK_CN}册 | ${BASE_URL} / ${MODEL}`)
console.log(`源目录：${DIR}`)
console.log(`并发：${CONCURRENCY} | 待处理：${files.length} 课\n`)

let ok = 0
let skip = 0
let fail = 0

for (let i = 0; i < files.length; i += CONCURRENCY) {
  const chunk = files.slice(i, i + CONCURRENCY)
  const settled = await Promise.allSettled(chunk.map(f => processLesson(f)))

  for (let j = 0; j < settled.length; j++) {
    const r = settled[j]
    const lesson = chunk[j].lesson
    if (r.status === 'fulfilled') {
      if (r.value.status === 'ok') {
        ok++
        console.log(`  ✓ L${String(lesson).padStart(3)}: ${r.value.count} 句译文`)
      }
      else {
        skip++
      }
    }
    else {
      fail++
      console.error(`  ✗ L${String(lesson).padStart(3)}: ${r.reason.message}`)
    }
  }
}

console.log(`\n完成：${ok} 课已填充，${skip} 课跳过，${fail} 课失败`)
