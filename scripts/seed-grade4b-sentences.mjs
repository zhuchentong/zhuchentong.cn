// scripts/seed-grade4b-sentences.mjs
// 人教版四年级下册 课文句子批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-grade4b-sentences.mjs [baseURL]
// 幂等：可重复运行，已存在的 (textbookId, unitNumber, sentence) 自动跳过
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')

// ── 教材信息（与单词脚本一致）─────────────────────────────────────
const textbook = {
  stage: '小学',
  name: '四年级下册',
  publisher: '人教版',
  grade: '四年级',
  semester: '下',
}

// ── 各单元课文句子 ────────────────────────────────────────────────

const units = [
  {
    unitNumber: 1,
    sentences: [
      { sentence: 'Hurry up! Don\'t be late for class!', translation: '快点！上课别迟到！' },
      { sentence: 'I\'m ready. Let\'s go!', translation: '我准备好了。我们走吧！' },
      { sentence: 'Who\'s on duty today?', translation: '今天谁值日？' },
      { sentence: 'I can put back the desks and chairs.', translation: '我可以把桌椅放回原位。' },
      { sentence: 'Excuse me?', translation: '对不起，请再说一次可以吗？' },
    ],
  },
  {
    unitNumber: 2,
    sentences: [
      { sentence: 'Mum, can I watch TV?', translation: '妈妈，我能看电视吗？' },
      { sentence: 'No. You have to do your homework first.', translation: '不行。你得先做作业。' },
      { sentence: 'Shh. Don\'t be so loud!', translation: '嘘。别这么大声！' },
      { sentence: 'Be careful, Jack. Don\'t touch hot things.', translation: '杰克，要小心。别碰烫的东西。' },
    ],
  },
  {
    unitNumber: 3,
    sentences: [
      { sentence: 'What time is it?', translation: '几点了？' },
      { sentence: 'It\'s 5 o\'clock.', translation: '现在五点了。' },
      { sentence: 'Time to go home, kids.', translation: '孩子们，该回家了。' },
      { sentence: 'It\'s time for dinner.', translation: '该吃晚饭了。' },
      { sentence: 'It\'s time to get up.', translation: '该起床了。' },
      { sentence: 'Have a nice day!', translation: '祝你一天愉快！' },
    ],
  },
  {
    unitNumber: 4,
    sentences: [
      { sentence: 'Can I buy a new pair?', translation: '我能买条新的（裤子）吗？' },
      { sentence: 'Sure. Let\'s go to the clothes shop.', translation: '当然。我们去服装店吧。' },
      { sentence: 'You already have too many shorts. Let\'s buy trousers.', translation: '你已经有太多短裤了。我们买长裤吧。' },
      { sentence: 'Can I help you?', translation: '要帮忙吗？' },
      { sentence: 'Yes. I like this pink dress.', translation: '嗯。我喜欢这件粉色的长裙。' },
      { sentence: 'Let\'s take it.', translation: '我们买下它吧。' },
    ],
  },
  {
    unitNumber: 5,
    sentences: [
      { sentence: 'What animals do you have on the farm?', translation: '您的农场上都养了哪些动物？' },
      { sentence: 'I have a lot of animals.', translation: '我养了很多动物。' },
      { sentence: 'What are these?', translation: '这些是什么？' },
      { sentence: 'They\'re tomatoes.', translation: '这些是西红柿。' },
      { sentence: 'How fresh!', translation: '真新鲜啊！' },
    ],
  },
  {
    unitNumber: 6,
    sentences: [
      { sentence: 'Let\'s feed the chickens.', translation: '我们喂鸡吧。' },
      { sentence: 'Can you please pass me the vegetables?', translation: '能否请你把蔬菜递给我？' },
      { sentence: 'Mike, Amy, would you like a knife and fork?', translation: '迈克、埃米，你们需要餐刀和餐叉吗？' },
      { sentence: 'No, thank you, Mr Wang. I can use chopsticks.', translation: '不用，谢谢您，王先生。我会用筷子。' },
      { sentence: 'Don\'t waste food, please.', translation: '请不要浪费食物。' },
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
