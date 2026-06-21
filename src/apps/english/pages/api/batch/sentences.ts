import type { BatchTextbookSentenceItem } from '@english/interfaces'

import type { APIRoute } from 'astro'
import { fail, ok } from '@english/services/response'
import { batchAddTextbookSentences } from '@english/services/sentence.service'

/**
 * 批量导入课文句子到某课本（各条目内指定单元号）
 *
 * 请求体：{ textbookId: number, sentences: BatchTextbookSentenceItem[] }
 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as { textbookId?: number, sentences?: BatchTextbookSentenceItem[] }
  const { textbookId, sentences } = body

  if (!textbookId || !Array.isArray(sentences) || sentences.length === 0) {
    return fail('缺少必填字段：textbookId, sentences[]')
  }

  // 校验每条目，并做基本清洗
  const cleaned: BatchTextbookSentenceItem[] = []
  for (const item of sentences) {
    if (item.unitNumber === undefined || !item.sentence) {
      return fail(`存在不合法条目，需包含 unitNumber, sentence：${JSON.stringify(item)}`)
    }
    cleaned.push({
      unitNumber: item.unitNumber,
      sentence: item.sentence.trim(),
      translation: item.translation?.trim() || undefined,
    })
  }

  try {
    const result = await batchAddTextbookSentences({ textbookId, sentences: cleaned })
    return ok(result, 201)
  }
  catch (err) {
    console.error('批量导入课文句子失败:', err)
    return fail('批量导入课文句子失败', 500)
  }
}
