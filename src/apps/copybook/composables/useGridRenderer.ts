import type { GridType, RenderParams } from '@copybook/interfaces'
import { Line, Rect, Text } from 'leafer-draw'

export function mmToPx(mm: number, dpi: number): number {
  return mm * dpi / 25.4
}

export function createGridCell(
  x: number,
  y: number,
  size: number,
  type: GridType,
  lineColor: string,
): (Rect | Line)[] {
  const elements: (Rect | Line)[] = []

  // 主边框
  elements.push(new Rect({
    x,
    y,
    width: size,
    height: size,
    stroke: lineColor,
    strokeWidth: 0.3,
  }))

  if (type === 'tian' || type === 'mi') {
    elements.push(...createCross(x, y, size, lineColor))
  }

  if (type === 'mi') {
    elements.push(...createDiagonals(x, y, size, lineColor))
  }

  if (type === 'huigong' || type === 'huitian' || type === 'huimi') {
    elements.push(...createInnerBox(x, y, size, lineColor))
  }

  if (type === 'huitian' || type === 'huimi') {
    elements.push(...createCross(x, y, size, lineColor))
  }

  if (type === 'huimi') {
    elements.push(...createDiagonals(x, y, size, lineColor))
  }

  if (type === 'jiugong') {
    elements.push(...createNineGrid(x, y, size, lineColor))
  }

  return elements
}

function createCross(x: number, y: number, size: number, color: string): Line[] {
  return [
    // 垂直中线
    new Line({
      points: [x + size / 2, y, x + size / 2, y + size],
      stroke: color,
      strokeWidth: 0.3,
      dashPattern: [0.3, 1],
    }),
    // 水平中线
    new Line({
      points: [x, y + size / 2, x + size, y + size / 2],
      stroke: color,
      strokeWidth: 0.3,
      dashPattern: [0.3, 1],
    }),
  ]
}

function createDiagonals(x: number, y: number, size: number, color: string): Line[] {
  return [
    // 左上到右下
    new Line({
      points: [x, y, x + size, y + size],
      stroke: color,
      strokeWidth: 0.3,
      dashPattern: [0.3, 1],
    }),
    // 右上到左下
    new Line({
      points: [x + size, y, x, y + size],
      stroke: color,
      strokeWidth: 0.3,
      dashPattern: [0.3, 1],
    }),
  ]
}

function createInnerBox(x: number, y: number, size: number, color: string): Rect[] {
  const inset = size / 3
  return [
    new Rect({
      x: x + inset,
      y: y + inset,
      width: size - 2 * inset,
      height: size - 2 * inset,
      stroke: color,
      strokeWidth: 0.3,
      dashPattern: [0.3, 1],
    }),
  ]
}

function createNineGrid(x: number, y: number, size: number, color: string): Line[] {
  const step = size / 3
  const elements: Line[] = []

  // 垂直线
  for (let i = 1; i <= 2; i++) {
    elements.push(new Line({
      points: [x + step * i, y, x + step * i, y + size],
      stroke: color,
      strokeWidth: 0.3,
      dashPattern: [0.3, 1],
    }))
  }

  // 水平线
  for (let i = 1; i <= 2; i++) {
    elements.push(new Line({
      points: [x, y + step * i, x + size, y + step * i],
      stroke: color,
      strokeWidth: 0.3,
      dashPattern: [0.3, 1],
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
): Text {
  const fontSize = cellSize * fontSizePercent / 100
  const resolvedFamily = resolveFontFamily(fontFamily)

  return new Text({
    text: char,
    x: x + cellSize / 2,
    y: y + cellSize / 2 + cellSize * offsetY / 100,
    fontFamily: resolvedFamily,
    fontSize,
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

export function createGridElements(params: RenderParams): (Rect | Line | Text)[] {
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

  // 白色背景
  elements.push(new Rect({
    x: 0,
    y: 0,
    width: paperWidth,
    height: paperHeight,
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

      // 添加方格元素
      elements.push(...createGridCell(x, y, gridSize, gridType, lineColor))

      const isEmpty = (insertEmptyRow && row % 2 === 1)
        || (insertEmptyCol && col % 2 === 1)

      if (!isEmpty && charIdx < chars.length && chars.length > 0) {
        if (contentCol < effectiveTraceCount) {
          const color = (contentCol === 0 && highlightFirst) ? '#000000' : traceColor
          elements.push(createChar(chars[charIdx], x, y, gridSize, fontSize, fontOffsetY, color, fontFamily, fontWeight))
        }
        contentCol++
      }
    }
  }

  return elements
}
