import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const cnchar = require('cnchar')
require('cnchar-words')
cnchar.use(require('cnchar-words'))
const { pinyin } = require('pinyin-pro')

const PER_CHAPTER = 300

function removeTone(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036F]/g, '').replace(/ü/g, 'v')
}

const INIT_LIST = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w']

function getInitial(py) {
  const nt = removeTone(py)
  for (const init of INIT_LIST) {
    if (nt.startsWith(init))
      return init
  }
  return ''
}

function getFinal(py) {
  const nt = removeTone(py)
  for (const init of INIT_LIST) {
    if (nt.startsWith(init))
      return nt.slice(init.length)
  }
  return nt
}

function matchesRule(py, rule) {
  const init = getInitial(py)
  const final = getFinal(py)
  const nt = removeTone(py)
  if (rule.initials.length && rule.initials.includes(init))
    return true
  if (rule.finals.length && rule.finals.includes(final))
    return true
  if (rule.specialSpells.length && rule.specialSpells.includes(nt))
    return true
  return false
}

const rules = {
  1: { initials: ['y', 'w'], finals: [], specialSpells: ['yi', 'yu', 'wu', 'ya', 'wa', 'wo', 'ye', 'yue'] },
  2: { initials: ['b', 'p', 'm', 'f'], finals: [], specialSpells: [] },
  3: { initials: ['d', 't', 'n', 'l'], finals: [], specialSpells: [] },
  4: { initials: ['g', 'k', 'h'], finals: [], specialSpells: [] },
  5: { initials: ['j', 'q', 'x'], finals: [], specialSpells: [] },
  6: { initials: ['zh', 'ch', 'sh', 'r'], finals: [], specialSpells: [] },
  7: { initials: ['z', 'c', 's'], finals: [], specialSpells: [] },
  8: { initials: [], finals: ['ai', 'ei', 'ao', 'ou'], specialSpells: [] },
  9: { initials: [], finals: ['ia', 'ie', 'ua', 'uo', 've'], specialSpells: ['ye', 'yue', 'wa', 'wo'] },
  10: { initials: [], finals: ['iao', 'iu', 'uai', 'ui'], specialSpells: ['you', 'wei', 'yao'] },
  11: { initials: [], finals: ['an', 'en', 'in', 'un', 'vn'], specialSpells: ['yan', 'yin', 'yun', 'wan', 'wen'] },
  12: { initials: [], finals: ['ang', 'eng', 'ing', 'ong'], specialSpells: ['yang', 'ying', 'yong', 'wang', 'weng'] },
}

const pools = {
  1: '阿鹅衣雨乌鱼五无一月芽牙瓦窝夜语意义艺议二耳偶尔恩安暗按岸昂',
  2: '八百白本半巴边步变别北报平跑苹朋皮盘胖排怕飘破品爸妈木明猫面门米马毛美梦没风飞方分发货饭服放副非粉房奋佛',
  3: '大天地多都读东到得灯当打电点短刀袋答胆段定动独度夺朵躲对队铁条吐兔腿推糖甜头太替探谈天同童退汤图涂毯叹拖',
  4: '哥歌个工公共古故关广光干赶根更过国果该改高告狗够挂怪规鬼贵康空孔看卡裤筐狂矿亏窥',
  5: '家加假架见交脚叫教酒就久旧九鸡机积记几及急集季技巧桥瞧切亲清请气七起齐奇骑旗秋球全权缺确群学稀喜先小笑星秀选',
  6: '中知只纸指直治制种竹主住注抓煮真阵争整正证织职执止志质钟忠舟祝装庄状追准捉长大展招战着朝争召这',
  7: '自字子足族组总最罪在做作坐左昨杂怎赞暂早澡则择责增赠资姿紫宗综棕走租阻嘴钻尊遵才从村草猜层寸催存葱脆侧财残操测册',
  8: '白百拍买开菜来海爱太代才快外排败奶背美黑给非没配北飞泪妹辈杯保报早到老好高草跑脑靠包毛桃手头狗口够楼周收',
  9: '家加花画话夸瓜果过火活说课桌却学雪月确雀觉决绝缺写谢夜爷野叶业接街借介界解铁贴听停鞋下夏斜歇血靴',
  10: '小鸟牛柳条笑叫巧桥标表苗描秒庙手头口楼狗走够后州收求球流留六油游右又优友幽久九救旧就酒快甩乖怪水谁睡岁虽碎',
  11: '蓝天半盘难干看山弯三单担淡蛋谈探安暗岸班般搬板伴办满南男蓝篮含寒喊汉汗门分翻粉纷芬份森林本认真深深身申神晨',
  12: '方长当忙光帮房旁堂常让上商伤赏想向象像香乡相响央阳羊洋仰王忘望往旺风空红中种东动同通工公功松送冬钟龙农浓弄胸雄熊容融翁',
}

function shuffle(arr) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const allQuestions = []

for (let ch = 1; ch <= 12; ch++) {
  const rule = rules[ch]
  const pool = pools[ch]
  const candidates = []
  const seen = new Set()

  for (const char of pool) {
    const wordList = cnchar.words(char) || []
    for (const word of wordList) {
      if (word.length !== 2 || seen.has(word))
        continue
      const pinyins = pinyin(word, { toneType: 'symbol', type: 'array' })
      if (pinyins.some(py => matchesRule(py, rule))) {
        seen.add(word)
        candidates.push({
          words: word,
          pinyin: pinyins,
          chapter: ch,
        })
      }
    }
  }

  const selected = shuffle(candidates).slice(0, PER_CHAPTER)
  allQuestions.push(...selected)
  console.log(`Ch${ch}: ${selected.length}/${candidates.length}`)
}

const outPath = new URL('../src/apps/workbook/assets/data/pinyin-questions.json', import.meta.url)
writeFileSync(outPath, `${JSON.stringify(allQuestions, null, 2)}\n`)
console.log(`\nTotal: ${allQuestions.length} questions written to ${outPath.pathname}`)
