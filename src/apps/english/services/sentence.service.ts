import type {
  BatchAddTextbookSentencePayload,
  BatchAddTextbookSentenceResult,
  TextbookSentenceResult,
} from '@english/interfaces'

import { and, eq } from 'drizzle-orm'
import { db } from '@/database'
import { englishSentence } from '@/database/schema'

/**
 * 查询某课本某单元下的课文句子
 */
export async function listTextbookSentences(textbookId: number, unitNumber: number): Promise<TextbookSentenceResult[]> {
  return db
    .select({
      id: englishSentence.id,
      sentence: englishSentence.sentence,
      translation: englishSentence.translation,
    })
    .from(englishSentence)
    .where(and(
      eq(englishSentence.textbookId, textbookId),
      eq(englishSentence.unitNumber, unitNumber),
    ))
    .orderBy(englishSentence.id)
}

/**
 * 录入单条课文句子（去重：textbook_id + unit_number + sentence 唯一约束）
 *
 * 已存在则返回 { id, created: false }
 * 不存在则插入并返回 { id, created: true }
 */
export async function addTextbookSentence(
  textbookId: number,
  unitNumber: number,
  sentence: string,
  translation?: string,
): Promise<{ id: number, created: boolean }> {
  // 先查是否存在
  const [existing] = await db
    .select({ id: englishSentence.id })
    .from(englishSentence)
    .where(and(
      eq(englishSentence.textbookId, textbookId),
      eq(englishSentence.unitNumber, unitNumber),
      eq(englishSentence.sentence, sentence),
    ))

  if (existing) {
    return { id: existing.id, created: false }
  }

  // 插入新句子
  const [inserted] = await db
    .insert(englishSentence)
    .values({
      textbookId,
      unitNumber,
      sentence,
      translation,
    })
    .returning({ id: englishSentence.id })

  return { id: inserted.id, created: true }
}

/**
 * 批量导入课文句子（单事务，ON CONFLICT DO NOTHING 去重）
 *
 * 全部条目共用同一个 textbookId，单元号在各条目内指定。
 * 任一条目失败则整体回滚。
 */
export async function batchAddTextbookSentences(payload: BatchAddTextbookSentencePayload): Promise<BatchAddTextbookSentenceResult> {
  let created = 0
  let skipped = 0

  await db.transaction(async (tx) => {
    for (const item of payload.sentences) {
      const result = await tx
        .insert(englishSentence)
        .values({
          textbookId: payload.textbookId,
          unitNumber: item.unitNumber,
          sentence: item.sentence,
          translation: item.translation,
        })
        .onConflictDoNothing()
        .returning({ id: englishSentence.id })

      if (result.length > 0) {
        created++
      }
      else {
        skipped++
      }
    }
  })

  return { total: payload.sentences.length, created, skipped }
}

/**
 * 删除课文句子
 */
export async function deleteTextbookSentence(id: number): Promise<boolean> {
  const result = await db
    .delete(englishSentence)
    .where(eq(englishSentence.id, id))
    .returning({ id: englishSentence.id })

  return result.length > 0
}
