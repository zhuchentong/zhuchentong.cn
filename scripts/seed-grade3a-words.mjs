// scripts/seed-grade3a-words.mjs
// 人教版三年级上册 单词批量导入脚本
// 用法：先启动 dev server (pnpm dev)，再运行：node scripts/seed-grade3a-words.mjs [baseURL]
// 幂等：可重复运行，已存在的单词仅更新释义、关联去重
import process from 'node:process'

const BASE = (process.argv[2] ?? 'http://localhost:4321').replace(/\/$/, '')

/** 人教版三年级上册教材信息 */
const textbook = {
  stage: '小学',
  name: '三年级上册',
  publisher: '人教版',
  grade: '三年级',
  semester: '上',
}

/**
 * 单元词汇表（按教材附录单词表整理，按页码归属单元）
 * 普通词小写；专有名词/尊称保留首字母大写（Miss）
 * 短语 red panda 作为独立词条
 *
 * 注意：orange 在 Unit 4（橙子）与 Unit 5（橙红色）语义不同，
 * 因单词全局去重，采用合并义项，两单元共用同一释义。
 */
const ORANGE_MEANING = '橙子；柑橘；橙红色；橙红色的'

const units = [
  {
    unitNumber: 1,
    words: [
      ['name', '/neɪm/', '名字'],
      ['nice', '/naɪs/', '令人愉快的；友好的'],
      ['ear', '/ɪə(r)/', '耳朵'],
      ['hand', '/hænd/', '手'],
      ['eye', '/aɪ/', '眼睛'],
      ['mouth', '/maʊθ/', '嘴'],
      ['arm', '/ɑːm/', '胳膊'],
      ['can', '/kæn, kən/', '可以'],
      ['share', '/ʃeə(r)/', '分享'],
      ['smile', '/smaɪl/', '微笑；笑'],
      ['listen', '/ˈlɪsn/', '听；倾听'],
      ['help', '/help/', '帮助'],
      ['say', '/seɪ/', '说；讲'],
      ['friend', '/frend/', '朋友'],
      ['good', '/ɡʊd/', '好的'],
    ],
  },
  {
    unitNumber: 2,
    words: [
      ['mum', '/mʌm/', '（口语）妈妈'],
      ['dad', '/dæd/', '（口语）爸爸；爹爹'],
      ['grandma', '/ˈɡrænmɑː/', '奶奶；姥姥'],
      ['grandpa', '/ˈɡrænpɑː/', '爷爷；姥爷'],
      ['grandmother', '/ˈɡrænmʌðə(r)/', '（外）祖母；奶奶；姥姥；外婆'],
      ['mother', '/ˈmʌðə(r)/', '母亲；妈妈'],
      ['father', '/ˈfɑːðə(r)/', '父亲；爸爸'],
      ['grandfather', '/ˈɡrænfɑːðə(r)/', '（外）祖父；爷爷；姥爷；外公'],
      ['me', '/miː/', '我'],
      ['sister', '/ˈsɪstə(r)/', '姐；妹'],
      ['family', '/ˈfæməli/', '家；家庭'],
      ['have', '/hæv/', '有'],
      ['big', '/bɪɡ/', '大的'],
      ['cousin', '/ˈkʌzn/', '堂（表）兄弟；堂（表）姐妹'],
      ['brother', '/ˈbrʌðə(r)/', '哥；弟'],
      ['baby', '/ˈbeɪbi/', '婴儿'],
      ['uncle', '/ˈʌŋkl/', '伯父；叔父；舅父；姑父；姨父'],
      ['aunt', '/ɑːnt/', '伯母；婶母；舅母；姑母；姨母'],
      ['small', '/smɔːl/', '小的'],
    ],
  },
  {
    unitNumber: 3,
    words: [
      ['like', '/laɪk/', '喜欢'],
      ['dog', '/dɒɡ/', '狗'],
      ['pet', '/pet/', '宠物'],
      ['cat', '/kæt/', '猫'],
      ['fish', '/fɪʃ/', '鱼；鱼肉'],
      ['bird', '/bɜːd/', '鸟'],
      ['rabbit', '/ˈræbɪt/', '兔'],
      ['go', '/ɡəʊ/', '去；走'],
      ['zoo', '/zuː/', '动物园'],
      ['fox', '/fɒks/', '狐狸'],
      ['Miss', '/mɪs/', '（学生对女教师的称呼）老师；女士'],
      ['panda', '/ˈpændə/', '大熊猫'],
      ['red panda', '/red ˈpændə/', '小熊猫'],
      ['cute', '/kjuːt/', '可爱的'],
      ['monkey', '/ˈmʌŋki/', '猴子'],
      ['tiger', '/ˈtaɪɡə(r)/', '老虎'],
      ['elephant', '/ˈelɪfənt/', '大象'],
      ['lion', '/ˈlaɪən/', '狮子'],
      ['animal', '/ˈænɪml/', '动物'],
      ['giraffe', '/dʒəˈrɑːf/', '长颈鹿'],
      ['tall', '/tɔːl/', '高的'],
      ['fast', '/fɑːst/', '快的'],
    ],
  },
  {
    unitNumber: 4,
    words: [
      ['apple', '/ˈæpl/', '苹果'],
      ['banana', '/bəˈnɑːnə/', '香蕉'],
      ['farm', '/fɑːm/', '农场'],
      ['air', '/eə(r)/', '空气'],
      ['orange', '/ˈɒrɪndʒ/', ORANGE_MEANING],
      ['grape', '/ɡreɪp/', '葡萄'],
      ['school', '/skuːl/', '学校'],
      ['garden', '/ˈɡɑːdn/', '花园'],
      ['need', '/niːd/', '需要'],
      ['water', '/ˈwɔːtə(r)/', '给……浇水；水'],
      ['flower', '/ˈflaʊə(r)/', '花；花朵'],
      ['grass', '/ɡrɑːs/', '草；草地'],
      ['plant', '/plɑːnt/', '种植；植物'],
      ['new', '/njuː/', '新的'],
      ['tree', '/triː/', '树'],
      ['sun', '/sʌn/', '阳光；太阳'],
      ['give', '/ɡɪv/', '给'],
      ['them', '/ðəm, ðem/', '它们；他们；她们'],
    ],
  },
  {
    unitNumber: 5,
    words: [
      ['colour', '/ˈkʌlə(r)/', '颜色'],
      ['orange', '/ˈɒrɪndʒ/', ORANGE_MEANING],
      ['green', '/ɡriːn/', '绿色；绿色的'],
      ['red', '/red/', '红色；红色的'],
      ['blue', '/bluː/', '蓝色；蓝色的'],
      ['make', '/meɪk/', '使出现；做'],
      ['purple', '/ˈpɜːpl/', '紫色；紫色的'],
      ['brown', '/braʊn/', '棕色；棕色的'],
      ['bear', '/beə(r)/', '熊'],
      ['yellow', '/ˈjeləʊ/', '黄色；黄色的'],
      ['duck', '/dʌk/', '鸭'],
      ['sea', '/siː/', '海；海洋'],
      ['some', '/sʌm, səm/', '一些'],
      ['pink', '/pɪŋk/', '粉色；粉色的'],
      ['draw', '/drɔː/', '画'],
      ['white', '/waɪt/', '白色；白色的'],
      ['black', '/blæk/', '黑色；黑色的'],
    ],
  },
  {
    unitNumber: 6,
    words: [
      ['old', '/əʊld/', '（多少）岁；年纪；旧的'],
      ['five', '/faɪv/', '五'],
      ['year', '/jɪə(r)/', '年纪；年'],
      ['one', '/wʌn/', '一'],
      ['two', '/tuː/', '二'],
      ['three', '/θriː/', '三'],
      ['four', '/fɔː(r)/', '四'],
      ['ten', '/ten/', '十'],
      ['six', '/sɪks/', '六'],
      ['seven', '/ˈsevn/', '七'],
      ['eight', '/eɪt/', '八'],
      ['nine', '/naɪn/', '九'],
      ['o\'clock', '/əˈklɒk/', '（表示整点）……点钟'],
      ['cut', '/kʌt/', '切块'],
      ['eat', '/iːt/', '吃'],
      ['cake', '/keɪk/', '蛋糕'],
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

  // 1. 创建教材
  console.log('创建教材…')
  const tb = await createTextbook()
  console.log(`  ✓ 教材已创建：id=${tb.id} ${tb.publisher}·${tb.stage}·${tb.name}\n`)

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
