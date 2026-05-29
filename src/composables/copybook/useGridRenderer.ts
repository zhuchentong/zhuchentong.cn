import type { GridType, RenderParams } from '@/interfaces/copybook'

export function mmToPx(mm: number, dpi: number): number {
  return mm * dpi / 25.4
}

export function drawGridCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  type: GridType,
  lineColor: string,
) {
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 0.3

  ctx.setLineDash([])
  ctx.strokeRect(x, y, size, size)

  if (type === 'tian' || type === 'mi') {
    drawCross(ctx, x, y, size, lineColor)
  }

  if (type === 'mi') {
    drawDiagonals(ctx, x, y, size, lineColor)
  }

  if (type === 'huigong' || type === 'huitian' || type === 'huimi') {
    drawInnerBox(ctx, x, y, size, lineColor)
  }

  if (type === 'huitian' || type === 'huimi') {
    drawCross(ctx, x, y, size, lineColor)
  }

  if (type === 'huimi') {
    drawDiagonals(ctx, x, y, size, lineColor)
  }

  if (type === 'jiugong') {
    drawNineGrid(ctx, x, y, size, lineColor)
  }
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color
  ctx.setLineDash([0.3, 1])
  ctx.beginPath()
  ctx.moveTo(x + size / 2, y)
  ctx.lineTo(x + size / 2, y + size)
  ctx.moveTo(x, y + size / 2)
  ctx.lineTo(x + size, y + size / 2)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawDiagonals(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color
  ctx.setLineDash([0.3, 1])
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + size, y + size)
  ctx.moveTo(x + size, y)
  ctx.lineTo(x, y + size)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawInnerBox(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const inset = size / 3
  ctx.strokeStyle = color
  ctx.setLineDash([0.3, 1])
  ctx.strokeRect(x + inset, y + inset, size - 2 * inset, size - 2 * inset)
  ctx.setLineDash([])
}

function drawNineGrid(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color
  ctx.setLineDash([0.3, 1])
  const step = size / 3
  ctx.beginPath()
  for (let i = 1; i <= 2; i++) {
    ctx.moveTo(x + step * i, y)
    ctx.lineTo(x + step * i, y + size)
    ctx.moveTo(x, y + step * i)
    ctx.lineTo(x + size, y + step * i)
  }
  ctx.stroke()
  ctx.setLineDash([])
}

export function drawChar(
  ctx: CanvasRenderingContext2D,
  char: string,
  x: number,
  y: number,
  cellSize: number,
  fontSizePercent: number,
  offsetY: number,
  color: string,
  fontFamily: string,
  fontWeight: string,
) {
  const fontSize = cellSize * fontSizePercent / 100
  ctx.fillStyle = color
  const resolvedFamily = resolveFontFamily(fontFamily)
  ctx.font = `${fontWeight} ${fontSize}px ${resolvedFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, x + cellSize / 2, y + cellSize / 2 + cellSize * offsetY / 100)
}

function resolveFontFamily(fontName: string): string {
  return fontName || 'serif'
}

export interface PageLayout {
  rowsPerPage: number
  totalPages: number
}

export function calcPageLayout(params: {
  charCount: number
  gridSize: number
  rowGap: number
  marginTop: number
  marginBottom: number
  paperHeight: number
  insertEmptyRow?: boolean
}): PageLayout {
  const contentHeight = params.paperHeight - params.marginTop - params.marginBottom
  const rowHeight = params.gridSize + params.rowGap
  const rowsPerPage = Math.floor(contentHeight / rowHeight) || 1
  const charsPerPage = params.insertEmptyRow ? Math.ceil(rowsPerPage / 2) : rowsPerPage
  const totalPages = Math.max(1, Math.ceil(params.charCount / charsPerPage))
  return { rowsPerPage, totalPages }
}

export function renderGrid(ctx: CanvasRenderingContext2D, params: RenderParams) {
  const {
    text,
    gridType,
    gridSize,
    rowGap,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    fontFamily,
    fontWeight,
    fontSize,
    fontOffsetY,
    traceCount,
    traceColor,
    lineColor,
    highlightFirst,
    insertEmptyRow,
    insertEmptyCol,
    paperWidth,
    paperHeight,
    startCharIndex = 0,
  } = params

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, paperWidth, paperHeight)

  const chars = Array.from(text)

  const contentWidth = paperWidth - marginLeft - marginRight
  const contentHeight = paperHeight - marginTop - marginBottom
  const colsPerRow = Math.floor(contentWidth / gridSize) || 1
  const rowHeight = gridSize + rowGap
  const totalRows = Math.floor(contentHeight / rowHeight) || 1
  const contentCols = insertEmptyCol ? Math.ceil(colsPerRow / 2) : colsPerRow
  const effectiveTraceCount = Math.min(Math.max(traceCount, 0), contentCols)
  const actualGridWidth = colsPerRow * gridSize
  const actualGridHeight = totalRows * rowHeight - rowGap
  const startX = marginLeft + (contentWidth - actualGridWidth) / 2
  const startY = marginTop + (contentHeight - actualGridHeight) / 2

  for (let row = 0; row < totalRows; row++) {
    const y = startY + row * rowHeight
    if (y + gridSize > paperHeight - marginBottom + gridSize * 0.5)
      break

    const emptyRowsBefore = insertEmptyRow ? Math.ceil(row / 2) : 0
    const charIdx = startCharIndex + row - emptyRowsBefore
    let contentCol = 0

    for (let col = 0; col < colsPerRow; col++) {
      const x = startX + col * gridSize
      if (x + gridSize > paperWidth - marginRight + gridSize * 0.5)
        break

      drawGridCell(ctx, x, y, gridSize, gridType, lineColor)

      const isEmpty = (insertEmptyRow && row % 2 === 1)
        || (insertEmptyCol && col % 2 === 1)
      if (isEmpty || charIdx >= chars.length || chars.length === 0)
        continue

      if (contentCol < effectiveTraceCount) {
        const color = (contentCol === 0 && highlightFirst) ? '#000000' : traceColor
        drawChar(ctx, chars[charIdx], x, y, gridSize, fontSize, fontOffsetY, color, fontFamily, fontWeight)
      }
      contentCol++
    }
  }
}
