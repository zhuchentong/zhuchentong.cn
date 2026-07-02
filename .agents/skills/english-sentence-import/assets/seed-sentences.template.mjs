// scripts/seed-grade{N}{a|b}-sentences.mjs — TEMPLATE
// {publisher}{grade}{semester} 课文句子批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-grade{N}{a|b}-sentences.mjs [baseURL]
// 幂等：可重复运行，已存在的 (textbookId, unitNumber, sentence) 自动跳过
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')

// ── 教材信息（需与单词脚本一致）────────────────────────────────────
const textbook = {
  stage: '小学', // '小学' | '初中' | '高中' | '其他'
  name: 'X年级X册', // e.g. '四年级上册'
  publisher: '人教版', // e.g. '人教版', '外研版', '译林版'
  grade: 'X年级', // e.g. '四年级'
  semester: '上', // '上' | '下'
}

// ── 各单元课文句子 ────────────────────────────────────────────────
// 格式：{ sentence: 'English', translation: '中文翻译' }
// 撇号用 \' 转义（如 What\'s）
const units = [
  {
    unitNumber: 1,
    sentences: [
      // { sentence: 'English sentence.', translation: '中文翻译。' },
    ],
  },
  // { unitNumber: 2, sentences: [ ... ] },
]

// ── 以下为固定 boilerplate，无需修改 ──────────────────────────────

const allSentences = units.flatMap(u =>
  u.sentences.map(s => ({
    unitNumber: u.unitNumber,
    sentence: s.sentence,
    translation: s.translation,
  })),
)

async function findTextbook() {
  const res = await fetch(`${BASE}/english/api/textbooks`)
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`查询教材失败: ${json.error ?? res.status}`)
  }
  return json.data.find(tb => tb.publisher === textbook.publisher && tb.name === textbook.name)
}

async function createTextbook() {
  const res = await fetch(`${BASE}/english/api/textbooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(textbook),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`创建教材失败: ${json.error ?? res.status}`)
  }
  return json.data
}

async function batchAddSentences(textbookId) {
  const res = await fetch(`${BASE}/english/api/batch/sentences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textbookId, sentences: allSentences }),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`批量导入句子失败: ${json.error ?? res.status}`)
  }
  return json.data
}

async function main() {
  console.log(`目标服务：${BASE}`)
  console.log(`待导入：${allSentences.length} 句课文句子，分布于 ${units.length} 个单元\n`)

  console.log('查询教材…')
  let tb = await findTextbook()
  if (tb) {
    console.log(`  ✓ 教材已存在：id=${tb.id} ${tb.publisher}·${tb.stage}·${tb.name}\n`)
  }
  else {
    console.log('  教材不存在，创建中…')
    tb = await createTextbook()
    console.log(`  ✓ 教材已创建：id=${tb.id} ${tb.publisher}·${tb.stage}·${tb.name}\n`)
  }

  console.log('批量导入课文句子…')
  const result = await batchAddSentences(tb.id)
  console.log(`  ✓ 总计 ${result.total} 条：新建 ${result.created}，跳过 ${result.skipped}\n`)

  for (const u of units) {
    console.log(`  Unit ${u.unitNumber}: ${u.sentences.length} 句`)
  }
  console.log('\n完成。')
}

main().catch((err) => {
  console.error('\n✗ 执行失败:', err.message)
  process.exit(1)
})
