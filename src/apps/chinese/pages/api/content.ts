import type { APIRoute } from 'astro'

import { getChineseLessonContent } from '@chinese/services/chinese.service'
import { fail, ok } from '@chinese/services/response'

/** 查询某篇目的一类字/二类字/词语，?lessonId=1 */
export const GET: APIRoute = async ({ url }) => {
  const idStr = url.searchParams.get('lessonId')
  if (!idStr)
    return fail('缺少参数：lessonId')
  const lessonId = Number(idStr)
  if (!Number.isFinite(lessonId))
    return fail('lessonId 不是合法数字')
  const content = await getChineseLessonContent(lessonId)
  return ok(content)
}
