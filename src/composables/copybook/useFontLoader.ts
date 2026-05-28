// src/composables/copybook/useFontLoader.ts
import { useStore } from '@nanostores/vue'
import { ref, watch } from 'vue'
import { FONT_MAP } from '@/config/fonts.config'
import { copybookFontFamily, copybookText } from '@/stores/copybook.store'

const loadedFonts = new Map<string, string>()
let fontCounter = 0

export function useFontLoader() {
  const text = useStore(copybookText)
  const fontFamily = useStore(copybookFontFamily)

  const fontLoaded = ref(false)
  const resolvedFontName = ref('serif')
  const loading = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let currentLoadId = 0

  async function loadFont(inputText: string, fontId: string) {
    if (!inputText.trim()) {
      const config = FONT_MAP.get(fontId)
      resolvedFontName.value = config?.fallback ?? 'serif'
      fontLoaded.value = false
      return
    }

    const cacheKey = `${fontId}:${[...new Set(inputText)].sort().join('')}`
    if (loadedFonts.has(cacheKey)) {
      resolvedFontName.value = loadedFonts.get(cacheKey)!
      fontLoaded.value = true
      return
    }

    loading.value = true
    const loadId = ++currentLoadId

    try {
      const params = new URLSearchParams({ text: inputText, font: fontId })
      const res = await fetch(`/api/font-subset?${params}`)
      if (!res.ok)
        throw new Error(`API error: ${res.status}`)
      const { data } = await res.json()

      if (loadId !== currentLoadId)
        return

      const fontFaceName = `CopybookSubset_${fontCounter++}`
      const fontFace = new FontFace(fontFaceName, `url(${data})`)
      const loaded = await fontFace.load()
      document.fonts.add(loaded)

      resolvedFontName.value = fontFaceName
      loadedFonts.set(cacheKey, fontFaceName)
      fontLoaded.value = true
    }
    catch (err) {
      console.error('Font load error:', err)
      const config = FONT_MAP.get(fontId)
      resolvedFontName.value = config?.fallback ?? 'serif'
      fontLoaded.value = false
    }
    finally {
      if (loadId === currentLoadId)
        loading.value = false
    }
  }

  watch([text, fontFamily], ([newText, newFont]) => {
    if (debounceTimer)
      clearTimeout(debounceTimer)
    fontLoaded.value = false
    debounceTimer = setTimeout(() => {
      loadFont(newText, newFont)
    }, 500)
  }, { immediate: true })

  return { fontLoaded, resolvedFontName, loading }
}
