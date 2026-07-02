import type { APIRoute } from 'astro'

import { listChineseTextbooks } from '@chinese/services/chinese.service'
import { ok } from '@chinese/services/response'

/** 查询全部语文教材 */
export const GET: APIRoute = async () => {
  const textbooks = await listChineseTextbooks()
  return ok(textbooks)
}
