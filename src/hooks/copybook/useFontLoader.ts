import { useStore } from '@nanostores/react'
import { useEffect, useRef, useState } from 'react'
import { FONT_MAP } from '@/config/fonts.config'
import { copybookFontFamily, copybookText } from '@/stores/copybook.store'

const loadedFonts = new Map<string, string>()
let fontCounter = 0

export function useFontLoader() {
  const text = useStore(copybookText)
  const fontFamily = useStore(copybookFontFamily)

  const [fontLoaded, setFontLoaded] = useState(false)
  const [resolvedFontName, setResolvedFontName] = useState('serif')
  const [loading, setLoading] = useState(false)

  const currentLoadIdRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function loadFont(inputText: string, fontId: string) {
      if (!inputText.trim()) {
        const config = FONT_MAP.get(fontId)
        if (!cancelled) {
          setResolvedFontName(config?.fallback ?? 'serif')
          setFontLoaded(false)
        }
        return
      }

      const cacheKey = `${fontId}:${[...new Set(inputText)].sort().join('')}`
      if (loadedFonts.has(cacheKey)) {
        if (!cancelled) {
          setResolvedFontName(loadedFonts.get(cacheKey)!)
          setFontLoaded(true)
        }
        return
      }

      if (!cancelled)
        setLoading(true)
      const loadId = ++currentLoadIdRef.current

      try {
        const params = new URLSearchParams({ text: inputText, font: fontId })
        const res = await fetch(`/api/font-subset?${params}`)
        if (!res.ok)
          throw new Error(`API error: ${res.status}`)
        const { data } = await res.json()

        if (cancelled || loadId !== currentLoadIdRef.current)
          return

        const fontFaceName = `CopybookSubset_${fontCounter++}`
        const fontFace = new FontFace(fontFaceName, `url(${data})`)
        const loaded = await fontFace.load()
        document.fonts.add(loaded)

        loadedFonts.set(cacheKey, fontFaceName)
        if (!cancelled) {
          setResolvedFontName(fontFaceName)
          setFontLoaded(true)
        }
      }
      catch (err) {
        console.error('Font load error:', err)
        if (!cancelled) {
          const config = FONT_MAP.get(fontId)
          setResolvedFontName(config?.fallback ?? 'serif')
          setFontLoaded(false)
        }
      }
      finally {
        if (!cancelled && loadId === currentLoadIdRef.current)
          setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      loadFont(text, fontFamily)
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [text, fontFamily])

  return { fontLoaded, resolvedFontName, loading }
}
