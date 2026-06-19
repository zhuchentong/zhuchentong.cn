import type { APIRoute } from 'astro'

import { fail, ok } from '@wordbook/services/response'
import { listUnitNumbers } from '@wordbook/services/word.service'

/** 查询某课本下已有的单元号（去重升序），?textbookId=1 */
export const GET: APIRoute = async ({ url }) => {
  const textbookIdStr = url.searchParams.get('textbookId')
  if (!textbookIdStr) {
    return fail('缺少参数：textbookId')
  }
  const textbookId = Number(textbookIdStr)
  if (!Number.isFinite(textbookId)) {
    return fail('textbookId 不是合法数字')
  }
  const unitNumbers = await listUnitNumbers(textbookId)
  return ok(unitNumbers)
}
