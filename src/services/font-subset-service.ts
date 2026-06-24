import type { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import Fontmin from 'fontmin'
import { FONT_MAP } from '@/config/font.config'

/**
 * 源字体文件目录
 * 生产环境：dist/fonts（构建后复制的字体文件）
 * 开发环境：src/assets/fonts（源码中的字体文件）
 */
const SOURCE_DIR = import.meta.env.MODE === 'production'
  ? path.resolve(process.cwd(), 'dist/fonts')
  : path.resolve(process.cwd(), 'src/assets/fonts')

/**
 * 基础字符集：ASCII 可打印字符 + 常用中文标点
 * 字体子集化时会始终包含这些字符，确保标点符号正常显示
 */
const BASE_CHARS = (() => {
  let chars = ''
  // ASCII 可打印字符（空格 ~ 波浪号）
  for (let i = 0x20; i <= 0x7E; i++)
    chars += String.fromCodePoint(i)
  // 常用中文标点
  chars += '，。、；：？！\u201C\u201D\u2018\u2019（）【】《》—…·'
  return chars
})()

/** 缓存条目结构 */
interface CacheEntry {
  /** base64 编码的字体数据 */
  data: string
  /** 最后访问时间戳（用于 LRU 淘汰） */
  timestamp: number
}

/** 缓存最大容量 */
const MAX_CACHE_SIZE = 200
/** LRU 缓存：key → CacheEntry */
const cache = new Map<string, CacheEntry>()

/**
 * 生成缓存键
 * 由 fontId + 去重排序后的字符集组成，确保相同字符集复用缓存
 * @param fontId - 字体标识
 * @param text - 需要子集化的文本
 * @returns 缓存键字符串
 */
function getCacheKey(fontId: string, text: string): string {
  const uniqueChars = [...new Set(text)].sort().join('')
  return `${fontId}:${uniqueChars}`
}

/**
 * LRU 缓存淘汰
 * 当缓存超过 MAX_CACHE_SIZE 时，删除最旧的条目
 */
function evictCache() {
  if (cache.size <= MAX_CACHE_SIZE)
    return
  // 按时间戳升序排序，删除最旧的条目
  const entries = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
  for (const [key] of entries.slice(0, cache.size - MAX_CACHE_SIZE)) {
    cache.delete(key)
  }
}

/**
 * 获取源字体文件路径
 * @param fontId - 字体标识（对应 FONT_MAP 中的 key）
 * @returns 源字体文件的绝对路径
 * @throws 未知字体标识时抛出错误
 */
function getSourceFontPath(fontId: string): string {
  const config = FONT_MAP.get(fontId)
  if (!config)
    throw new Error(`Unknown font: ${fontId}`)
  return path.join(SOURCE_DIR, config.sourceFile)
}

/**
 * 执行字体子集化
 * 使用 Fontmin 从源字体中提取指定字形，转换为 woff2 格式
 * @param sourcePath - 源字体文件路径（.ttf）
 * @param text - 需要提取的字符集
 * @returns woff2 格式的字体 Buffer
 */
function subsetFont(sourcePath: string, text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    new Fontmin()
      .src(sourcePath)
      // 提取指定字形，禁用 hinting 以减小体积
      .use(Fontmin.glyph({ text, hinting: false }))
      // 转换为 woff2 格式
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

/**
 * 获取字体子集的 base64 数据 URL（带缓存）
 *
 * 流程：
 * 1. 检查缓存，命中则更新时间戳并返回
 * 2. 获取源字体文件路径
 * 3. 拼接基础字符集 + 用户文本，执行子集化
 * 4. 转换为 base64 data URL，写入缓存并淘汰旧条目
 *
 * @param fontId - 字体标识
 * @param text - 需要加载字体的文本
 * @returns base64 编码的字体 data URL（可直接用于 CSS url()）
 */
export async function getFontSubsetBase64(fontId: string, text: string): Promise<string> {
  const key = getCacheKey(fontId, text)
  const cached = cache.get(key)
  if (cached) {
    // 命中缓存，更新访问时间戳
    cached.timestamp = Date.now()
    return cached.data
  }

  const sourcePath = getSourceFontPath(fontId)
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source font file not found: ${sourcePath}`)
  }

  // 拼接基础字符集和用户文本，确保标点符号始终包含
  const fullText = BASE_CHARS + text
  const woff2Buf = await subsetFont(sourcePath, fullText)
  const base64 = `data:font/woff2;base64,${woff2Buf.toString('base64')}`

  // 写入缓存并执行淘汰
  cache.set(key, { data: base64, timestamp: Date.now() })
  evictCache()

  return base64
}
