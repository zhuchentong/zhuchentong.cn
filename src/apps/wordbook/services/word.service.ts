import type {
  AddWordPayload,
  AddWordResult,
  BatchAddSentencesPayload,
  BatchAddSentencesResult,
  BatchAddWordPayload,
  BatchAddWordResult,
  WordLocation,
  WordWithSentences,
} from '@wordbook/interfaces'

import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '@/database'
import {
  wordbookSentence,
  wordbookTextbook,
  wordbookTextbookWord,
  wordbookWord,
} from '@/database/schema'

/**
 * 添加单词到某课本的某单元（核心事务）
 *
 * 1. 单词去重：已存在则更新音标/释义，新建则插入
 * 2. 关联课本单元：已关联则跳过（联合主键去重）
 * 3. 插入例句：(word_id, sentence) 唯一约束去重
 */
export async function addWord(payload: AddWordPayload): Promise<AddWordResult> {
  return db.transaction(async (tx) => {
    // 先查是否存在，用于判断是否为本次新建
    const [existing] = await tx
      .select({ id: wordbookWord.id })
      .from(wordbookWord)
      .where(eq(wordbookWord.word, payload.word))

    // 条件构造 set：仅在提供 phonetic 时更新，避免误清空已有音标
    const set: { phonetic?: string, meaning: string } = { meaning: payload.meaning }
    if (payload.phonetic !== undefined) {
      set.phonetic = payload.phonetic
    }

    // 1. 单词去重 upsert
    const returned = await tx
      .insert(wordbookWord)
      .values({
        word: payload.word,
        phonetic: payload.phonetic,
        meaning: payload.meaning,
      })
      .onConflictDoUpdate({
        target: wordbookWord.word,
        set,
      })
      .returning({ id: wordbookWord.id })

    const wordId = returned[0]?.id
    if (wordId === undefined) {
      throw new Error('单词 upsert 失败')
    }

    // 2. 关联课本单元（联合主键去重）
    await tx
      .insert(wordbookTextbookWord)
      .values({
        textbookId: payload.textbookId,
        wordId,
        unitNumber: payload.unitNumber,
      })
      .onConflictDoNothing()

    // 3. 插入例句（唯一约束去重）
    if (payload.sentences?.length) {
      await tx
        .insert(wordbookSentence)
        .values(
          payload.sentences.map(s => ({
            wordId,
            sentence: s.sentence,
            translation: s.translation,
          })),
        )
        .onConflictDoNothing()
    }

    return { wordId, created: !existing }
  })
}

/**
 * 批量添加单词到某课本（核心事务，单事务内循环复用 upsert 逻辑）
 *
 * 全部条目共用同一个 textbookId，单元号在各条目内指定。
 * 任一条目失败则整体回滚。
 */
export async function batchAddWords(payload: BatchAddWordPayload): Promise<BatchAddWordResult> {
  let created = 0
  let updated = 0

  await db.transaction(async (tx) => {
    for (const item of payload.words) {
      // 先查是否存在，用于判断是否为本次新建
      const [existing] = await tx
        .select({ id: wordbookWord.id })
        .from(wordbookWord)
        .where(eq(wordbookWord.word, item.word))

      if (existing) {
        updated++
      }
      else {
        created++
      }

      // 条件构造 set：仅在提供 phonetic 时更新，避免误清空已有音标
      const set: { phonetic?: string, meaning: string } = { meaning: item.meaning }
      if (item.phonetic !== undefined) {
        set.phonetic = item.phonetic
      }

      // 1. 单词去重 upsert
      const returned = await tx
        .insert(wordbookWord)
        .values({
          word: item.word,
          phonetic: item.phonetic,
          meaning: item.meaning,
        })
        .onConflictDoUpdate({
          target: wordbookWord.word,
          set,
        })
        .returning({ id: wordbookWord.id })

      const wordId = returned[0]?.id
      if (wordId === undefined) {
        throw new Error(`单词 upsert 失败: ${item.word}`)
      }

      // 2. 关联课本单元（联合主键去重）
      await tx
        .insert(wordbookTextbookWord)
        .values({
          textbookId: payload.textbookId,
          wordId,
          unitNumber: item.unitNumber,
        })
        .onConflictDoNothing()

      // 3. 插入例句（唯一约束去重）
      if (item.sentences?.length) {
        await tx
          .insert(wordbookSentence)
          .values(
            item.sentences.map(s => ({
              wordId,
              sentence: s.sentence,
              translation: s.translation,
            })),
          )
          .onConflictDoNothing()
      }
    }
  })

  return { total: payload.words.length, created, updated }
}

/**
 * 查询某课本某单元下的单词（含例句）
 */
export async function listWords(textbookId: number, unitNumber: number): Promise<WordWithSentences[]> {
  const words = await db
    .select({
      id: wordbookWord.id,
      word: wordbookWord.word,
      phonetic: wordbookWord.phonetic,
      meaning: wordbookWord.meaning,
    })
    .from(wordbookTextbookWord)
    .innerJoin(wordbookWord, eq(wordbookTextbookWord.wordId, wordbookWord.id))
    .where(and(
      eq(wordbookTextbookWord.textbookId, textbookId),
      eq(wordbookTextbookWord.unitNumber, unitNumber),
    ))

  if (words.length === 0) {
    return []
  }

  // 批量查询这些单词的例句
  const wordIds = words.map(w => w.id)
  const sentences = await db
    .select({
      id: wordbookSentence.id,
      wordId: wordbookSentence.wordId,
      sentence: wordbookSentence.sentence,
      translation: wordbookSentence.translation,
    })
    .from(wordbookSentence)
    .where(inArray(wordbookSentence.wordId, wordIds))

  // 按单词分组例句
  const sentenceMap = new Map<number, WordWithSentences['sentences']>()
  for (const s of sentences) {
    const list = sentenceMap.get(s.wordId) ?? []
    list.push({ id: s.id, sentence: s.sentence, translation: s.translation })
    sentenceMap.set(s.wordId, list)
  }

  return words.map(w => ({
    id: w.id,
    word: w.word,
    phonetic: w.phonetic,
    meaning: w.meaning,
    sentences: sentenceMap.get(w.id) ?? [],
  }))
}

/**
 * 查询某课本下已有的单元号（去重、升序）
 */
export async function listUnitNumbers(textbookId: number): Promise<number[]> {
  const rows = await db
    .selectDistinct({ n: wordbookTextbookWord.unitNumber })
    .from(wordbookTextbookWord)
    .where(eq(wordbookTextbookWord.textbookId, textbookId))
    .orderBy(asc(wordbookTextbookWord.unitNumber))
  return rows.map(r => r.n)
}

/**
 * 按单词反查出处（出现在哪些课本的哪些单元）
 */
export async function searchWord(word: string): Promise<{ found: boolean, locations: WordLocation[] }> {
  const [wordRow] = await db
    .select({ id: wordbookWord.id })
    .from(wordbookWord)
    .where(eq(wordbookWord.word, word))

  if (!wordRow) {
    return { found: false, locations: [] }
  }

  const locations = await db
    .select({
      stage: wordbookTextbook.stage,
      textbookName: wordbookTextbook.name,
      publisher: wordbookTextbook.publisher,
      grade: wordbookTextbook.grade,
      semester: wordbookTextbook.semester,
      unitNumber: wordbookTextbookWord.unitNumber,
    })
    .from(wordbookTextbookWord)
    .innerJoin(wordbookTextbook, eq(wordbookTextbookWord.textbookId, wordbookTextbook.id))
    .where(eq(wordbookTextbookWord.wordId, wordRow.id))

  return {
    found: true,
    locations: locations.map(l => ({
      stage: l.stage,
      textbookName: l.textbookName,
      publisher: l.publisher,
      grade: l.grade,
      semester: l.semester,
      unitNumber: l.unitNumber,
    })),
  }
}

/**
 * 批量为已有单词添加例句（不修改释义/音标）
 *
 * 按 word 字符串查找 word_id，再 INSERT ON CONFLICT DO NOTHING。
 * 任一条目失败则整体回滚。
 */
export async function batchAddSentences(payload: BatchAddSentencesPayload): Promise<BatchAddSentencesResult> {
  let attached = 0
  let missing = 0

  await db.transaction(async (tx) => {
    for (const item of payload.items) {
      const [wordRow] = await tx
        .select({ id: wordbookWord.id })
        .from(wordbookWord)
        .where(eq(wordbookWord.word, item.word))

      if (!wordRow) {
        missing++
        continue
      }

      if (item.sentences.length > 0) {
        await tx
          .insert(wordbookSentence)
          .values(
            item.sentences.map(s => ({
              wordId: wordRow.id,
              sentence: s.sentence,
              translation: s.translation,
            })),
          )
          .onConflictDoNothing()

        attached += item.sentences.length
      }
    }
  })

  return { total: payload.items.length, attached, missing }
}
