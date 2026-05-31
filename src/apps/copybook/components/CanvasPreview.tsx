import { calcPageLayout, renderGrid } from '@copybook/composables/useGridRenderer'
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
import { useCallback, useEffect, useMemo, useRef } from 'react'

const A4_CSS_WIDTH = 794
const A4_CSS_HEIGHT = 1123

export default function CanvasPreview() {
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
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

  const getRenderParams = useCallback((page: number) => ({
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

  const drawAllPages = useCallback(() => {
    const dpr = Math.max(window.devicePixelRatio || 1, 2)
    for (let page = 0; page < totalPages; page++) {
      const canvas = canvasRefs.current.get(page)
      if (!canvas)
        continue
      canvas.width = A4_CSS_WIDTH * dpr
      canvas.height = A4_CSS_HEIGHT * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx)
        continue
      const pxPerMM = (A4_CSS_WIDTH * dpr) / A4_WIDTH_MM
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(pxPerMM, pxPerMM)
      renderGrid(ctx, getRenderParams(page))
    }
  }, [totalPages, getRenderParams])

  useEffect(() => {
    drawAllPages()
  }, [drawAllPages])

  useEffect(() => {
    document.fonts.addEventListener('loadingdone', drawAllPages)
    return () => document.fonts.removeEventListener('loadingdone', drawAllPages)
  }, [drawAllPages])

  const setCanvasRef = useCallback((page: number) => (el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRefs.current.set(page, el)
    }
    else {
      canvasRefs.current.delete(page)
    }
  }, [])

  return (
    <div className="p-6 print:p-0 bg-gray-100 flex flex-1 justify-center overflow-auto">
      <div className="flex flex-col items-center gap-6 print:gap-0">
        {Array.from({ length: totalPages }, (_, page) => (
          <div key={page} className="bg-white shadow-lg print:shadow-none print:my-0" style={{ width: `${A4_CSS_WIDTH}px`, height: `${A4_CSS_HEIGHT}px`, breakAfter: page < totalPages - 1 ? 'page' : 'auto' }}>
            <canvas
              ref={setCanvasRef(page)}
              style={{ width: `${A4_CSS_WIDTH}px`, height: `${A4_CSS_HEIGHT}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
