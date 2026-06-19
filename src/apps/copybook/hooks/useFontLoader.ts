import { copybookFontFamily, copybookResolvedFont, copybookText } from '@copybook/store'
import { useStore } from '@nanostores/react'
import { useEffect } from 'react'
import { useFontLoader as useSharedFontLoader } from '@/hooks/useFontLoader'

export function useFontLoader() {
  const text = useStore(copybookText)
  const fontFamily = useStore(copybookFontFamily)

  const result = useSharedFontLoader(text, fontFamily, { debounceMs: 500 })

  useEffect(() => {
    copybookResolvedFont.set(result.resolvedFontName)
  }, [result.resolvedFontName])

  return result
}
