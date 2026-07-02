import { asc, eq } from 'drizzle-orm'

import { db } from '@/database'
import {
  chineseCharacter,
  chineseLesson,
  chineseLessonCharacter,
  chineseLessonWord,
  chineseTextbook,
  chineseUnit,
  chineseWord,
} from '@/database/schema'

/** 中文数字映射，用于年级排序 */
const CN_NUM: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
}

/** 将年级文本转为数字排序键（取首个匹配的中文数字） */
function gradeRank(grade: string | null): number {
  if (!grade)
    return 99
  // 先匹配两位中文数字，避免「十一」「十二」被单字抢先命中
  if (grade.includes('十一'))
    return 11
  if (grade.includes('十二'))
    return 12
  for (const [ch, n] of Object.entries(CN_NUM)) {
    if (grade.includes(ch))
      return n
  }
  return 99
}

/** 学期排序键：上册 < 下册 < 无 */
function semesterRank(sem: string | null): number {
  if (sem === '上')
    return 0
  if (sem === '下')
    return 1
  return 2
}

/**
 * 查询全部语文教材，按年级从低到高、同年级上册在前排序
 */
export async function listChineseTextbooks() {
  const rows = await db.select({
    id: chineseTextbook.id,
    name: chineseTextbook.name,
    grade: chineseTextbook.grade,
    semester: chineseTextbook.semester,
  }).from(chineseTextbook)
  return rows.sort((a, b) => {
    const d = gradeRank(a.grade) - gradeRank(b.grade)
    return d !== 0 ? d : semesterRank(a.semester) - semesterRank(b.semester)
  })
}

/** 单篇课文（含语文园地）摘要 */
export interface ChineseLessonItem {
  id: number
  lessonNumber: number | null
  title: string | null
  type: string
}

/** 单元（含其下篇目） */
export interface ChineseUnitGroup {
  unitNumber: number
  unitTitle: string | null
  lessons: ChineseLessonItem[]
}

/**
 * 查询某教材的单元→篇目树（含课文与语文园地），按 position 排序
 *
 * 注意：chinese_lesson 与 chinese_unit 均有 id 列，join 时必须用显式 select({...})
 * 限定列名，避免裸 select() 触发 "column id is ambiguous" 错误。
 */
export async function listChineseLessons(textbookId: number): Promise<ChineseUnitGroup[]> {
  const rows = await db.select({
    unitNumber: chineseUnit.unitNumber,
    unitTitle: chineseUnit.title,
    lessonId: chineseLesson.id,
    lessonNumber: chineseLesson.lessonNumber,
    lessonTitle: chineseLesson.title,
    type: chineseLesson.type,
  }).from(chineseLesson).innerJoin(chineseUnit, eq(chineseUnit.id, chineseLesson.unitId)).where(eq(chineseUnit.textbookId, textbookId)).orderBy(asc(chineseUnit.position), asc(chineseLesson.position))

  const map = new Map<number, ChineseUnitGroup>()
  for (const r of rows) {
    let g = map.get(r.unitNumber)
    if (!g) {
      g = { unitNumber: r.unitNumber, unitTitle: r.unitTitle, lessons: [] }
      map.set(r.unitNumber, g)
    }
    g.lessons.push({
      id: r.lessonId,
      lessonNumber: r.lessonNumber,
      title: r.lessonTitle,
      type: r.type,
    })
  }
  return [...map.values()]
}

/** 课文生字/词语内容 */
export interface ChineseLessonContent {
  /** 一类字（写字表），无拼音 */
  yilei: string[]
  /** 二类字（识字表），含本课上下文拼音 */
  erlei: { char: string, pinyin: string | null }[]
  /** 词语表（供未来语文应用使用） */
  words: string[]
}

/**
 * 查询某篇目的一类字/二类字/词语
 * position 在导入时按类别独立编号，故按 category+position 排序保证各类内部顺序
 */
export async function getChineseLessonContent(lessonId: number): Promise<ChineseLessonContent> {
  const charRows = await db.select({
    character: chineseCharacter.character,
    category: chineseLessonCharacter.category,
    pinyin: chineseLessonCharacter.pinyin,
    position: chineseLessonCharacter.position,
  }).from(chineseLessonCharacter).innerJoin(chineseCharacter, eq(chineseCharacter.id, chineseLessonCharacter.characterId)).where(eq(chineseLessonCharacter.lessonId, lessonId)).orderBy(asc(chineseLessonCharacter.category), asc(chineseLessonCharacter.position))

  const yilei: string[] = []
  const erlei: { char: string, pinyin: string | null }[] = []
  for (const r of charRows) {
    if (r.category === 'one')
      yilei.push(r.character)
    else if (r.category === 'two')
      erlei.push({ char: r.character, pinyin: r.pinyin })
  }

  const wordRows = await db.select({
    word: chineseWord.word,
  }).from(chineseLessonWord).innerJoin(chineseWord, eq(chineseWord.id, chineseLessonWord.wordId)).where(eq(chineseLessonWord.lessonId, lessonId)).orderBy(asc(chineseLessonWord.position))

  return { yilei, erlei, words: wordRows.map(r => r.word) }
}
