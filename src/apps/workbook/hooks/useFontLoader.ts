import { useFontLoader as useSharedFontLoader } from '@/hooks/useFontLoader'
import { useStore } from '@nanostores/react'
import { useEffect, useMemo } from 'react'
import { pinyinFontFamily, pinyinQuestions, pinyinResolvedFont } from '../store'

export function useFontLoader() {
  const questions = useStore(pinyinQuestions)
  const fontFamily = useStore(pinyinFontFamily)

  const text = useMemo(
    () => [...new Set(questions.flatMap(q => [...q.words]))].join(''),
    [questions],
  )

  const result = useSharedFontLoader(text, fontFamily)

  useEffect(() => {
    pinyinResolvedFont.set(result.resolvedFontName)
  }, [result.resolvedFontName])

  return result
}
