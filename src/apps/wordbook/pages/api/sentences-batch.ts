import type { BatchAddSentencesItem } from '@wordbook/interfaces'

import type { APIRoute } from 'astro'
import { fail, ok } from '@wordbook/services/response'
import { batchAddSentences } from '@wordbook/services/word.service'

/**
 * 批量为已有单词添加例句（不修改释义/音标）
 *
 * 请求体：{ items: [{ word: string, sentences: SentenceInput[] }] }
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as { items?: BatchAddSentencesItem[] }
  const { items } = body

  if (!Array.isArray(items) || items.length === 0) {
    return fail('缺少必填字段：items[]')
  }

  for (const item of items) {
    if (!item.word || !Array.isArray(item.sentences) || item.sentences.length === 0) {
      return fail(`存在不合法条目，需包含 word 和 sentences[]：${JSON.stringify(item)}`)
    }
  }

  const cleaned: BatchAddSentencesItem[] = items.map(item => ({
    word: item.word.trim(),
    sentences: item.sentences
      .filter(s => s.sentence?.trim())
      .map(s => ({
        sentence: s.sentence.trim(),
        translation: s.translation?.trim() || undefined,
      })),
  })).filter(item => item.sentences.length > 0)

  if (cleaned.length === 0) {
    return fail('清洗后无有效条目')
  }

  try {
    const result = await batchAddSentences({ items: cleaned })
    return ok(result, 201)
  }
  catch (err) {
    console.error('批量添加例句失败:', err)
    return fail('批量添加例句失败', 500)
  }
}
