// scripts/seed-grade4b-words.mjs
// 人教版四年级下册 单词批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-grade4b-words.mjs [baseURL]
// 幂等：可重复运行，已存在的单词仅更新释义、关联去重
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')

/** 人教版四年级下册教材信息 */
const textbook = {
  stage: '小学',
  name: '四年级下册',
  publisher: '人教版',
  grade: '四年级',
  semester: '下',
}

/**
 * 跨教材重复词的合并义项常量。
 * 因单词全局去重且 upsert 覆盖 meaning，跨教材多义词条目须提供合并释义，
 * 否则新导入会覆盖旧教材的义项。
 */

// over：4a（在……的远端（或对面））+ 4b（结束（的））
const OVER_MEANING = '在……的远端（或对面）；结束（的）'

// can：3a（可以）+ 4b（（盛食品或饮料的）金属罐）
const CAN_MEANING = '可以；（盛食品或饮料的）金属罐'

// milk：3b（（牛或羊等的）奶）+ 4b（挤奶）
const MILK_MEANING = '（牛或羊等的）奶；挤奶'

const units = [
  {
    unitNumber: 1,
    words: [
      ['sorry', '/ˈsɒri/', '对不起'],
      ['hurry up', '/ˈhʌri ʌp/', '快点；赶快'],
      ['late', '/leɪt/', '迟到；迟发生'],
      ['class', '/klɑːs/', '课；课程；班级'],
      ['ready', '/ˈredi/', '准备好'],
      ['rule', '/ruːl/', '规则；规章'],
      ['classroom', '/ˈklɑːsruːm/', '教室'],
      ['turn on', '/tɜːn ɒn/', '打开（灯等）'],
      ['turn off', '/tɜːn ɒf/', '关掉'],
      ['light', '/laɪt/', '灯；光'],
      ['blackboard', '/ˈblækbɔːd/', '黑板'],
      ['desk', '/desk/', '书桌；办公桌'],
      ['chair', '/tʃeə(r)/', '椅子'],
      ['tidy', '/ˈtaɪdi/', '整洁的；整齐的；使整洁；整理'],
      ['music', '/ˈmjuːzɪk/', '音乐'],
      ['door', '/dɔː(r)/', '门'],
      ['window', '/ˈwɪndəʊ/', '窗'],
      ['fan', '/fæn/', '风扇'],
      ['when', '/wen/', '当……时；什么时候'],
      ['understand', '/ˌʌndəˈstænd/', '懂；理解'],
      ['wall', '/wɔːl/', '墙；壁'],
      ['newspaper', '/ˈnjuːzpeɪpə(r)/', '报纸'],
      ['hand out', '/hænd aʊt/', '分发'],
      ['workbook', '/ˈwɜːkbʊk/', '练习册；作业本'],
    ],
  },
  {
    unitNumber: 2,
    words: [
      ['watch', '/wɒtʃ/', '看'],
      ['TV', '/ˌtiː ˈviː/', '电视'],
      ['homework', '/ˈhəʊmwɜːk/', '家庭作业'],
      ['first', '/fɜːst/', '首先；首次；第一'],
      ['wet', '/wet/', '湿的；未干的'],
      ['run', '/rʌn/', '跑；奔跑'],
      ['living room', '/ˈlɪvɪŋ ruːm/', '客厅；起居室'],
      ['safe', '/seɪf/', '安全的'],
      ['word', '/wɜːd/', '言语；单词；字'],
      ['wash', '/wɒʃ/', '洗'],
      ['helpful', '/ˈhelpfl/', '有帮助的；有用的'],
      ['loud', '/laʊd/', '说话太大声的；吵闹的'],
      ['sleep', '/sliːp/', '睡觉'],
      ['bedroom', '/ˈbedruːm/', '卧室'],
      ['kitchen', '/ˈkɪtʃɪn/', '厨房'],
      ['study', '/ˈstʌdi/', '书房'],
      ['bathroom', '/ˈbɑːθruːm/', '浴室；洗手间'],
      ['think', '/θɪŋk/', '想；思考'],
      ['work', '/wɜːk/', '（花费时间和精力）做（某事）；工作'],
      ['hard', '/hɑːd/', '努力地；费力地'],
      ['follow', '/ˈfɒləʊ/', '遵循，听从（忠告、指示等）'],
      ['feel', '/fiːl/', '觉得；感到'],
    ],
  },
  {
    unitNumber: 3,
    words: [
      ['over', '/ˈəʊvə(r)/', OVER_MEANING],
      ['kid', '/kɪd/', '小孩'],
      ['dinner', '/ˈdɪnə(r)/', '（中午或晚上吃的）正餐'],
      ['art', '/ɑːt/', '美术；艺术'],
      ['lunch', '/lʌntʃ/', '午餐'],
      ['maths', '/mæθs/', '数学'],
      ['get up', '/ˌɡet ˈʌp/', '起床'],
      ['go to school', '/ˌɡəʊ tə ˈskuːl/', '上学'],
      ['go home', '/ˌɡəʊ ˈhəʊm/', '回家'],
      ['go to bed', '/ˌɡəʊ tə ˈbed/', '上床睡觉'],
      ['want', '/wɒnt/', '想要'],
      ['clock', '/klɒk/', '时钟'],
      ['just', '/dʒʌst/', '只是；仅仅；正要'],
      ['minute', '/ˈmɪnɪt/', '分钟'],
    ],
  },
  {
    unitNumber: 4,
    words: [
      ['trousers', '/ˈtraʊzəz/', '裤子'],
      ['pair', '/peə(r)/', '（由连在一起的两相似部分构成的）一条，一副'],
      ['clothes', '/kləʊðz/', '衣服；服装'],
      ['those', '/ðəʊz/', '（指较远的人或事物）那些'],
      ['shorts', '/ʃɔːts/', '短裤'],
      ['jacket', '/ˈdʒækɪt/', '夹克衫；短上衣'],
      ['skirt', '/skɜːt/', '裙子'],
      ['dear', '/dɪə(r)/', '亲爱的'],
      ['expensive', '/ɪkˈspensɪv/', '昂贵的；价格高的'],
      ['take', '/teɪk/', '买下'],
      ['cheap', '/tʃiːp/', '便宜的'],
      ['shoe', '/ʃuː/', '鞋'],
      ['beautiful', '/ˈbjuːtɪfl/', '美丽的'],
      ['hat', '/hæt/', '帽子'],
      ['sunglasses', '/ˈsʌŋɡlɑːsɪz/', '太阳镜；墨镜'],
      ['free', '/friː/', '免费的'],
      ['large', '/lɑːdʒ/', '（服装、食物、日用品等）大型号的'],
      ['size', '/saɪz/', '尺码；号'],
      ['list', '/lɪst/', '清单；目录'],
      ['try on', '/traɪ ɒn/', '试穿'],
      ['any', '/ˈeni/', '任何的；任一的'],
    ],
  },
  {
    unitNumber: 5,
    words: [
      ['cow', '/kaʊ/', '奶牛'],
      ['horse', '/hɔːs/', '马'],
      ['sheep', '/ʃiːp/', '羊；绵羊'],
      ['pig', '/pɪɡ/', '猪'],
      ['chicken', '/ˈtʃɪkɪn/', '鸡；鸡肉'],
      ['tomato', '/təˈmɑːtəʊ/', '西红柿'],
      ['bee', '/biː/', '蜜蜂'],
      ['mouse', '/maʊs/', '老鼠（复数 mice）'],
      ['carrot', '/ˈkærət/', '胡萝卜'],
      ['potato', '/pəˈteɪtəʊ/', '土豆'],
      ['green bean', '/ˌɡriːn ˈbiːn/', '青刀豆；四季豆'],
      ['can', '/kæn/', CAN_MEANING],
      ['a box of', '/ə bɒks əv/', '一盒，一箱（东西）'],
    ],
  },
  {
    unitNumber: 6,
    words: [
      ['feed', '/fiːd/', '给（人或动物）食物；饲养'],
      ['pass', '/pɑːs/', '给；递'],
      ['pick', '/pɪk/', '采；摘'],
      ['milk', '/mɪlk/', MILK_MEANING],
      ['knife', '/naɪf/', '刀'],
      ['fork', '/fɔːk/', '餐叉'],
      ['chopstick', '/ˈtʃɒpstɪk/', '（常用复数）筷子'],
      ['waste', '/weɪst/', '浪费；废品'],
      ['food', '/fuːd/', '菜肴；食物'],
      ['delicious', '/dɪˈlɪʃəs/', '美味的；可口的'],
      ['clear the table', '/ˌklɪə(r) ðə ˈteɪbl/', '收拾餐桌'],
      ['set the table', '/set ðə ˈteɪbl/', '摆放餐具'],
      ['bowl', '/bəʊl/', '碗'],
      ['spoon', '/spuːn/', '勺；匙；调羹'],
      ['supermarket', '/ˈsuːpəmɑːkɪt/', '超市'],
      ['herself', '/hɜːˈself/', '（用作女性的反身代词）她自己，自己'],
      ['week', '/wiːk/', '周；星期'],
      ['salad', '/ˈsæləd/', '蔬菜沙拉'],
    ],
  },
]

/** [word, phonetic, meaning] -> BatchWordItem */
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

  // 2. 批量导入单词
  console.log('批量导入单词…')
  const result = await batchAdd(tb.id)
  console.log(`  ✓ 总计 ${result.total} 条：新建 ${result.created}，更新 ${result.updated}\n`)

  // 3. 分单元汇总
  for (const unit of units) {
    console.log(`  Unit ${unit.unitNumber}: ${unit.words.length} 词`)
  }
  console.log('\n完成。')
}

main().catch((err) => {
  console.error('\n✗ 执行失败:', err.message)
  process.exit(1)
})
