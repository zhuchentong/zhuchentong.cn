import type { AddWordPayload } from '@wordbook/interfaces'

import type { APIRoute } from 'astro'
import { fail, ok } from '@wordbook/services/response'
import { addWord, listWords } from '@wordbook/services/word.service'

/** 查询某课本某单元下的单词（含例句），?textbookId=1&unitNumber=1 */
export const GET: APIRoute = async ({ url }) => {
  const textbookIdStr = url.searchParams.get('textbookId')
  const unitNumberStr = url.searchParams.get('unitNumber')
  if (!textbookIdStr || !unitNumberStr) {
    return fail('缺少参数：textbookId, unitNumber')
  }
  const textbookId = Number(textbookIdStr)
  const unitNumber = Number(unitNumberStr)
  if (!Number.isFinite(textbookId) || !Number.isFinite(unitNumber)) {
    return fail('textbookId 或 unitNumber 不是合法数字')
  }
  const words = await listWords(textbookId, unitNumber)
  return ok(words)
}

/** 添加单词到某课本的某单元（核心接口） */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as Partial<AddWordPayload>
  const { textbookId, unitNumber, word, meaning, phonetic, sentences } = body
  if (!textbookId || unitNumber === undefined || !word || !meaning) {
    return fail('缺少必填字段：textbookId, unitNumber, word, meaning')
  }
  try {
    const result = await addWord({
      textbookId,
      unitNumber,
      word: word.trim(),
      phonetic: phonetic?.trim() || undefined,
      meaning,
      sentences,
    })
    return ok(result, 201)
  }
  catch (err) {
    console.error('添加单词失败:', err)
    return fail('添加单词失败', 500)
  }
}
