import type { WorkbookRenderParams } from '../interfaces'
import { useStore } from '@nanostores/react'
import { Leafer } from 'leafer-draw'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { calcWorkbookPageLayout, createWorkbookElements } from '../composables/useRenderer'
import { DEFAULT_PINYIN_CONFIG } from '../config'
import { A4_HEIGHT_MM, A4_WIDTH_MM } from '../constants'
import {
  pinyinAnswerColor,
  pinyinAnswerMode,
  pinyinFontColor,
  pinyinFontSize,
  pinyinGridSize,
  pinyinHighlightColor,
  pinyinHighlightEnabled,
  pinyinLineColor,
  pinyinMargin,
  pinyinQuestionGap,
  pinyinQuestions,
} from '../store'
import '@leafer-in/export'

const A4_CSS_WIDTH = 794
const A4_CSS_HEIGHT = 1123
const ZOOM_STEP = 25
const ZOOM_MIN = 25
const ZOOM_MAX = 200
const ZOOM_DEFAULT = 100

const SCROLL_PADDING = 48

export default function CanvasPreview() {
  const containerRefsRef = useRef<Map<number, HTMLDivElement>>(new Map())
  const leaferRefsRef = useRef<Map<number, Leafer>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const userZoomRef = useRef(false)
  const [zoom, setZoom] = useState(ZOOM_DEFAULT)

  const questions = useStore(pinyinQuestions)
  const answerMode = useStore(pinyinAnswerMode)
  const highlightEnabled = useStore(pinyinHighlightEnabled)
  const highlightColor = useStore(pinyinHighlightColor)
  const gridSize = useStore(pinyinGridSize)
  const questionGap = useStore(pinyinQuestionGap)
  const margin = useStore(pinyinMargin)
  const lineColor = useStore(pinyinLineColor)
  const answerColor = useStore(pinyinAnswerColor)
  const fontSize = useStore(pinyinFontSize)
  const fontColor = useStore(pinyinFontColor)

  const { questionsPerPage, totalPages } = useMemo(
    () => calcWorkbookPageLayout({
      questionCount: questions.length,
      gridSize,
      questionGap,
      marginTop: margin.top,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
      marginRight: margin.right,
      paperWidth: A4_WIDTH_MM,
      paperHeight: A4_HEIGHT_MM,
      questions,
    }),
    [questions, gridSize, questionGap, margin.top, margin.bottom, margin.left, margin.right],
  )

  const getRenderParams = useCallback((page: number): WorkbookRenderParams => ({
    questions,
    answerMode,
    highlightEnabled,
    highlightColor,
    gridSize,
    questionGap,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
    lineColor,
    answerColor,
    fontFamily: DEFAULT_PINYIN_CONFIG.fontFamily,
    fontWeight: 'normal',
    fontSize,
    fontColor,
    paperWidth: A4_WIDTH_MM,
    paperHeight: A4_HEIGHT_MM,
    startQuestionIndex: page * questionsPerPage,
  }), [questions, answerMode, highlightEnabled, highlightColor, gridSize, questionGap, margin, lineColor, answerColor, fontSize, fontColor, questionsPerPage])

  const renderAllPages = useCallback(() => {
    const dpr = Math.max(window.devicePixelRatio || 1, 2)
    for (let page = 0; page < totalPages; page++) {
      const container = containerRefsRef.current.get(page)
      if (!container)
        continue

      const oldLeafer = leaferRefsRef.current.get(page)
      if (oldLeafer)
        oldLeafer.destroy()

      const pxPerMM = A4_CSS_WIDTH / A4_WIDTH_MM
      const leafer = new Leafer({
        view: container,
        width: A4_CSS_WIDTH,
        height: A4_CSS_HEIGHT,
        pixelRatio: dpr,
      })

      const elements = createWorkbookElements(getRenderParams(page), pxPerMM)
      elements.forEach(el => leafer.add(el))
      leaferRefsRef.current.set(page, leafer)
    }
  }, [totalPages, getRenderParams])

  useEffect(() => {
    renderAllPages()
  }, [renderAllPages])

  useEffect(() => {
    const handleFontLoaded = () => renderAllPages()
    document.fonts.addEventListener('loadingdone', handleFontLoaded)
    return () => document.fonts.removeEventListener('loadingdone', handleFontLoaded)
  }, [renderAllPages])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container)
      return
    const observer = new ResizeObserver((entries) => {
      if (userZoomRef.current)
        return
      const width = entries[0].contentRect.width
      const available = width - SCROLL_PADDING
      if (available < A4_CSS_WIDTH) {
        const autoZoom = Math.floor(available / A4_CSS_WIDTH * 100)
        setZoom(Math.max(ZOOM_MIN, autoZoom))
      }
      else {
        setZoom(ZOOM_DEFAULT)
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const leaferMap = leaferRefsRef.current
    return () => {
      leaferMap.forEach(l => l.destroy())
      leaferMap.clear()
    }
  }, [])

  const setContainerRef = useCallback((page: number) => (el: HTMLDivElement | null) => {
    if (el)
      containerRefsRef.current.set(page, el)
    else containerRefsRef.current.delete(page)
  }, [])

  if (questions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        正在生成试题...
      </div>
    )
  }

  return (
    <div ref={scrollContainerRef} className="relative p-6 print:p-0 bg-gray-100 flex flex-1 justify-center overflow-auto">
      <div
        className="flex flex-col items-center gap-6 print:gap-0"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
      >
        {Array.from({ length: totalPages }, (_, page) => (
          <div
            key={page}
            className="relative bg-white shadow-lg print:shadow-none print:my-0"
            style={{
              width: `${A4_CSS_WIDTH}px`,
              height: `${A4_CSS_HEIGHT}px`,
              breakAfter: page < totalPages - 1 ? 'page' : 'auto',
            }}
          >
            <div
              ref={setContainerRef(page)}
              style={{ width: `${A4_CSS_WIDTH}px`, height: `${A4_CSS_HEIGHT}px` }}
            />
          </div>
        ))}
      </div>

      <div className="fixed right-6 bottom-6 z-50 flex flex-col items-center gap-1 bg-background rounded-lg border shadow-md p-1 print:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            userZoomRef.current = true
            setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP))
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            userZoomRef.current = true
            setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP))
          }}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            userZoomRef.current = false
            setZoom(ZOOM_DEFAULT)
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
