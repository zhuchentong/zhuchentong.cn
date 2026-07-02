// scripts/seed-grade4a-words.mjs
// 人教版四年级上册 单词批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-grade4a-words.mjs [baseURL]
// 幂等：可重复运行，已存在的单词仅更新释义、关联去重
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')

/** 人教版四年级上册教材信息 */
const textbook = {
  stage: '小学',
  name: '四年级上册',
  publisher: '人教版',
  grade: '四年级',
  semester: '上',
}

/**
 * cook 在 Unit 1（烹饪；煮）与 Unit 4（厨师）语义不同，
 * 因单词全局去重，采用合并义项，两单元共用同一释义。
 */
const COOK_MEANING = '烹饪；煮；厨师'

const units = [
  {
    unitNumber: 1,
    words: [
      ['PE', '/ˌpiː ˈiː/', '(体育) 课'],
      ['job', '/dʒɒb/', '工作；职业'],
      ['doctor', '/ˈdɒktə(r)/', '医生'],
      ['farmer', '/ˈfɑːmə(r)/', '农场主；农民'],
      ['nurse', '/nɜːs/', '护士'],
      ['office worker', '/ˈɒfɪs ˈwɜːkə(r)/', '公司职员'],
      ['factory worker', '/ˈfæktri ˈwɜːkə(r)/', '工厂工人'],
      ['busy', '/ˈbɪzi/', '忙碌的'],
      ['tired', '/ˈtaɪəd/', '疲倦的'],
      ['chore', '/tʃɔː(r)/', '家庭杂务'],
      ['cook', '/kʊk/', COOK_MEANING],
      ['clean', '/kliːn/', '打扫；干净的'],
      ['room', '/ruːm/', '房间'],
      ['look after', '/lʊk ˈɑːftə(r)/', '照顾'],
      ['sweep', '/swiːp/', '扫'],
      ['floor', '/flɔː(r)/', '地板；地面'],
      ['together', '/təˈɡeðə(r)/', '在一起；共同'],
      ['people', '/ˈpiːpl/', '人；人们'],
      ['child', '/tʃaɪld/', '儿童；小孩（复数 children）'],
    ],
  },
  {
    unitNumber: 2,
    words: [
      ['his', '/hɪz/', '他的'],
      ['strong', '/strɒŋ/', '强壮的'],
      ['hair', '/heə(r)/', '头发'],
      ['also', '/ˈɔːlsəʊ/', '也'],
      ['kind', '/kaɪnd/', '友好的'],
      ['quiet', '/ˈkwaɪət/', '安静的'],
      ['best', '/best/', '最好的'],
      ['read', '/riːd/', '阅读'],
      ['Chinese', '/ˌtʃaɪˈniːz/', '中文；中国人；中国的'],
      ['play', '/pleɪ/', '玩耍'],
      ['game', '/ɡeɪm/', '游戏'],
      ['football', '/ˈfʊtbɔːl/', '足球运动'],
      ['basketball', '/ˈbɑːskɪtbɔːl/', '篮球运动'],
      ['always', '/ˈɔːlweɪz/', '总是'],
    ],
  },
  {
    unitNumber: 3,
    words: [
      ['afternoon', '/ˌɑːftəˈnuːn/', '下午'],
      ['there', '/ðeə(r)/', '（表示存在或发生）在那里'],
      ['playground', '/ˈpleɪɡraʊnd/', '操场；球场'],
      ['park', '/pɑːk/', '公园'],
      ['over', '/ˈəʊvə(r)/', '在……的远端（或对面）'],
      ['hospital', '/ˈhɒspɪtl/', '医院'],
      ['shop', '/ʃɒp/', '商店'],
      ['toilet', '/ˈtɔɪlət/', '厕所；卫生间'],
      ['bus stop', '/bʌs stɒp/', '公共汽车站'],
      ['library', '/ˈlaɪbrəri/', '图书馆'],
      ['sport', '/spɔːt/', '体育运动'],
      ['walk', '/wɔːk/', '散步；步行'],
      ['community', '/kəˈmjuːnəti/', '社区'],
      ['favourite', '/ˈfeɪvərɪt/', '最喜欢的'],
      ['place', '/pleɪs/', '地方；场所'],
      ['photo', '/ˈfəʊtəʊ/', '照片'],
      ['story', '/ˈstɔːri/', '故事'],
      ['buy', '/baɪ/', '购买'],
    ],
  },
  {
    unitNumber: 4,
    words: [
      ['firefighter', '/ˈfaɪəfaɪtə(r)/', '消防队员'],
      ['why', '/waɪ/', '为什么'],
      ['driver', '/ˈdraɪvə(r)/', '司机'],
      ['cleaner', '/ˈkliːnə(r)/', '清洁工'],
      ['cook', '/kʊk/', COOK_MEANING],
      ['delivery driver', '/dɪˈlɪvəri ˈdraɪvə(r)/', '快递员'],
      ['police officer', '/pəˈliːs ˈɒfɪsə(r)/', '警察；警员'],
      ['a lot of', '/ə ˈlɒt əv/', '许多'],
      ['now', '/naʊ/', '现在'],
      ['make the bed', '/meɪk ðə bed/', '整理床铺；铺床'],
      ['old', '/əʊld/', '过去的；年纪大的；老的'],
      ['tell', '/tel/', '讲述；告诉'],
      ['everyone', '/ˈevriwʌn/', '每人'],
      ['Ms', '/mɪz/', '（用于女子的姓氏或姓名前，不指明婚否）女士'],
    ],
  },
  {
    unitNumber: 5,
    words: [
      ['speak', '/spiːk/', '说话；发言'],
      ['weather', '/ˈweðə(r)/', '天气'],
      ['sunny', '/ˈsʌni/', '阳光充足的'],
      ['hot', '/hɒt/', '热的'],
      ['bad', '/bæd/', '令人不快的；坏的'],
      ['cold', '/kəʊld/', '冷的'],
      ['windy', '/ˈwɪndi/', '多风的'],
      ['cloudy', '/ˈklaʊdi/', '多云的'],
      ['rainy', '/ˈreɪni/', '阴雨的'],
      ['snowy', '/ˈsnəʊi/', '多雪的'],
      ['cool', '/kuːl/', '凉爽的'],
      ['warm', '/wɔːm/', '温暖的'],
      ['tomorrow', '/təˈmɒrəʊ/', '在明天'],
      ['rain', '/reɪn/', '下雨；雨'],
      ['closed', '/kləʊzd/', '关闭的'],
      ['film', '/fɪlm/', '电影'],
      ['idea', '/aɪˈdɪə/', '想法；主意'],
      ['fly', '/flaɪ/', '操纵（飞行器等）；飞'],
      ['kite', '/kaɪt/', '风筝'],
      ['snowman', '/ˈsnəʊmæn/', '雪人'],
      ['fun', '/fʌn/', '寻乐；乐趣'],
      ['their', '/ðeə(r)/', '他们的；她们的；它们的'],
      ['swim', '/swɪm/', '游泳'],
      ['Sydney', '/ˈsɪdni/', '悉尼'],
    ],
  },
  {
    unitNumber: 6,
    words: [
      ['whose', '/huːz/', '谁的'],
      ['sweater', '/ˈswetə(r)/', '毛衣'],
      ['sock', '/sɒk/', '短袜'],
      ['mine', '/maɪn/', '我的'],
      ['wear', '/weə(r)/', '穿；戴'],
      ['shirt', '/ʃɜːt/', '衬衫'],
      ['coat', '/kəʊt/', '大衣；外套'],
      ['dress', '/dres/', '连衣裙'],
      ['which', '/wɪtʃ/', '哪一个；哪一些'],
      ['season', '/ˈsiːzn/', '季节'],
      ['winter', '/ˈwɪntə(r)/', '冬天'],
      ['snow', '/snəʊ/', '下雪；雪'],
      ['get together', '/ɡet təˈɡeðə(r)/', '聚会'],
      ['spring', '/sprɪŋ/', '春天'],
      ['summer', '/ˈsʌmə(r)/', '夏天'],
      ['autumn', '/ˈɔːtəm/', '秋天'],
      ['fall', '/fɔːl/', '落下'],
      ['T-shirt', '/ˈtiːʃɜːt/', 'T恤衫'],
      ['leaf', '/liːf/', '叶（复数 leaves）'],
      ['glove', '/glʌv/', '手套'],
      ['then', '/ðen/', '然后；那时'],
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
