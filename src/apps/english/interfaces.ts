/**
 * 例句输入（添加单词时附带）
 */
export interface SentenceInput {
  sentence: string
  translation?: string
}

/**
 * 添加单词的请求体（关联到某课本的某单元）
 */
export interface AddWordPayload {
  textbookId: number
  unitNumber: number
  word: string
  phonetic?: string
  meaning: string
  sentences?: SentenceInput[]
}

/**
 * 创建课本的请求体
 */
export interface CreateTextbookPayload {
  stage: string
  name: string
  publisher: string
  grade?: string
  semester?: string
}

/**
 * 查询单词结果（含例句）
 */
export interface WordWithSentences {
  id: number
  word: string
  phonetic: string | null
  meaning: string
  sentences: SentenceResult[]
}

export interface SentenceResult {
  id: number
  sentence: string
  translation: string | null
}

/**
 * 反查单词出处的结果
 */
export interface WordLocation {
  stage: string
  textbookName: string
  publisher: string
  grade: string | null
  semester: string | null
  unitNumber: number
}

/**
 * 添加单词返回结果
 */
export interface AddWordResult {
  wordId: number
  created: boolean // 单词是否为本次新建（false 表示已存在并更新了释义）
}

/**
 * 批量添加单词时的单条输入（不含 textbookId，由外层统一指定）
 */
export interface BatchWordItem {
  unitNumber: number
  word: string
  phonetic?: string
  meaning: string
  sentences?: SentenceInput[]
}

/**
 * 批量添加单词请求体（全部关联到同一课本，单元号在各条目内）
 */
export interface BatchAddWordPayload {
  textbookId: number
  words: BatchWordItem[]
}

/**
 * 批量添加单词返回结果
 */
export interface BatchAddWordResult {
  total: number // 处理总数
  created: number // 本次新建的单词数
  updated: number // 已存在并更新释义的单词数
}

/**
 * 批量添加例句时的单条输入（按单词字符串查找 word_id，不修改释义）
 */
export interface BatchAddSentencesItem {
  word: string
  sentences: SentenceInput[]
}

/**
 * 批量添加例句请求体
 */
export interface BatchAddSentencesPayload {
  items: BatchAddSentencesItem[]
}

/**
 * 批量添加例句返回结果
 */
export interface BatchAddSentencesResult {
  total: number // 条目总数
  attached: number // 尝试插入的例句数
  missing: number // 未找到的单词数（word 不存在于 DB）
}
