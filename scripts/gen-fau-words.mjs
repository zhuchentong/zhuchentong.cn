// scripts/gen-fau-words.mjs
// 走遍美国（Family Album, U.S.A.）：AI 逐幕抽取词汇表
// 源：docs/family-album-usa/family-album-usa.json（26 集 × 3 幕 = 78 单元）
// 输出：docs/family-album-usa/words.json（供人工复核，复核后再由 seed-fau.mjs 导入）
// 用法：node scripts/gen-fau-words.mjs
// 并发：默认 5 路，TRANSLATION_CONCURRENCY 可调
// 断点续传：words.json 中已有的单元自动跳过
import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

const SRC = new URL('../docs/family-album-usa/family-album-usa.json', import.meta.url).pathname
const OUT = new URL('../docs/family-album-usa/words.json', import.meta.url).pathname
const CONCURRENCY = Number(process.env.TRANSLATION_CONCURRENCY) || 5

// 加载 .env（取 ZHIPUAI 配置）
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

/** 调用 GLM API，返回解析后的 JSON 对象 */
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

// ── 词汇抽取 ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = [
  '你是一位资深英语教材词汇编辑。任务：从一段英语对话中提取适合学习者掌握的重点单词。',
  '',
  '提取规则：',
  '1. 只提取【单个单词】，严禁词组/短语/搭配（如 "take a picture" 不要，只取 picture；"exchange student" 不要，只取 exchange）',
  '2. 严禁所有专有名词：人名(Susan/Richard/Marilyn/Harry/Alexandra/Gerald/Robbie/Philip/Ellen)、地名(New York/California/Bronx/Thessaloniki/Florida)、机构名、品牌名、语言/民族名(Greek/English/Hispanic/American) 一律不要。判断标准：英语单词原形都是小写，凡首字母大写的词基本是专有名词，必须排除',
  '3. 跳过基础功能词：冠词、介词、连词、助动词、代词、be 动词、感叹词(Oh/Well/Hey)',
  '4. 提取有学习价值的实词：名词、动词、形容词、副词',
  '5. word 用单词原形（必须小写）：动词用原形(take 而非 took)，名词用单数(picture 而非 pictures)',
  '6. phonetic 用国际音标 IPA，含斜杠，如 /ˈfɒtəɡrəfə/',
  '7. meaning 用标准中文释义（以牛津/朗文词典为准，不可臆造），并标注词性前缀。同一词性的多个释义合并到一个前缀下用中文逗号「，」分隔，不同词性用中文分号「；」分隔，词性置于释义前。格式示例：photographer→「n. 摄影师」；appreciate→「vt. 欣赏，感激」；set→「v. 设置；n. 一套」。词性缩写：n./v./vt./vi./adj./adv./prep./conj.',
  '8. 不要输出 example 字段',
  '9. 最多提取 25 个单词——优先选本幕中最重要、最有学习价值的词',
  '',
  '输出 JSON：{"words": [{"word":"...", "phonetic":"/.../", "meaning":"..."}]}',
].join('\n')

/**
 * 为一幕对话抽取词汇（单个单词，无例句）
 * @param episode 集号
 * @param title 集标题（英文）
 * @param act 幕号
 * @param lines 该幕台词（含 english）
 * @returns 抽取出的词条数组
 */
async function extractWords(episode, title, act, lines) {
  const numbered = lines.map((l, i) => `${i + 1}. ${l.english}`).join('\n')

  const user = [
    `以下是《走遍美国》(Family Album, U.S.A.) 第 ${episode} 集《${title}》第 ${act} 幕的对话：`,
    '',
    numbered,
    '',
    '请提取本幕重点【单个单词】（不含专有名词、不含词组），输出 JSON：{"words": [{"word":"...", "phonetic":"/.../", "meaning":"..."}]}',
  ].join('\n')

  const result = await callGLM(SYSTEM_PROMPT, user)
  const words = result.words ?? result.data ?? []

  if (!Array.isArray(words))
    throw new Error(`返回格式异常：${JSON.stringify(result).slice(0, 200)}`)

  return words.map((w) => {
    const word = String(w.word ?? '').trim()
    const meaning = String(w.meaning ?? '').trim()
    return {
      word,
      phonetic: String(w.phonetic ?? '').trim() || undefined,
      meaning,
    }
  }).filter((w) => {
    // 客户端兜底过滤：去掉词组、空值、专有名词
    if (!w.word || !w.meaning)
      return false
    // 含空格视为词组，丢弃
    if (/\s/.test(w.word))
      return false
    // 首字母大写 = 专有名词（人名/地名等），丢弃（"I" 除外，但代词本就应被 GLM 跳过）
    if (/^[A-Z]/.test(w.word))
      return false
    return true
  })
}

// ── 主流程 ────────────────────────────────────────────────────────

console.log(`走遍美国 | 词汇生成 | ${BASE_URL} / ${MODEL}`)
console.log(`源文件：${SRC}`)
console.log(`输出：${OUT}`)
console.log(`并发：${CONCURRENCY}\n`)

const episodes = JSON.parse(readFileSync(SRC, 'utf8'))

// 构造 78 个单元任务
const units = []
for (const ep of episodes) {
  for (const act of ep.acts) {
    const unitNumber = (ep.number - 1) * 3 + act.number
    const title = `${ep.english_title} - Act ${act.number}`
    units.push({ unitNumber, title, episode: ep.number, act: act.number, episodeTitle: ep.english_title, lines: act.lines })
  }
}

// 加载已有结果（断点续传）：按 unitNumber 聚合到 unitMap
const unitMap = new Map()
try {
  const existing = JSON.parse(readFileSync(OUT, 'utf8'))
  for (const w of existing) {
    if (!unitMap.has(w.unitNumber))
      unitMap.set(w.unitNumber, { title: w.title, words: [] })
    unitMap.get(w.unitNumber).words.push({ word: w.word, phonetic: w.phonetic, meaning: w.meaning })
  }
  console.log(`断点续传：已有 ${unitMap.size} 个单元的词条\n`)
}
catch {
  // 首次运行
}

// 过滤待处理单元
const doneUnits = new Set(unitMap.keys())
const pending = units.filter(u => !doneUnits.has(u.unitNumber))
console.log(`待处理：${pending.length} 个单元（共 ${units.length}）\n`)

// ── 抽取阶段（并行）──────────────────────────────────────────────
let ok = 0
let fail = 0

for (let i = 0; i < pending.length; i += CONCURRENCY) {
  const chunk = pending.slice(i, i + CONCURRENCY)
  const settled = await Promise.allSettled(chunk.map(u =>
    extractWords(u.episode, u.episodeTitle, u.act, u.lines).then(words => ({ ...u, words })),
  ))

  for (let j = 0; j < settled.length; j++) {
    const r = settled[j]
    const u = chunk[j]
    if (r.status === 'fulfilled') {
      ok++
      unitMap.set(u.unitNumber, { title: u.title, words: r.value.words })
      console.log(`  ✓ Unit ${String(u.unitNumber).padStart(2)} ${u.title}: ${r.value.words.length} 词`)
    }
    else {
      fail++
      console.error(`  ✗ Unit ${String(u.unitNumber).padStart(2)} ${u.title}: ${r.reason.message}`)
    }
  }

  // 每批写入一次原始结果（崩溃安全；尚未去重）
  writeRaw(unitMap)
}

// ── 去重阶段（全局：首次出现优先，每单元上限 25）──────────────────
console.log('\n跨单元去重（首次出现优先，每单元 ≤25）…')
const seen = new Set()
const results = []
let dropped = 0
for (const unitNumber of [...unitMap.keys()].sort((a, b) => a - b)) {
  const { title, words } = unitMap.get(unitNumber)
  const kept = []
  for (const w of words) {
    if (kept.length >= 25)
      break
    const key = w.word.toLowerCase() // 大小写不敏感去重
    if (seen.has(key)) {
      dropped++
      continue
    }
    seen.add(key)
    kept.push(w)
  }
  for (const w of kept)
    results.push({ unitNumber, title, ...w })
}

writeFileSync(OUT, `${JSON.stringify(results, null, 2)}\n`)

// 汇总
const wordCount = results.length
const withPhonetic = results.filter(w => w.phonetic).length
console.log(`\n完成：${ok} 单元成功，${fail} 单元失败`)
console.log(`去重丢弃：${dropped} 词（重复归属后续单元）`)
console.log(`词条总计：${wordCount}（带音标 ${withPhonetic}）`)
console.log(`已写入：${OUT}`)

if (fail > 0) {
  console.log('\n⚠ 有失败单元，可重新运行本脚本断点续传')
  process.exit(1)
}

/** 把 unitMap 展平写入文件（原始数据，含跨单元重复，供断点续传） */
function writeRaw(map) {
  const flat = []
  for (const unitNumber of [...map.keys()].sort((a, b) => a - b)) {
    const { title, words } = map.get(unitNumber)
    for (const w of words)
      flat.push({ unitNumber, title, ...w })
  }
  writeFileSync(OUT, `${JSON.stringify(flat, null, 2)}\n`)
}
