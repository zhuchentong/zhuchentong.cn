import type { APIRoute } from 'astro'

import { listChineseLessons } from '@chinese/services/chinese.service'
import { fail, ok } from '@chinese/services/response'

/** 查询某教材的单元→篇目树，?textbookId=1 */
export const GET: APIRoute = async ({ url }) => {
  const idStr = url.searchParams.get('textbookId')
  if (!idStr)
    return fail('缺少参数：textbookId')
  const textbookId = Number(idStr)
  if (!Number.isFinite(textbookId))
    return fail('textbookId 不是合法数字')
  const units = await listChineseLessons(textbookId)
  return ok(units)
}
