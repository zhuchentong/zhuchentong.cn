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
  ctx.setLineDash([1.5, 1.5])
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
  ctx.setLineDash([1.5, 1.5])
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
  ctx.setLineDash([])
  ctx.strokeRect(x + inset, y + inset, size - 2 * inset, size - 2 * inset)
}

function drawNineGrid(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color
  ctx.setLineDash([])
  const step = size / 3
  ctx.beginPath()
  for (let i = 1; i <= 2; i++) {
    ctx.moveTo(x + step * i, y)
    ctx.lineTo(x + step * i, y + size)
    ctx.moveTo(x, y + step * i)
    ctx.lineTo(x + size, y + step * i)
  }
  ctx.stroke()
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
  ctx.font = `${fontWeight} ${fontSize}mm ${resolvedFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, x + cellSize / 2, y + cellSize / 2 + cellSize * offsetY / 100)
}

function resolveFontFamily(cssVariableOrName: string): string {
  if (cssVariableOrName.startsWith('--')) {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVariableOrName)
      .trim()
    return value || 'serif'
  }
  return cssVariableOrName
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
  } = params

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, paperWidth, paperHeight)

  const chars = Array.from(text)
  if (chars.length === 0)
    return

  const contentWidth = paperWidth - marginLeft - marginRight
  const colStep = insertEmptyCol ? gridSize * 2 : gridSize
  const colsPerRow = Math.floor(contentWidth / colStep) || 1
  const rowHeight = gridSize + rowGap
  const rowStep = insertEmptyRow ? rowHeight * 2 : rowHeight

  let currentRow = 0
  let charIndex = 0

  while (charIndex < chars.length) {
    const y = marginTop + currentRow * rowStep

    if (y + gridSize > paperHeight - marginBottom)
      break

    for (let col = 0; col < colsPerRow && charIndex < chars.length; col++) {
      const x = marginLeft + col * colStep

      for (let trace = 0; trace < traceCount; trace++) {
        const traceX = x + trace * gridSize
        if (traceX + gridSize > paperWidth - marginRight + gridSize * 0.5)
          continue

        drawGridCell(ctx, traceX, y, gridSize, gridType, lineColor)

        const isFirstChar = highlightFirst && trace === 0
        const color = isFirstChar ? '#000000' : traceColor
        drawChar(ctx, chars[charIndex], traceX, y, gridSize, fontSize, fontOffsetY, color, fontFamily, fontWeight)
      }

      charIndex++
    }

    if (insertEmptyRow) {
      const emptyY = y + rowStep - rowHeight
      for (let col = 0; col < colsPerRow * (traceCount); col++) {
        const x = marginLeft + col * gridSize
        if (x + gridSize > paperWidth - marginRight + gridSize * 0.5)
          break
        drawGridCell(ctx, x, emptyY, gridSize, gridType, lineColor)
      }
    }

    currentRow++
  }
}
