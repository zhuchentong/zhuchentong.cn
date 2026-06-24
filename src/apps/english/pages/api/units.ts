import type { APIRoute } from 'astro'

import { fail, ok } from '@english/services/response'
import { listUnits } from '@english/services/textbook.service'

/** 查询某课本下所有单元（含标题），?textbookId=1 */
export const GET: APIRoute = async ({ url }) => {
  const textbookIdStr = url.searchParams.get('textbookId')
  if (!textbookIdStr) {
    return fail('缺少参数：textbookId')
  }
  const textbookId = Number(textbookIdStr)
  if (!Number.isFinite(textbookId)) {
    return fail('textbookId 不是合法数字')
  }
  const units = await listUnits(textbookId)
  return ok(units)
}
