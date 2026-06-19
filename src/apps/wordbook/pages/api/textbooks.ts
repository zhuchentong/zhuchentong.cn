import type { CreateTextbookPayload } from '@wordbook/interfaces'

import type { APIRoute } from 'astro'
import { fail, ok } from '@wordbook/services/response'
import { createTextbook, listTextbooks } from '@wordbook/services/textbook.service'

/** 查询课本列表，可选 ?stage=小学 筛选 */
export const GET: APIRoute = async ({ url }) => {
  const stage = url.searchParams.get('stage') ?? undefined
  const textbooks = await listTextbooks(stage)
  return ok(textbooks)
}

/** 创建课本 */
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as Partial<CreateTextbookPayload>
  const { stage, name, publisher, grade, semester } = body
  if (!stage || !name || !publisher) {
    return fail('缺少必填字段：stage, name, publisher')
  }
  try {
    const row = await createTextbook({ stage, name, publisher, grade, semester })
    return ok(row, 201)
  }
  catch (err) {
    console.error('创建课本失败:', err)
    return fail('创建课本失败', 500)
  }
}
