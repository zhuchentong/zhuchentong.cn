import type { APIRoute } from 'astro'

import { fail, ok } from '@english/services/response'
import { searchWord } from '@english/services/word.service'

/** 按单词反查出处，?q=apple */
export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get('q') ?? '').trim()
  if (!q) {
    return fail('缺少参数：q')
  }
  const result = await searchWord(q)
  return ok(result)
}
