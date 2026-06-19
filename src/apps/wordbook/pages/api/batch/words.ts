import type { BatchWordItem } from '@wordbook/interfaces'

import type { APIRoute } from 'astro'
import { fail, ok } from '@wordbook/services/response'
import { batchAddWords } from '@wordbook/services/word.service'

/**
 * 批量添加单词到某课本（各条目内指定单元号）
 *
 * 请求体：{ textbookId: number, words: BatchWordItem[] }
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as { textbookId?: number, words?: BatchWordItem[] }
  const { textbookId, words } = body

  if (!textbookId || !Array.isArray(words) || words.length === 0) {
    return fail('缺少必填字段：textbookId, words[]')
  }

  // 校验每条目，并做基本清洗
  const cleaned: BatchWordItem[] = []
  for (const item of words) {
    if (item.unitNumber === undefined || !item.word || !item.meaning) {
      return fail(`存在不合法条目，需包含 unitNumber, word, meaning：${JSON.stringify(item)}`)
    }
    cleaned.push({
      unitNumber: item.unitNumber,
      word: item.word.trim(),
      phonetic: item.phonetic?.trim() || undefined,
      meaning: item.meaning,
      sentences: item.sentences,
    })
  }

  try {
    const result = await batchAddWords({ textbookId, words: cleaned })
    return ok(result, 201)
  }
  catch (err) {
    console.error('批量添加单词失败:', err)
    return fail('批量添加单词失败', 500)
  }
}
