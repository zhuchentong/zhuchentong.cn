import { useEffect, useRef, useState } from 'react'
import { FONT_MAP } from '@/config/font.config'

/** 全局字体缓存：key → 生成的 FontFace 名称 */
const loadedFonts = new Map<string, string>()
/** 字体名称计数器，用于生成唯一的 FontFace 名称 */
let fontCounter = 0

interface UseFontLoaderOptions {
  /** 防抖延迟（毫秒），默认 0 */
  debounceMs?: number
}

/**
 * 构建字体缓存键
 * 由 fontId + 去重排序后的字符集组成，确保相同字符集复用缓存
 * @param text - 需要加载字体的文本
 * @param fontId - 字体标识
 * @returns 缓存键字符串
 */
function buildKey(text: string, fontId: string): string {
  // 将文本去重、排序后拼接，确保相同字符集生成相同的 key
  return `${fontId}:${[...new Set(text)].sort().join('')}`
}

/**
 * 字体加载钩子
 *
 * 功能：
 * - 根据文本内容动态加载字体子集（通过 /api/font-subset 接口）
 * - 使用 Map 缓存已加载的字体，避免重复请求
 * - 支持防抖，避免频繁输入时大量请求
 * - 使用 FontFace API 动态注入字体到浏览器
 * - 处理竞态条件：取消过时的请求，防止后发请求覆盖先发结果
 *
 * @param text - 需要加载字体的文本内容
 * @param fontId - 字体标识（对应 FONT_MAP 中的 key）
 * @param options - 可选配置
 * @param options.debounceMs - 防抖延迟（毫秒）
 * @returns 包含 resolvedFontName、fontLoaded、loading 的状态对象
 */
export function useFontLoader(text: string, fontId: string, options?: UseFontLoaderOptions) {
  const { debounceMs = 0 } = options ?? {}

  const currentKey = buildKey(text, fontId)
  // 从缓存中获取已加载的字体
  const cachedFont = loadedFonts.get(currentKey) ?? null
  // 获取字体配置中的回退字体
  const fallback = FONT_MAP.get(fontId)?.fallback ?? 'serif'

  const [loadedKey, setLoadedKey] = useState<string | null>(
    () => cachedFont ? currentKey : null,
  )
  const [loadedFontName, setLoadedFontName] = useState<string | null>(
    () => cachedFont,
  )

  // 字体加载状态计算
  const fontLoaded = loadedKey === currentKey || !!cachedFont
  const resolvedFontName = cachedFont ?? (loadedKey === currentKey ? loadedFontName : null) ?? fallback
  const loading = !!text.trim() && !cachedFont && loadedKey !== currentKey

  // 用于竞态处理的加载 ID 引用
  const currentLoadIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function loadFont(inputText: string, fid: string) {
      // 空文本时重置状态
      if (!inputText.trim()) {
        if (!cancelled) {
          setLoadedKey(null)
          setLoadedFontName(null)
        }
        return
      }

      const key = buildKey(inputText, fid)
      // 命中缓存时直接使用
      const cached = loadedFonts.get(key)
      if (cached) {
        if (!cancelled) {
          setLoadedKey(key)
          setLoadedFontName(cached)
        }
        return
      }

      // 生成加载 ID，用于检测竞态
      const loadId = ++currentLoadIdRef.current

      try {
        // 请求字体子集 API
        const params = new URLSearchParams({ text: inputText, font: fid })
        const res = await fetch(`/api/font-subset?${params}`)
        if (!res.ok)
          throw new Error(`API error: ${res.status}`)
        const { data } = await res.json()

        // 竞态检查：如果请求已取消或被新请求覆盖，则丢弃结果
        if (cancelled || loadId !== currentLoadIdRef.current)
          return

        // 使用 FontFace API 动态加载字体
        const fontFaceName = `FontSubset_${fontCounter++}`
        const fontFace = new FontFace(fontFaceName, `url(${data})`)
        const loaded = await fontFace.load()
        document.fonts.add(loaded)

        // 更新缓存和状态
        loadedFonts.set(key, fontFaceName)
        if (!cancelled) {
          setLoadedKey(key)
          setLoadedFontName(fontFaceName)
        }
      }
      catch (err) {
        console.error('Font load error:', err)
        if (!cancelled) {
          setLoadedKey(null)
          setLoadedFontName(null)
        }
      }
    }

    // 防抖处理
    const timer = setTimeout(() => {
      loadFont(text, fontId)
    }, debounceMs)

    // 清理函数：取消请求和定时器
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text, fontId, debounceMs])

  return { resolvedFontName, fontLoaded, loading }
}
