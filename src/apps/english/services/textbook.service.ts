import type { CreateTextbookPayload } from '@english/interfaces'

import { eq } from 'drizzle-orm'
import { db } from '@/database'
import { englishSentence, englishTextbook, englishTextbookWord, englishUnit } from '@/database/schema'

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
function gradeRank(grade: string | null | undefined): number {
  if (!grade)
    return 99
  // 先匹配两位中文数字，避免「十一」「十二」被单字「一」「二」抢先命中
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
function semesterRank(sem: string | null | undefined): number {
  if (sem === '上')
    return 0
  if (sem === '下')
    return 1
  return 2
}

/**
 * 查询课本列表，可按学段筛选
 * 排序：年级从低到高，同年级上册在前、下册在后
 */
export async function listTextbooks(stage?: string) {
  const rows = stage
    ? await db.select().from(englishTextbook).where(eq(englishTextbook.stage, stage))
    : await db.select().from(englishTextbook)
  return rows.sort((a, b) => {
    const gradeDiff = gradeRank(a.grade) - gradeRank(b.grade)
    if (gradeDiff !== 0)
      return gradeDiff
    return semesterRank(a.semester) - semesterRank(b.semester)
  })
}

/**
 * 创建课本
 */
export async function createTextbook(payload: CreateTextbookPayload) {
  const [row] = await db.insert(englishTextbook)
    .values({
      stage: payload.stage,
      name: payload.name,
      publisher: payload.publisher,
      grade: payload.grade,
      semester: payload.semester,
    })
    .returning()
  return row
}

/**
 * 查询某课本下所有单元（含标题）
 *
 * 三源 union：english_unit 元数据（标题来源）+ english_sentence（句子派生）+
 * english_textbook_word（单词派生）。无元数据的课本（如新概念）title 为 null。
 * 排序：有 position 的按 position，否则按 unitNumber 升序。
 */
export async function listUnits(textbookId: number): Promise<{ unitNumber: number, title: string | null }[]> {
  // 1. 单元元数据（标题 + 自定义排序）
  const unitRows = await db
    .select({
      unitNumber: englishUnit.unitNumber,
      title: englishUnit.title,
      position: englishUnit.position,
    })
    .from(englishUnit)
    .where(eq(englishUnit.textbookId, textbookId))

  const metaMap = new Map<number, { title: string | null, position: number }>()
  for (const r of unitRows)
    metaMap.set(r.unitNumber, { title: r.title, position: r.position })

  // 2. 句子派生的单元号
  const sentRows = await db
    .selectDistinct({ unitNumber: englishSentence.unitNumber })
    .from(englishSentence)
    .where(eq(englishSentence.textbookId, textbookId))

  // 3. 单词派生的单元号
  const wordRows = await db
    .selectDistinct({ unitNumber: englishTextbookWord.unitNumber })
    .from(englishTextbookWord)
    .where(eq(englishTextbookWord.textbookId, textbookId))

  // 合并所有单元号
  const allUnits = new Set<number>()
  for (const r of unitRows)
    allUnits.add(r.unitNumber)
  for (const r of sentRows)
    allUnits.add(r.unitNumber)
  for (const r of wordRows)
    allUnits.add(r.unitNumber)

  // 拼装标题并排序
  const result = [...allUnits].map(unitNumber => ({
    unitNumber,
    title: metaMap.get(unitNumber)?.title ?? null,
  }))
  result.sort((a, b) => {
    const pa = metaMap.get(a.unitNumber)?.position
    const pb = metaMap.get(b.unitNumber)?.position
    if (pa !== undefined && pb !== undefined)
      return pa - pb
    return a.unitNumber - b.unitNumber
  })
  return result
}
