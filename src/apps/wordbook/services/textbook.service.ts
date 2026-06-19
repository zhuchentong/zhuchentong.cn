import type { CreateTextbookPayload } from '@wordbook/interfaces'

import { eq } from 'drizzle-orm'
import { db } from '@/database'
import { wordbookTextbook } from '@/database/schema'

/**
 * 查询课本列表，可按学段筛选
 */
export function listTextbooks(stage?: string) {
  return stage
    ? db.select().from(wordbookTextbook).where(eq(wordbookTextbook.stage, stage))
    : db.select().from(wordbookTextbook)
}

/**
 * 创建课本
 */
export async function createTextbook(payload: CreateTextbookPayload) {
  const [row] = await db.insert(wordbookTextbook)
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
