import type { CreateTextbookPayload } from '@english/interfaces'

import { eq } from 'drizzle-orm'
import { db } from '@/database'
import { englishTextbook } from '@/database/schema'

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
