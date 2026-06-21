import type { AddTextbookSentencePayload } from '@english/interfaces'

import type { APIRoute } from 'astro'
import { fail, ok } from '@english/services/response'
import { addTextbookSentence, deleteTextbookSentence, listTextbookSentences } from '@english/services/sentence.service'

/** 查询某课本某单元下的课文句子，?textbookId=1&unitNumber=1 */
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
  const sentences = await listTextbookSentences(textbookId, unitNumber)
  return ok(sentences)
}

/** 录入单条课文句子 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as Partial<AddTextbookSentencePayload>
  const { textbookId, unitNumber, sentence, translation } = body
  if (!textbookId || unitNumber === undefined || !sentence) {
    return fail('缺少必填字段：textbookId, unitNumber, sentence')
  }
  try {
    const result = await addTextbookSentence(
      textbookId,
      unitNumber,
      sentence.trim(),
      translation?.trim() || undefined,
    )
    return ok(result, 201)
  }
  catch (err) {
    console.error('添加课文句子失败:', err)
    return fail('添加课文句子失败', 500)
  }
}

/** 删除课文句子，?id=1 */
export const DELETE: APIRoute = async ({ url }) => {
  const idStr = url.searchParams.get('id')
  if (!idStr) {
    return fail('缺少参数：id')
  }
  const id = Number(idStr)
  if (!Number.isFinite(id)) {
    return fail('id 不是合法数字')
  }
  try {
    const deleted = await deleteTextbookSentence(id)
    if (!deleted) {
      return fail('句子不存在', 404)
    }
    return ok({ deleted: true })
  }
  catch (err) {
    console.error('删除课文句子失败:', err)
    return fail('删除课文句子失败', 500)
  }
}
