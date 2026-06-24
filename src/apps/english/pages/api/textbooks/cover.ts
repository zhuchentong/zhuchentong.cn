import type { APIRoute } from 'astro'

import { Buffer } from 'node:buffer'
import { fail, ok } from '@english/services/response'
import { updateTextbookCover } from '@english/services/textbook.service'
import { eq } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import { db } from '@/database'
import { englishTextbook } from '@/database/schema'
import { deleteObject, keyFromUrl, publicUrl, uploadObject } from '@/services/qiniu-storage'

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 21)

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData()
  const file = formData.get('cover')
  const textbookIdRaw = formData.get('textbookId')

  if (!file || !(file instanceof File)) {
    return fail('缺少封面文件')
  }
  if (!textbookIdRaw) {
    return fail('缺少 textbookId')
  }

  const textbookId = Number(textbookIdRaw)
  if (Number.isNaN(textbookId)) {
    return fail('textbookId 无效')
  }

  // 校验类型
  if (!ALLOWED_TYPES.has(file.type)) {
    return fail('仅支持 JPG、PNG、WebP 格式')
  }

  // 校验大小
  if (file.size > MAX_SIZE) {
    return fail('文件大小不能超过 5MB')
  }

  try {
    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = EXT_MAP[file.type]!
    const key = `img_${nanoid()}.${ext}`

    // 查询旧封面（用于后续删除）
    const [textbook] = await db.select({ coverUrl: englishTextbook.coverUrl })
      .from(englishTextbook)
      .where(eq(englishTextbook.id, textbookId))

    if (!textbook) {
      return fail('教材不存在', 404)
    }

    // 上传新封面到七牛
    await uploadObject(key, buffer, file.type)

    // 更新 DB（先写 DB，保证一致性）
    const url = publicUrl(key)
    await updateTextbookCover(textbookId, url)

    // 删除旧封面（best-effort）
    if (textbook.coverUrl) {
      const oldKey = keyFromUrl(textbook.coverUrl)
      if (oldKey && oldKey !== key) {
        await deleteObject(oldKey)
      }
    }

    return ok({ coverUrl: url })
  }
  catch (err) {
    console.error('上传封面失败:', err)
    return fail('上传封面失败', 500)
  }
}
