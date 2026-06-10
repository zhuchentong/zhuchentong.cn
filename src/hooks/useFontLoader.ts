import { useEffect, useRef, useState } from 'react'
import { FONT_MAP } from '@/config/font.config'

const loadedFonts = new Map<string, string>()
let fontCounter = 0

interface UseFontLoaderOptions {
  debounceMs?: number
}

function buildKey(text: string, fontId: string): string {
  return `${fontId}:${[...new Set(text)].sort().join('')}`
}

export function useFontLoader(text: string, fontId: string, options?: UseFontLoaderOptions) {
  const { debounceMs = 0 } = options ?? {}

  const currentKey = buildKey(text, fontId)
  const cachedFont = loadedFonts.get(currentKey) ?? null
  const fallback = FONT_MAP.get(fontId)?.fallback ?? 'serif'

  const [loadedKey, setLoadedKey] = useState<string | null>(
    () => cachedFont ? currentKey : null,
  )
  const [loadedFontName, setLoadedFontName] = useState<string | null>(
    () => cachedFont,
  )

  const fontLoaded = loadedKey === currentKey || !!cachedFont
  const resolvedFontName = cachedFont ?? (loadedKey === currentKey ? loadedFontName : null) ?? fallback
  const loading = !!text.trim() && !cachedFont && loadedKey !== currentKey

  const currentLoadIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function loadFont(inputText: string, fid: string) {
      if (!inputText.trim()) {
        if (!cancelled) {
          setLoadedKey(null)
          setLoadedFontName(null)
        }
        return
      }

      const key = buildKey(inputText, fid)
      const cached = loadedFonts.get(key)
      if (cached) {
        if (!cancelled) {
          setLoadedKey(key)
          setLoadedFontName(cached)
        }
        return
      }

      const loadId = ++currentLoadIdRef.current

      try {
        const params = new URLSearchParams({ text: inputText, font: fid })
        const res = await fetch(`/api/font-subset?${params}`)
        if (!res.ok)
          throw new Error(`API error: ${res.status}`)
        const { data } = await res.json()

        if (cancelled || loadId !== currentLoadIdRef.current)
          return

        const fontFaceName = `FontSubset_${fontCounter++}`
        const fontFace = new FontFace(fontFaceName, `url(${data})`)
        const loaded = await fontFace.load()
        document.fonts.add(loaded)

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

    const timer = setTimeout(() => {
      loadFont(text, fontId)
    }, debounceMs)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text, fontId, debounceMs])

  return { resolvedFontName, fontLoaded, loading }
}
