// scripts/seed-grade4a-sentences.mjs
// 人教版四年级上册 课文句子批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-grade4a-sentences.mjs [baseURL]
// 幂等：可重复运行，已存在的 (textbookId, unitNumber, sentence) 自动跳过
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')

// ── 教材信息 ──────────────────────────────────────────────────────
const textbook = {
  stage: '小学',
  name: '四年级上册',
  publisher: '人教版',
  grade: '四年级',
  semester: '上',
}

// ── 各单元课文句子 ────────────────────────────────────────────────

const units = [
  {
    unitNumber: 1,
    sentences: [
      { sentence: 'What\'s your mother\'s job?', translation: '你妈妈做什么工作？' },
      { sentence: 'She\'s a doctor.', translation: '她是医生。' },
      { sentence: 'Mum and Dad are busy and tired. What can we do for them?', translation: '爸爸妈妈又忙又累。我们能为他们做些什么？' },
      { sentence: 'We can do some chores.', translation: '我们可以做一些家务活。' },
    ],
  },
  {
    unitNumber: 2,
    sentences: [
      { sentence: 'What\'s your friend\'s name?', translation: '你的朋友叫什么名字？' },
      { sentence: 'His name is Zhang Peng.', translation: '他叫张鹏。' },
      { sentence: 'He\'s tall and strong.', translation: '他又高又壮。' },
      { sentence: 'He\'s also kind. He often helps me.', translation: '他也很友善。他经常帮助我。' },
      { sentence: 'Who\'s your best friend?', translation: '谁是你最好的朋友？' },
      { sentence: 'Chen Jie. She\'s funny. She often makes me smile.', translation: '陈杰。她很有趣。她经常让我开心。' },
    ],
  },
  {
    unitNumber: 3,
    sentences: [
      { sentence: 'There is a playground. We often play there.', translation: '那里有个游乐场。我们经常在那里玩儿。' },
      { sentence: 'There is a taijiquan club.', translation: '这里有一个太极拳俱乐部。' },
      { sentence: 'There are many people.', translation: '这里有很多人。' },
      { sentence: 'There is a gym too.', translation: '这里还有一个体育馆。' },
      { sentence: 'Great! Let\'s do some sports.', translation: '太棒了！我们一起做运动吧。' },
      { sentence: 'My favourite place is the museum.', translation: '我最喜欢的地方是博物馆。' },
    ],
  },
  {
    unitNumber: 4,
    sentences: [
      { sentence: 'Our neighbour is a firefighter. He often helps people.', translation: '我们的邻居是消防员。他经常帮助别人。' },
      { sentence: 'He\'s a school bus driver. He takes us to school every day.', translation: '他是校车司机。他每天送我们去学校。' },
      { sentence: 'That\'s an important job too!', translation: '那个工作也很重要！' },
      { sentence: 'Chen Jie is making the bed.', translation: '陈杰正在铺床。' },
      { sentence: 'In the kindergarten, John and Class One are singing songs together.', translation: '在幼儿园，约翰和一班（的小朋友们）一起唱歌。' },
    ],
  },
  {
    unitNumber: 5,
    sentences: [
      { sentence: 'Hello! Mark speaking.', translation: '你好！我是马克。' },
      { sentence: 'Hi, Mark! This is John. What\'s the weather like in Sydney?', translation: '嗨，马克！我是约翰。悉尼的天气怎么样？' },
      { sentence: 'Well, it\'s sunny today.', translation: '噢，今天是晴天。' },
      { sentence: 'It\'s only two degrees in Beijing.', translation: '北京只有两度。' },
      { sentence: 'It\'s raining now.', translation: '现在下雨了。' },
      { sentence: 'We can\'t play basketball in the park.', translation: '我们不能在公园打篮球了。' },
      { sentence: 'It\'s OK. We can go to the library.', translation: '没关系。我们可以去图书馆。' },
      { sentence: 'It\'s hot and sunny here.', translation: '这里很热，是个大晴天。' },
      { sentence: 'Their children swim in the pool.', translation: '他们的孩子在泳池里游泳。' },
    ],
  },
  {
    unitNumber: 6,
    sentences: [
      { sentence: 'Whose sweater is this, Mum?', translation: '这是谁的毛衣，妈妈？' },
      { sentence: 'It\'s your dad\'s.', translation: '是你爸爸的。' },
      { sentence: 'Can I wear this new shirt today?', translation: '我今天可以穿这件新衬衫吗？' },
      { sentence: 'Yes, but wear a coat too. It\'s cold and windy outside.', translation: '可以，但是再穿一件外套吧。外面有风，很冷。' },
      { sentence: 'Which season do you like?', translation: '你喜欢哪个季节？' },
      { sentence: 'Winter. It snows a lot.', translation: '冬天。冬天经常下雪。' },
      { sentence: 'I like winter too. There are many festivals.', translation: '我也喜欢冬天。（在冬天）有很多节日。' },
      { sentence: 'It\'s full of life.', translation: '（春天）充满生机。' },
      { sentence: 'And enjoy mooncakes.', translation: '还品尝月饼。' },
      { sentence: 'Then spring comes again.', translation: '接着春天又来了。' },
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
