import type { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { FONT_MAP } from '@copybook/config'
import Fontmin from 'fontmin'

const SOURCE_DIR = process.env.NODE_ENV === 'production'
  ? path.resolve(process.cwd(), 'dist/fonts')
  : path.resolve(process.cwd(), 'src/apps/copybook/assets/fonts')

const BASE_CHARS = (() => {
  let chars = ''
  for (let i = 0x20; i <= 0x7E; i++)
    chars += String.fromCodePoint(i)
  chars += '，。、；：？！\u201C\u201D\u2018\u2019（）【】《》—…·'
  return chars
})()

interface CacheEntry {
  data: string
  timestamp: number
}

const MAX_CACHE_SIZE = 200
const cache = new Map<string, CacheEntry>()

function getCacheKey(fontId: string, text: string): string {
  const uniqueChars = [...new Set(text)].sort().join('')
  return `${fontId}:${uniqueChars}`
}

function evictCache() {
  if (cache.size <= MAX_CACHE_SIZE)
    return
  const entries = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
  for (const [key] of entries.slice(0, cache.size - MAX_CACHE_SIZE)) {
    cache.delete(key)
  }
}

function getSourceFontPath(fontId: string): string {
  const config = FONT_MAP.get(fontId)
  if (!config)
    throw new Error(`Unknown font: ${fontId}`)
  return path.join(SOURCE_DIR, config.sourceFile)
}

function subsetFont(sourcePath: string, text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    new Fontmin()
      .src(sourcePath)
      .use(Fontmin.glyph({ text, hinting: false }))
      .use(Fontmin.ttf2woff2())
      .run((err: Error | null, files: any[]) => {
        if (err) {
          reject(err)
          return
        }
        const woff2 = files.find(f => f.path.endsWith('.woff2'))
        if (!woff2) {
          reject(new Error('woff2 output not found'))
          return
        }
        resolve(woff2.contents)
      })
  })
}

export async function getFontSubsetBase64(fontId: string, text: string): Promise<string> {
  const key = getCacheKey(fontId, text)
  const cached = cache.get(key)
  if (cached) {
    cached.timestamp = Date.now()
    return cached.data
  }

  const sourcePath = getSourceFontPath(fontId)
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source font file not found: ${sourcePath}`)
  }

  const fullText = BASE_CHARS + text
  const woff2Buf = await subsetFont(sourcePath, fullText)
  const base64 = `data:font/woff2;base64,${woff2Buf.toString('base64')}`

  cache.set(key, { data: base64, timestamp: Date.now() })
  evictCache()

  return base64
}
