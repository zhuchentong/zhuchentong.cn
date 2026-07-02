// scripts/seed-grade{N}{a|b}-words.mjs — TEMPLATE
// {publisher}{grade}{semester} 单词批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-grade{N}{a|b}-words.mjs [baseURL]
// 幂等：可重复运行，已存在的单词仅更新释义、关联去重
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')

// ── 教材信息（按实际情况修改）──────────────────────────────────────
const textbook = {
  stage: '小学', // '小学' | '初中' | '高中' | '其他'
  name: 'X年级X册', // e.g. '四年级上册'
  publisher: '人教版', // e.g. '人教版', '外研版', '译林版'
  grade: 'X年级', // e.g. '四年级'
  semester: '上', // '上' | '下'
}

// ── 跨单元重复词的合并义项常量（按需添加）─────────────────────────
// const XXX_MEANING = '义项1；义项2'

// ── 各单元词汇表 ──────────────────────────────────────────────────
// 格式：['word', '/phonetic/', 'meaning']
// 普通词小写；专有名词/缩写/尊称保留首字母大写
// 短语（如 office worker）作为独立词条
const units = [
  {
    unitNumber: 1,
    words: [
      // ['word', '/phonetic/', 'meaning'],
    ],
  },
  // { unitNumber: 2, words: [ ... ] },
]

// ── 以下为固定 boilerplate，无需修改 ──────────────────────────────

const wordItems = units.flatMap(unit =>
  unit.words.map(([word, phonetic, meaning]) => ({
    unitNumber: unit.unitNumber,
    word,
    phonetic,
    meaning,
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

async function batchAdd(textbookId) {
  const res = await fetch(`${BASE}/english/api/batch/words`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ textbookId, words: wordItems }),
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`批量添加单词失败: ${json.error ?? res.status}`)
  }
  return json.data
}

async function main() {
  console.log(`目标服务：${BASE}`)
  console.log(`待导入：${wordItems.length} 个词条，分布于 ${units.length} 个单元\n`)

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

  console.log('批量导入单词…')
  const result = await batchAdd(tb.id)
  console.log(`  ✓ 总计 ${result.total} 条：新建 ${result.created}，更新 ${result.updated}\n`)

  for (const unit of units) {
    console.log(`  Unit ${unit.unitNumber}: ${unit.words.length} 词`)
  }
  console.log('\n完成。')
}

main().catch((err) => {
  console.error('\n✗ 执行失败:', err.message)
  process.exit(1)
})
