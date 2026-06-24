import type { Buffer } from 'node:buffer'

import process from 'node:process'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const REGION = process.env.QINIU_REGION ?? import.meta.env.QINIU_REGION
const ENDPOINT = process.env.QINIU_ENDPOINT ?? import.meta.env.QINIU_ENDPOINT
const ACCESS_KEY = process.env.QINIU_ACCESS_KEY ?? import.meta.env.QINIU_ACCESS_KEY
const SECRET_KEY = process.env.QINIU_SECRET_KEY ?? import.meta.env.QINIU_SECRET_KEY
const BUCKET = process.env.QINIU_BUCKET ?? import.meta.env.QINIU_BUCKET
const PUBLIC_DOMAIN = process.env.QINIU_PUBLIC_DOMAIN ?? import.meta.env.QINIU_PUBLIC_DOMAIN

let _client: S3Client | null = null

function getS3(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      credentials: { accessKeyId: ACCESS_KEY!, secretAccessKey: SECRET_KEY! },

    })
  }
  return _client
}

/** 上传对象到七牛 S3 */
export async function uploadObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await getS3().send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
}

/** 删除对象（容错：不存在时仅 warn） */
export async function deleteObject(key: string): Promise<void> {
  try {
    await getS3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  }
  catch (err) {
    console.warn(`[qiniu] 删除对象失败 (${key}):`, err)
  }
}

/** 根据 key 构建公开访问 URL */
export function publicUrl(key: string): string {
  return `${PUBLIC_DOMAIN}/${key}`
}

/** 从完整公开 URL 反推对象 key */
export function keyFromUrl(url: string): string | null {
  const prefix = `${PUBLIC_DOMAIN}/`
  if (!url.startsWith(prefix))
    return null
  return url.slice(prefix.length)
}
