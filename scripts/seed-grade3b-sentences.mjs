// scripts/seed-grade3b-sentences.mjs
// 人教版三年级下册 课文句子批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-grade3b-sentences.mjs [baseURL]
// 幂等：可重复运行，已存在的 (textbookId, unitNumber, sentence) 自动跳过
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')

// ── 教材信息 ──────────────────────────────────────────────────────
const textbook = {
  stage: '小学',
  name: '三年级下册',
  publisher: '人教版',
  grade: '三年级',
  semester: '下',
}

// ── 各单元课文句子 ────────────────────────────────────────────────

const units = [
  {
    unitNumber: 1,
    sentences: [
      { sentence: "What's your name?", translation: '你叫什么名字？' },
      { sentence: "My name's Amy Green.", translation: '我叫埃米·格林。' },
      { sentence: 'Where are you from?', translation: '你是哪里人？' },
      { sentence: "I'm from the UK.", translation: '我是英国人。' },
      { sentence: 'Let me help.', translation: '我来帮忙。' },
      { sentence: 'After you!', translation: '您先请！' },
      { sentence: "You're welcome.", translation: '别客气。' },
      { sentence: "Who's that girl?", translation: '那个女孩是谁？' },
      { sentence: "That's our new neighbour, Amy.", translation: '是我们的新邻居埃米。' },
    ],
  },
  {
    unitNumber: 2,
    sentences: [
      { sentence: 'It has a long body and short legs.', translation: '它有长长的身体和短短的腿。' },
      { sentence: 'Dogs are friendly.', translation: '狗是友善的。' },
      { sentence: 'Do you often say that to your mum?', translation: '你经常对妈妈那么说吗？' },
      { sentence: 'Yes, I do.', translation: '是的。' },
      { sentence: 'I often make her gifts.', translation: '我经常给她做礼物。' },
      { sentence: 'We express ourselves in many ways.', translation: '我们用很多种方式表达自己。' },
    ],
  },
  {
    unitNumber: 3,
    sentences: [
      { sentence: 'Excuse me.', translation: '劳驾。' },
      { sentence: 'Can I use your eraser, please?', translation: '我能用一下你的橡皮吗？' },
      { sentence: 'Sure. Here you are.', translation: '当然。给你。' },
      { sentence: 'No problem.', translation: '没问题。' },
      { sentence: 'What are these?', translation: '这些是什么？' },
      { sentence: "They're grapes.", translation: '是葡萄。' },
      { sentence: 'What about this?', translation: '这个呢？' },
    ],
  },
  {
    unitNumber: 4,
    sentences: [
      { sentence: "I'd like some bread and eggs, please.", translation: '我想吃点儿面包和鸡蛋。' },
      { sentence: 'Have some milk too.', translation: '也喝点儿牛奶吧。' },
      { sentence: 'Would you like some rice and meat?', translation: '要吃点儿米饭和肉吗？' },
      { sentence: 'Yes, please.', translation: '好的，谢谢。' },
      { sentence: 'Eat some every day!', translation: '每天吃一些吧！' },
    ],
  },
  {
    unitNumber: 5,
    sentences: [
      { sentence: 'Do you have old things?', translation: '你有旧东西吗？' },
      { sentence: 'Yes, I do. I have some old books.', translation: '是的。我有些旧书。' },
      { sentence: 'This boat is cool.', translation: '这只船很酷。' },
      { sentence: 'You can keep it.', translation: '你可以留着它。' },
      { sentence: 'Mum, where is my animal book?', translation: '妈妈，我的动物书在哪儿？' },
      { sentence: 'Is it on the shelf?', translation: '在架子上吗？' },
      { sentence: "No, it isn't.", translation: '不，不在。' },
      { sentence: "It's in the box.", translation: '它在盒子里。' },
    ],
  },
  {
    unitNumber: 6,
    sentences: [
      { sentence: 'How many books do we have?', translation: '我们有多少本书？' },
      { sentence: 'We have fifteen books.', translation: '我们有十五本书。' },
      { sentence: 'How many boxes do we need?', translation: '我们需要多少个箱子？' },
      { sentence: 'We need three boxes.', translation: '我们需要三个箱子。' },
      { sentence: 'How much is this bag?', translation: '这个包多少钱？' },
      { sentence: "It's twenty yuan.", translation: '二十元。' },
      { sentence: 'Six yuan, or three for seventeen yuan.', translation: '六元，或者十七元三本。' },
      { sentence: 'How about three for sixteen yuan?', translation: '十六元三本行吗？' },
    ],
  },
]

// ── 组装批量导入数据 ──────────────────────────────────────────────
const allSentences = units.flatMap(u =>
  u.sentences.map(s => ({
    unitNumber: u.unitNumber,
    sentence: s.sentence,
    translation: s.translation,
  })),
)

// ── 查询已有教材 ──────────────────────────────────────────────────
async function findTextbook() {
  const res = await fetch(`${BASE}/english/api/textbooks`)
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`查询教材失败: ${json.error ?? res.status}`)
  }
  return json.data.find(tb => tb.publisher === textbook.publisher && tb.name === textbook.name)
}

// ── 创建教材 ──────────────────────────────────────────────────────
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

// ── 批量导入课文句子 ──────────────────────────────────────────────
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

// ── 主流程 ────────────────────────────────────────────────────────
async function main() {
  console.log(`目标服务：${BASE}`)
  console.log(`待导入：${allSentences.length} 句课文句子，分布于 ${units.length} 个单元\n`)

  // 1. 查询或创建教材
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

  // 2. 批量导入句子
  console.log('批量导入课文句子…')
  const result = await batchAddSentences(tb.id)
  console.log(`  ✓ 总计 ${result.total} 条：新建 ${result.created}，跳过 ${result.skipped}\n`)

  // 3. 分单元汇总
  for (const u of units) {
    console.log(`  Unit ${u.unitNumber}: ${u.sentences.length} 句`)
  }
  console.log('\n完成。')
}

main().catch((err) => {
  console.error('\n✗ 执行失败:', err.message)
  process.exit(1)
})
