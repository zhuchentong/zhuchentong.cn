import type {
  BatchAddTextbookSentencePayload,
  BatchAddTextbookSentenceResult,
  TextbookSentenceResult,
} from '@english/interfaces'

import { and, asc, eq, max } from 'drizzle-orm'
import { db } from '@/database'
import { englishSentence } from '@/database/schema'

/**
 * 查询某课本某单元下的课文句子（按 position 排序）
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
    .orderBy(asc(englishSentence.position))
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
  // 允许重复句：始终追加到单元末尾（max position + 1）
  const [maxRow] = await db
    .select({ p: max(englishSentence.position) })
    .from(englishSentence)
    .where(and(
      eq(englishSentence.textbookId, textbookId),
      eq(englishSentence.unitNumber, unitNumber),
    ))

  // 插入新句子
  const [inserted] = await db
    .insert(englishSentence)
    .values({
      textbookId,
      unitNumber,
      sentence,
      translation,
      position: (maxRow?.p ?? -1) + 1,
    })
    .returning({ id: englishSentence.id })

  return { id: inserted.id, created: true }
}

/**
 * 批量导入课文句子（单事务，按单元分配 position，ON CONFLICT DO UPDATE 更新顺序）
 *
 * 全部条目共用同一个 textbookId，单元号在各条目内指定。
 * 任一条目失败则整体回滚。
 */
export async function batchAddTextbookSentences(payload: BatchAddTextbookSentencePayload): Promise<BatchAddTextbookSentenceResult> {
  let created = 0
  let updated = 0
  // 每个单元的 position 计数器：按条目出现顺序 0,1,2... 递增
  const posCounter = new Map<number, number>()

  await db.transaction(async (tx) => {
    for (const item of payload.sentences) {
      const pos = posCounter.get(item.unitNumber) ?? 0
      posCounter.set(item.unitNumber, pos + 1)
      const result = await tx
        .insert(englishSentence)
        .values({
          textbookId: payload.textbookId,
          unitNumber: item.unitNumber,
          sentence: item.sentence,
          translation: item.translation,
          position: pos,
        })
        .onConflictDoUpdate({
          target: [englishSentence.textbookId, englishSentence.unitNumber, englishSentence.position],
          set: { sentence: item.sentence, translation: item.translation },
        })
        .returning({ id: englishSentence.id })

      if (result.length > 0) {
        created++
      }
      else {
        updated++
      }
    }
  })

  return { total: payload.sentences.length, created, skipped: updated }
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
