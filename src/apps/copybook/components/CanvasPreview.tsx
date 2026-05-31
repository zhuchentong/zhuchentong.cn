import type { RenderParams } from '@copybook/interfaces'
import { calcPageLayout, createGridElements } from '@copybook/composables/useGridRenderer'
import { A4_HEIGHT_MM, A4_WIDTH_MM } from '@copybook/constants'
import { useFontLoader } from '@copybook/hooks/useFontLoader'
import {
  copybookFontOffsetY,
  copybookFontSize,
  copybookFontWeight,
  copybookGridSize,
  copybookGridType,
  copybookHighlightFirst,
  copybookInsertEmptyCol,
  copybookInsertEmptyRow,
  copybookLineColor,
  copybookMargin,
  copybookRowGap,
  copybookText,
  copybookTraceColor,
  copybookTraceCount,
} from '@copybook/store'
import { useStore } from '@nanostores/react'
import { Leafer } from 'leafer-draw'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import '@leafer-in/export'

const A4_CSS_WIDTH = 794
const A4_CSS_HEIGHT = 1123

export default function CanvasPreview() {
  const containerRefsRef = useRef<Map<number, HTMLDivElement>>(new Map())
  const leaferRefsRef = useRef<Map<number, Leafer>>(new Map())
  const { resolvedFontName } = useFontLoader()

  const text = useStore(copybookText)
  const gridType = useStore(copybookGridType)
  const gridSize = useStore(copybookGridSize)
  const rowGap = useStore(copybookRowGap)
  const margin = useStore(copybookMargin)
  const fontWeight = useStore(copybookFontWeight)
  const fontSize = useStore(copybookFontSize)
  const fontOffsetY = useStore(copybookFontOffsetY)
  const traceCount = useStore(copybookTraceCount)
  const traceColor = useStore(copybookTraceColor)
  const lineColor = useStore(copybookLineColor)
  const highlightFirst = useStore(copybookHighlightFirst)
  const insertEmptyRow = useStore(copybookInsertEmptyRow)
  const insertEmptyCol = useStore(copybookInsertEmptyCol)

  const charCount = Array.from(text).length

  const { rowsPerPage, totalPages } = useMemo(
    () => calcPageLayout({
      charCount,
      gridSize,
      rowGap,
      marginTop: margin.top,
      marginBottom: margin.bottom,
      paperHeight: A4_HEIGHT_MM,
      insertEmptyRow,
    }),
    [charCount, gridSize, rowGap, margin.top, margin.bottom, insertEmptyRow],
  )

  const charsPerPage = insertEmptyRow ? Math.ceil(rowsPerPage / 2) : rowsPerPage

  const getRenderParams = useCallback((page: number): RenderParams => ({
    text,
    gridType,
    gridSize,
    rowGap,
    marginTop: margin.top,
    marginRight: margin.right,
    marginBottom: margin.bottom,
    marginLeft: margin.left,
    fontFamily: resolvedFontName,
    fontWeight,
    fontSize,
    fontOffsetY,
    traceCount,
    traceColor,
    lineColor,
    highlightFirst,
    insertEmptyRow,
    insertEmptyCol,
    paperWidth: A4_WIDTH_MM,
    paperHeight: A4_HEIGHT_MM,
    startCharIndex: page * charsPerPage,
  }), [text, gridType, gridSize, rowGap, margin, resolvedFontName, fontWeight, fontSize, fontOffsetY, traceCount, traceColor, lineColor, highlightFirst, insertEmptyRow, insertEmptyCol, charsPerPage])

  const renderAllPages = useCallback(() => {
    const dpr = Math.max(window.devicePixelRatio || 1, 2)

    for (let page = 0; page < totalPages; page++) {
      const container = containerRefsRef.current.get(page)
      if (!container)
        continue

      // 销毁旧的 Leafer 实例
      const oldLeafer = leaferRefsRef.current.get(page)
      if (oldLeafer) {
        oldLeafer.destroy()
      }

      // 计算像素比例：A4 纸张 mm 转 px
      const pxPerMM = A4_CSS_WIDTH / A4_WIDTH_MM

      // 创建新的 Leafer 实例
      const leafer = new Leafer({
        view: container,
        width: A4_CSS_WIDTH,
        height: A4_CSS_HEIGHT,
        pixelRatio: dpr,
      })

      // 创建元素并添加到 Leafer
      const elements = createGridElements(getRenderParams(page))

      // 添加元素并设置缩放
      elements.forEach((el) => {
        el.scale = pxPerMM
        leafer.add(el)
      })

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

  // 清理所有 Leafer 实例
  useEffect(() => {
    const leaferMap = leaferRefsRef.current
    return () => {
      leaferMap.forEach((leafer) => {
        leafer.destroy()
      })
      leaferMap.clear()
    }
  }, [])

  const setContainerRef = useCallback((page: number) => (el: HTMLDivElement | null) => {
    if (el) {
      containerRefsRef.current.set(page, el)
    }
    else {
      containerRefsRef.current.delete(page)
    }
  }, [])

  return (
    <div className="p-6 print:p-0 bg-gray-100 flex flex-1 justify-center overflow-auto">
      <div className="flex flex-col items-center gap-6 print:gap-0">
        {Array.from({ length: totalPages }, (_, page) => (
          <div key={page} className="bg-white shadow-lg print:shadow-none print:my-0" style={{ width: `${A4_CSS_WIDTH}px`, height: `${A4_CSS_HEIGHT}px`, breakAfter: page < totalPages - 1 ? 'page' : 'auto' }}>
            <div
              ref={setContainerRef(page)}
              style={{ width: `${A4_CSS_WIDTH}px`, height: `${A4_CSS_HEIGHT}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
