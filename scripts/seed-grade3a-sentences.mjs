// scripts/seed-grade3a-sentences.mjs
// 人教版三年级上册 课文句子批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-grade3a-sentences.mjs [baseURL]
// 幂等：可重复运行，已存在的 (textbookId, unitNumber, sentence) 自动跳过
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')

// ── 教材信息 ──────────────────────────────────────────────────────
const textbook = {
  stage: '小学',
  name: '三年级上册',
  publisher: '人教版',
  grade: '三年级',
  semester: '上',
}

// ── 各单元课文句子 ────────────────────────────────────────────────

const units = [
  {
    unitNumber: 1,
    sentences: [
      { sentence: 'Hello! I\'m Mike Black.', translation: '你好！我是迈克·布莱克。' },
      { sentence: 'Hi! My name is Wu Binbin.', translation: '嗨！我叫吴斌斌。' },
      { sentence: 'Nice to meet you.', translation: '见到你很高兴。' },
      { sentence: 'Nice to meet you too.', translation: '见到你（我）也很高兴。' },
      { sentence: 'Oh no!', translation: '噢，不！' },
      { sentence: 'It\'s OK, Chen Jie.', translation: '没关系，陈杰。' },
      { sentence: 'Hey, Sarah! We can share.', translation: '嘿，萨拉！我们可以分享。' },
      { sentence: 'Thanks, Sarah. / Thank you, Chen Jie.', translation: '谢谢，萨拉。/ 谢谢你，陈杰。' },
      { sentence: 'I am nice to my friends.', translation: '我对我的朋友们很好。' },
    ],
  },
  {
    unitNumber: 2,
    sentences: [
      { sentence: 'This is my grandma.', translation: '这是我的奶奶。' },
      { sentence: 'Look! This is my family.', translation: '看！这是我的家庭。' },
      { sentence: 'Is that your brother?', translation: '那是你弟弟吗？' },
      { sentence: 'Yes, it is.', translation: '对，是的。' },
      { sentence: 'They love each other.', translation: '他们相互关爱。' },
    ],
  },
  {
    unitNumber: 3,
    sentences: [
      { sentence: 'Good morning, Mike!', translation: '早上好，迈克！' },
      { sentence: 'Good morning! Come in.', translation: '早上好！进来吧。' },
      { sentence: 'Do you have a pet?', translation: '你有宠物吗？' },
      { sentence: 'No, I don\'t.', translation: '不，我没有。' },
      { sentence: 'Yes, I do. I have a cat.', translation: '是的，我有。我有一只猫。' },
      { sentence: 'Let\'s go to the zoo!', translation: '我们一起去动物园吧！' },
      { sentence: 'Great!', translation: '太好了！' },
      { sentence: 'What\'s this?', translation: '这是什么？' },
      { sentence: 'It\'s a fox.', translation: '是只狐狸。' },
      { sentence: 'Miss White, what\'s that?', translation: '怀特老师，那是什么？' },
      { sentence: 'It\'s a red panda.', translation: '是只小熊猫。' },
    ],
  },
  {
    unitNumber: 4,
    sentences: [
      { sentence: 'Mike, do you like apples?', translation: '迈克，你喜欢苹果吗？' },
      { sentence: 'Yes, I do. And you?', translation: '是的，我喜欢。你呢？' },
      { sentence: 'No, I don\'t.', translation: '不，我不喜欢。' },
      { sentence: 'Do you like the farm?', translation: '你们喜欢农场吗？' },
      { sentence: 'I like the fresh air.', translation: '我喜欢新鲜的空气。' },
      { sentence: 'We can plant new trees.', translation: '我们可以种新树。' },
      { sentence: 'Plants can give us many things.', translation: '植物能提供很多东西。' },
    ],
  },
  {
    unitNumber: 5,
    sentences: [
      { sentence: 'What colour is it?', translation: '它是什么颜色？' },
      { sentence: 'It\'s orange.', translation: '它是橙红色。' },
      { sentence: 'Red and blue make purple.', translation: '红色加蓝色是紫色。' },
      { sentence: 'What colours do you like?', translation: '你喜欢什么颜色？' },
      { sentence: 'I like red and pink.', translation: '我喜欢红色和粉色。' },
      { sentence: 'Let\'s draw some purple and brown birds.', translation: '我们一起画一些紫色和棕色的鸟吧。' },
      { sentence: 'Use again!', translation: '再次利用！' },
      { sentence: 'Be careful!', translation: '小心！' },
    ],
  },
  {
    unitNumber: 6,
    sentences: [
      { sentence: 'How old are you?', translation: '你几岁了？' },
      { sentence: 'I\'m five years old.', translation: '我五岁了。' },
      { sentence: 'Me too.', translation: '我也是。' },
      { sentence: 'How many apples?', translation: '几个苹果？' },
      { sentence: 'Two.', translation: '两个。' },
      { sentence: 'Great! Let\'s go to the shop!', translation: '好极了！我们一起去商店吧！' },
      { sentence: 'That\'s ten yuan, please.', translation: '（共）十元，谢谢。' },
      { sentence: 'Here you are.', translation: '给您。' },
      { sentence: 'It\'s seven o\'clock. Hurry!', translation: '七点了。快点！' },
      { sentence: 'Happy birthday!', translation: '生日快乐！' },
      { sentence: 'Oh, one more cut for the dog.', translation: '噢，再切一块给小狗。' },
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
