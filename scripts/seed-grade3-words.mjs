// scripts/seed-grade3-words.mjs
// 人教版三年级下册 单词批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-grade3-words.mjs [baseURL]
// 幂等：可重复运行，已存在的单词仅更新释义、关联去重
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')

/** 人教版三年级下册教材信息 */
const textbook = {
  stage: '小学',
  name: '三年级下册',
  publisher: '人教版',
  grade: '三年级',
  semester: '下',
}

/**
 * 单元词汇表（按教材附录单词表整理）
 * 普通词小写；专有名词/缩写保留首字母大写（UK/USA/China/Canada/English/Mr）
 * 短语 in class / piggy bank 作为独立词条
 */
const units = [
  {
    unitNumber: 1,
    words: [
      ['where', '/weə(r)/', '在哪里；到哪里'],
      ['from', '/frɒm/', '（表示来源）来自，从……来'],
      ['about', '/əˈbaʊt/', '关于；大约'],
      ['today', '/təˈdeɪ/', '今天'],
      ['teacher', '/ˈtiːtʃə(r)/', '教师'],
      ['student', '/ˈstjuːdnt/', '学生'],
      ['after', '/ˈɑːftə(r)/', '在……后面'],
      ['who', '/huː/', '谁；什么人'],
      ['girl', '/ɡɜːl/', '女孩'],
      ['neighbour', '/ˈneɪbə(r)/', '邻居'],
      ['boy', '/bɔɪ/', '男孩'],
      ['woman', '/ˈwʊmən/', '成年女子；妇女'],
      ['man', '/mæn/', '成年男子；男人'],
      ['Mr', '/ˈmɪstə(r)/', '（用于男子的姓氏或姓名前）先生'],
      ['classmate', '/ˈklɑːsmeɪt/', '同班同学'],
      ['he', '/hiː/', '他'],
      ['also', '/ˈɔːlsəʊ/', '也'],
      ['English', '/ˈɪŋɡlɪʃ/', '英语的；英语'],
      ['she', '/ʃiː/', '她'],
      ['very', '/ˈveri/', '很；非常；十分'],
      ['UK', '/juːˈkeɪ/', '英国'],
      ['China', '/ˈtʃaɪnə/', '中国'],
      ['Canada', '/ˈkænədə/', '加拿大'],
      ['USA', '/juː esˈeɪ/', '美国'],
    ],
  },
  {
    unitNumber: 2,
    words: [
      ['has', '/hæz/', '（have的第三人称单数形式）具有（某种外表、特性或特征）'],
      ['long', '/lɒŋ/', '（长度或距离）长的'],
      ['body', '/ˈbɒdi/', '身体'],
      ['short', '/ʃɔːt/', '短的；个子矮的'],
      ['leg', '/leɡ/', '腿'],
      ['right', '/raɪt/', '（意见或判断）准确，确切，恰当'],
      ['fat', '/fæt/', '肥的；肥胖的'],
      ['thin', '/θɪn/', '瘦的'],
      ['slow', '/sləʊ/', '缓慢的；慢的'],
      ['love', '/lʌv/', '喜爱；爱'],
      ['tail', '/teɪl/', '尾；尾巴'],
      ['her', '/hɜː(r)/', '她；她的'],
      ['gift', '/ɡɪft/', '礼物'],
      ['picture', '/ˈpɪktʃə(r)/', '图画；绘画'],
      ['card', '/kɑːd/', '贺卡；慰问卡；卡片'],
      ['sing', '/sɪŋ/', '唱（歌）；演唱'],
      ['dance', '/dɑːns/', '跳舞'],
      ['talk', '/tɔːk/', '说话；讲话；谈话'],
      ['face', '/feɪs/', '脸；面孔'],
      ['all', '/ɔːl/', '所有；全部'],
      ['song', '/sɒŋ/', '歌；歌曲'],
      ['or', '/ɔː(r)/', '或；或者；还是'],
      ['so', '/səʊ/', '（表示大小或数量）这么，那么'],
      ['much', '/mʌtʃ/', '许多；大量'],
    ],
  },
  {
    unitNumber: 3,
    words: [
      ['eraser', '/ɪˈreɪzə(r)/', '橡皮'],
      ['find', '/faɪnd/', '找到；找回'],
      ['ruler', '/ˈruːlə(r)/', '直尺'],
      ['pen', '/pen/', '钢笔'],
      ['pencil', '/ˈpensl/', '铅笔'],
      ['book', '/bʊk/', '书；书籍'],
      ['bag', '/bæɡ/', '包；袋'],
      ['paper', '/ˈpeɪpə(r)/', '纸'],
      ['these', '/ðiːz/', '这些'],
      ['see', '/siː/', '看见'],
      ['smell', '/smel/', '闻（气味）'],
      ['taste', '/teɪst/', '尝（味道）'],
      ['hear', '/hɪə(r)/', '听见；听到'],
      ['touch', '/tʌtʃ/', '触摸；碰'],
      ['nose', '/nəʊz/', '鼻；鼻子'],
      ['tongue', '/tʌŋ/', '舌；舌头'],
      ['class', '/klɑːs/', '课；班级'],
      ['in class', '/ɪn klɑːs/', '在课堂上'],
      ['computer', '/kəmˈpjuːtə(r)/', '计算机；电脑'],
      ['learn', '/lɜːn/', '学；学习'],
    ],
  },
  {
    unitNumber: 4,
    words: [
      ['breakfast', '/ˈbrekfəst/', '早餐；早饭'],
      ['time', '/taɪm/', '时间'],
      ['bread', '/bred/', '面包'],
      ['egg', '/eɡ/', '（作食物用的）蛋；鸡蛋'],
      ['milk', '/mɪlk/', '（牛或羊等的）奶'],
      ['noodle', '/ˈnuːdl/', '（常用复数）面条'],
      ['juice', '/dʒuːs/', '果汁'],
      ['rice', '/raɪs/', '大米'],
      ['meat', '/miːt/', '肉'],
      ['vegetable', '/ˈvedʒtəbl/', '蔬菜'],
      ['healthy', '/ˈhelθi/', '健康的'],
      ['plate', '/pleɪt/', '盘子'],
      ['soup', '/suːp/', '汤'],
      ['fruit', '/fruːt/', '水果'],
      ['colourful', '/ˈkʌləfl/', '五彩缤纷的'],
      ['candy', '/ˈkændi/', '糖果'],
      ['yummy', '/ˈjʌmi/', '很好吃的'],
    ],
  },
  {
    unitNumber: 5,
    words: [
      ['boat', '/bəʊt/', '小船；舟'],
      ['cool', '/kuːl/', '（因时髦、漂亮且与众不同而）酷的，绝妙的'],
      ['keep', '/kiːp/', '保有；留着'],
      ['at', '/æt/', '在（某处）'],
      ['home', '/həʊm/', '家；住所'],
      ['ball', '/bɔːl/', '球'],
      ['doll', '/dɒl/', '玩偶；玩具娃娃'],
      ['car', '/kɑː(r)/', '小汽车；轿车'],
      ['on', '/ɒn/', '（覆盖、附着）在……上'],
      ['shelf', '/ʃelf/', '（复数shelves）架子'],
      ['in', '/ɪn/', '在……内；在……中'],
      ['box', '/bɒks/', '盒子'],
      ['cap', '/kæp/', '帽子'],
      ['map', '/mæp/', '地图'],
      ['under', '/ˈʌndə(r)/', '在（或到、通过）……下面'],
      ['still', '/stɪl/', '还是；仍然'],
      ['put', '/pʊt/', '放；安置'],
    ],
  },
  {
    unitNumber: 6,
    words: [
      ['fifteen', '/ˌfɪfˈtiːn/', '十五'],
      ['twelve', '/ˈtwelv/', '十二'],
      ['fourteen', '/ˌfɔːˈtiːn/', '十四'],
      ['thirteen', '/ˌθɜːˈtiːn/', '十三'],
      ['eleven', '/ɪˈlevn/', '十一'],
      ['twenty', '/ˈtwenti/', '二十'],
      ['seventeen', '/ˌsevnˈtiːn/', '十七'],
      ['sixteen', '/ˌsɪksˈtiːn/', '十六'],
      ['eighteen', '/ˌeɪˈtiːn/', '十八'],
      ['nineteen', '/ˌnaɪnˈtiːn/', '十九'],
      ['piggy bank', '/ˈpɪɡi bæŋk/', '猪形储钱罐'],
      ['pay', '/peɪ/', '付费'],
      ['back', '/bæk/', '回到原处'],
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
