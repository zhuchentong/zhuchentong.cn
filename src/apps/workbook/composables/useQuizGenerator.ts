import type { Question } from '../interfaces'
import pinyinDict from '../assets/data/pinyin-dict.json'

/** 拼音音节结构 */
interface Syllable {
  /** 拼音（带声调） */
  pinyin: string
  /** 声母（如 "zh"），整体认读音节为 null */
  initial: string | null
  /** 韵母（如 "uang"） */
  final: string
}

/** 词典类型：汉字 → 音节数组 */
type WordDict = Record<string, Syllable[]>
const dict = pinyinDict as WordDict

/** 声母倒排索引：声母 → 匹配的单词集合 */
const indexByInitial: Record<string, Set<string>> = {}
/** 韵母倒排索引：韵母 → 匹配的单词集合 */
const indexByFinal: Record<string, Set<string>> = {}

// 构建倒排索引：遍历词典，按声母/韵母建立索引
for (const [word, syllables] of Object.entries(dict)) {
  for (const s of syllables) {
    if (s.initial) {
      ;(indexByInitial[s.initial] ??= new Set()).add(word)
    }
    ;(indexByFinal[s.final] ??= new Set()).add(word)
  }
}

/**
 * LCG 线性同余伪随机数生成器
 * 使用经典参数：a = 1664525, c = 1013904223, m = 2^32
 * 相同种子产生相同的随机序列，用于可复现的题目随机化
 * @param seed - 随机种子
 * @returns 返回一个生成随机数的函数，每次调用返回 [0, 1) 的浮点数
 */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    // LCG 递推公式：s = (a * s + c) mod 2^32
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF
    // 转为 [0, 1) 的浮点数
    return (s >>> 0) / 0xFFFFFFFF
  }
}

/**
 * Fisher-Yates 洗牌算法
 * 原地随机打乱数组，时间复杂度 O(n)
 * @param arr - 要打乱的数组
 * @param rng - 随机数生成函数
 * @returns 打乱后的新数组（不修改原数组）
 */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 统计符合条件的单词数量
 * 根据声母和韵母列表，通过倒排索引快速匹配
 * @param initials - 声母列表（如 ["zh", "ch", "sh"]）
 * @param finals - 韵母列表（如 ["ang", "eng", "ing"]）
 * @returns 匹配的单词数量
 */
export function countMatches(initials: string[], finals: string[]): number {
  const matchWords = new Set<string>()
  for (const i of initials) {
    indexByInitial[i]?.forEach(w => matchWords.add(w))
  }
  for (const f of finals) {
    indexByFinal[f]?.forEach(w => matchWords.add(w))
  }
  return matchWords.size
}

/**
 * 生成拼音练习题
 *
 * 流程：
 * 1. 根据声母/韵母列表，通过倒排索引筛选匹配的单词
 * 2. 为每个单词构建 Question 结构（拼音 + 高亮标记）
 * 3. 使用种子随机打乱后取前 count 个
 *
 * @param initials - 声母列表
 * @param finals - 韵母列表
 * @param seed - 随机种子（相同种子产生相同题目）
 * @param count - 需要生成的题目数量
 * @returns 题目数组
 */
export function generateQuiz(initials: string[], finals: string[], seed: number, count: number): Question[] {
  // 通过倒排索引收集匹配的单词
  const matchWords = new Set<string>()
  for (const i of initials) {
    indexByInitial[i]?.forEach(w => matchWords.add(w))
  }
  for (const f of finals) {
    indexByFinal[f]?.forEach(w => matchWords.add(w))
  }

  // 构建题目池：为每个单词生成拼音和高亮标记
  const pool: Question[] = []
  for (const word of matchWords) {
    const syllables = dict[word]
    pool.push({
      words: word,
      pinyin: syllables.map(s => s.pinyin),
      // 高亮标记：声母或韵母匹配的位置标记为 true
      highlight: syllables.map(s =>
        (s.initial !== null && initials.includes(s.initial))
        || finals.includes(s.final),
      ),
    })
  }

  // 使用种子随机打乱后取前 count 个
  const rng = seededRandom(seed)
  return shuffle(pool, rng).slice(0, count)
}
