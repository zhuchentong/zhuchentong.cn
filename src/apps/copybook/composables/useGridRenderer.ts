import type { GridType, RenderParams } from '@copybook/interfaces'
import { Line, Rect, Text } from 'leafer-draw'

export function mmToPx(mm: number, dpi: number): number {
  return mm * dpi / 25.4
}

function s(value: number, scale: number): number {
  return value * scale
}

function sPoints(points: number[], scale: number): number[] {
  return points.map(v => v * scale)
}

export function createGridCell(
  x: number,
  y: number,
  size: number,
  type: GridType,
  lineColor: string,
  scale: number,
): (Rect | Line)[] {
  const elements: (Rect | Line)[] = []

  elements.push(new Rect({
    x: s(x, scale),
    y: s(y, scale),
    width: s(size, scale),
    height: s(size, scale),
    stroke: lineColor,
    strokeWidth: s(0.3, scale),
  }))

  if (type === 'tian' || type === 'mi') {
    elements.push(...createCross(x, y, size, lineColor, scale))
  }

  if (type === 'mi') {
    elements.push(...createDiagonals(x, y, size, lineColor, scale))
  }

  if (type === 'huigong' || type === 'huitian' || type === 'huimi') {
    elements.push(...createInnerBox(x, y, size, lineColor, scale))
  }

  if (type === 'huitian' || type === 'huimi') {
    elements.push(...createCross(x, y, size, lineColor, scale))
  }

  if (type === 'huimi') {
    elements.push(...createDiagonals(x, y, size, lineColor, scale))
  }

  if (type === 'jiugong') {
    elements.push(...createNineGrid(x, y, size, lineColor, scale))
  }

  return elements
}

function createCross(x: number, y: number, size: number, color: string, scale: number): Line[] {
  return [
    new Line({
      points: sPoints([x + size / 2, y, x + size / 2, y + size], scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }),
    new Line({
      points: sPoints([x, y + size / 2, x + size, y + size / 2], scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }),
  ]
}

function createDiagonals(x: number, y: number, size: number, color: string, scale: number): Line[] {
  return [
    new Line({
      points: sPoints([x, y, x + size, y + size], scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }),
    new Line({
      points: sPoints([x + size, y, x, y + size], scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }),
  ]
}

function createInnerBox(x: number, y: number, size: number, color: string, scale: number): Rect[] {
  const inset = size / 3
  return [
    new Rect({
      x: s(x + inset, scale),
      y: s(y + inset, scale),
      width: s(size - 2 * inset, scale),
      height: s(size - 2 * inset, scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }),
  ]
}

function createNineGrid(x: number, y: number, size: number, color: string, scale: number): Line[] {
  const step = size / 3
  const elements: Line[] = []

  for (let i = 1; i <= 2; i++) {
    elements.push(new Line({
      points: sPoints([x + step * i, y, x + step * i, y + size], scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }))
  }

  for (let i = 1; i <= 2; i++) {
    elements.push(new Line({
      points: sPoints([x, y + step * i, x + size, y + step * i], scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }))
  }

  return elements
}

export function createChar(
  char: string,
  x: number,
  y: number,
  cellSize: number,
  fontSizePercent: number,
  offsetY: number,
  color: string,
  fontFamily: string,
  fontWeight: string,
  scale: number,
): Text {
  const fontSize = cellSize * fontSizePercent / 100
  const resolvedFamily = resolveFontFamily(fontFamily)

  return new Text({
    text: char,
    x: s(x + cellSize / 2, scale),
    y: s(y + cellSize / 2 + cellSize * offsetY / 100, scale),
    fontFamily: resolvedFamily,
    fontSize: s(fontSize, scale),
    fontWeight: fontWeight as any,
    fill: color,
    textAlign: 'center',
    verticalAlign: 'middle',
  })
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

export function createGridElements(params: RenderParams, scale = 1): (Rect | Line | Text)[] {
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

  const elements: (Rect | Line | Text)[] = []

  elements.push(new Rect({
    x: 0,
    y: 0,
    width: s(paperWidth, scale),
    height: s(paperHeight, scale),
    fill: '#ffffff',
  }))

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

      elements.push(...createGridCell(x, y, gridSize, gridType, lineColor, scale))

      const isEmpty = (insertEmptyRow && row % 2 === 1)
        || (insertEmptyCol && col % 2 === 1)

      if (!isEmpty && charIdx < chars.length && chars.length > 0) {
        if (contentCol < effectiveTraceCount) {
          const color = (contentCol === 0 && highlightFirst) ? '#000000' : traceColor
          elements.push(createChar(chars[charIdx], x, y, gridSize, fontSize, fontOffsetY, color, fontFamily, fontWeight, scale))
        }
        contentCol++
      }
    }
  }

  return elements
}
