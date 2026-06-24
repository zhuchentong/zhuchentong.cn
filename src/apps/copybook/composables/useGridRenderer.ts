import type { GridType, RenderParams } from '@copybook/interfaces'
import { getPinyinForChars } from '@copybook/composables/usePinyin'
import { Line, Rect, Text } from 'leafer-draw'

/**
 * 毫米转像素
 * @param mm - 毫米值
 * @param dpi - 每英寸像素数（DPI）
 * @returns 对应的像素值
 */
export function mmToPx(mm: number, dpi: number): number {
  // 1英寸 = 25.4毫米
  return mm * dpi / 25.4
}

/**
 * 缩放值辅助函数：将原始值乘以缩放系数
 */
function s(value: number, scale: number): number {
  return value * scale
}

/**
 * 缩放点数组（用于 Line 的 points 参数）
 * @param points - 原始坐标点数组 [x1, y1, x2, y2, ...]
 * @param scale - 缩放系数
 * @returns 缩放后的坐标点数组
 */
function sPoints(points: number[], scale: number): number[] {
  return points.map(v => v * scale)
}

/**
 * 根据网格类型创建单元格元素
 * 支持的网格类型：田字格(tian)、米字格(mi)、回宫格(huigong)、回田格(huitian)、回米格(huimi)、九宫格(jiugong)
 * @param x - 单元格左上角 X 坐标（mm）
 * @param y - 单元格左上角 Y 坐标（mm）
 * @param size - 单元格尺寸（mm）
 * @param type - 网格类型
 * @param lineColor - 线条颜色
 * @param scale - 缩放系数（mm → px 转换）
 * @returns 组成该单元格的所有 Leafer 元素
 */
export function createGridCell(
  x: number,
  y: number,
  size: number,
  type: GridType,
  lineColor: string,
  scale: number,
): (Rect | Line)[] {
  const elements: (Rect | Line)[] = []

  // 基础外框（所有网格类型都有）
  elements.push(new Rect({
    x: s(x, scale),
    y: s(y, scale),
    width: s(size, scale),
    height: s(size, scale),
    stroke: lineColor,
    strokeWidth: s(0.3, scale),
  }))

  // 田字格和米字格：添加十字虚线
  if (type === 'tian' || type === 'mi') {
    elements.push(...createCross(x, y, size, lineColor, scale))
  }

  // 米字格：添加对角虚线
  if (type === 'mi') {
    elements.push(...createDiagonals(x, y, size, lineColor, scale))
  }

  // 回宫格系列：添加内部小方框（1/3 缩进）
  if (type === 'huigong' || type === 'huitian' || type === 'huimi') {
    elements.push(...createInnerBox(x, y, size, lineColor, scale))
  }

  // 回田格和回米格：在内部小方框内添加十字虚线
  if (type === 'huitian' || type === 'huimi') {
    elements.push(...createCross(x, y, size, lineColor, scale))
  }

  // 回米格：在内部小方框内添加对角虚线
  if (type === 'huimi') {
    elements.push(...createDiagonals(x, y, size, lineColor, scale))
  }

  // 九宫格：3x3 等分线
  if (type === 'jiugong') {
    elements.push(...createNineGrid(x, y, size, lineColor, scale))
  }

  return elements
}

/**
 * 创建十字虚线（田字格/米字格的内部辅助线）
 * 水平和垂直各一条虚线，将单元格四等分
 */
function createCross(x: number, y: number, size: number, color: string, scale: number): Line[] {
  return [
    // 垂直中线
    new Line({
      points: sPoints([x + size / 2, y, x + size / 2, y + size], scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }),
    // 水平中线
    new Line({
      points: sPoints([x, y + size / 2, x + size, y + size / 2], scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }),
  ]
}

/**
 * 创建对角虚线（米字格的对角辅助线）
 * 两条对角线从四个角交叉
 */
function createDiagonals(x: number, y: number, size: number, color: string, scale: number): Line[] {
  return [
    // 左上 → 右下
    new Line({
      points: sPoints([x, y, x + size, y + size], scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }),
    // 右上 → 左下
    new Line({
      points: sPoints([x + size, y, x, y + size], scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }),
  ]
}

/**
 * 创建内部小方框（回宫格的内框）
 * 内框向内缩进 1/3，形成"回"字结构
 */
function createInnerBox(x: number, y: number, size: number, color: string, scale: number): Rect[] {
  // 内框缩进量为单元格尺寸的 1/3
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

/**
 * 创建九宫格（3x3 等分线）
 * 水平和垂直各两条虚线将单元格九等分
 */
function createNineGrid(x: number, y: number, size: number, color: string, scale: number): Line[] {
  // 每个小格的尺寸
  const step = size / 3
  const elements: Line[] = []

  // 两条垂直分割线
  for (let i = 1; i <= 2; i++) {
    elements.push(new Line({
      points: sPoints([x + step * i, y, x + step * i, y + size], scale),
      stroke: color,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }))
  }

  // 两条水平分割线
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

/**
 * 在指定位置创建汉字文本元素
 * @param char - 要渲染的汉字
 * @param x - 单元格左上角 X 坐标（mm）
 * @param y - 单元格左上角 Y 坐标（mm）
 * @param cellSize - 单元格尺寸（mm）
 * @param fontSizePercent - 字号百分比（相对于单元格尺寸）
 * @param offsetY - 垂直偏移百分比（正值向下）
 * @param color - 文字颜色
 * @param fontFamily - 字体名称
 * @param fontWeight - 字重
 * @param scale - 缩放系数
 * @returns Leafer Text 元素
 */
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
  // 字号 = 单元格尺寸 × 百分比
  const fontSize = cellSize * fontSizePercent / 100
  const resolvedFamily = resolveFontFamily(fontFamily)

  return new Text({
    text: char,
    // 水平居中：单元格中心 X
    x: s(x + cellSize / 2, scale),
    // 垂直居中 + 偏移：单元格中心 Y + 偏移量
    y: s(y + cellSize / 2 + cellSize * offsetY / 100, scale),
    fontFamily: resolvedFamily,
    fontSize: s(fontSize, scale),
    fontWeight: fontWeight as any,
    fill: color,
    textAlign: 'center',
    verticalAlign: 'middle',
  })
}

/**
 * 解析字体名称，回退到默认衬线字体
 */
function resolveFontFamily(fontName: string): string {
  return fontName || 'serif'
}

/** 拼音行高度占网格尺寸的比例 */
const PINYIN_HEIGHT_RATIO = 0.5

/**
 * 计算拼音行高度
 * @param gridSize - 网格尺寸（mm）
 * @returns 拼音行高度（mm）
 */
function getPinyinHeight(gridSize: number): number {
  return gridSize * PINYIN_HEIGHT_RATIO
}

export { getPinyinHeight }

/**
 * 创建拼音行背景（四线三格）
 * 由一个外框矩形和两条内部分割线组成，用于书写拼音
 * @param x - 行左上角 X 坐标（mm）
 * @param y - 行左上角 Y 坐标（mm）
 * @param width - 行宽度（mm）
 * @param height - 行高度（mm）
 * @param lineColor - 线条颜色
 * @param scale - 缩放系数
 * @returns 组成拼音行的所有 Leafer 元素
 */
export function createPinyinRow(
  x: number,
  y: number,
  width: number,
  height: number,
  lineColor: string,
  scale: number,
): (Rect | Line)[] {
  const elements: (Rect | Line)[] = []

  // 外框矩形
  elements.push(new Rect({
    x: s(x, scale),
    y: s(y, scale),
    width: s(width, scale),
    height: s(height, scale),
    stroke: lineColor,
    strokeWidth: s(0.3, scale),
  }))

  // 两条水平分割线（将拼音行三等分）
  const step = height / 3
  for (let i = 1; i <= 2; i++) {
    elements.push(new Line({
      points: sPoints([x, y + step * i, x + width, y + step * i], scale),
      stroke: lineColor,
      strokeWidth: s(0.3, scale),
      dashPattern: [s(0.3, scale), s(1, scale)],
    }))
  }

  return elements
}

/**
 * 在指定位置创建拼音文本元素
 * @param pinyin - 拼音文本
 * @param x - 单元格左上角 X 坐标（mm）
 * @param y - 拼音行左上角 Y 坐标（mm）
 * @param cellSize - 单元格尺寸（mm）
 * @param pinyinHeight - 拼音行高度（mm）
 * @param scale - 缩放系数
 * @param color - 文字颜色，默认 #333333
 * @returns Leafer Text 元素
 */
export function createPinyinText(
  pinyin: string,
  x: number,
  y: number,
  cellSize: number,
  pinyinHeight: number,
  scale: number,
  color = '#333333',
): Text {
  // 拼音字号为拼音行高度的 55%
  const fontSize = pinyinHeight * 0.55

  return new Text({
    text: pinyin,
    x: s(x + cellSize / 2, scale),
    y: s(y + pinyinHeight / 2, scale),
    fontSize: s(fontSize, scale),
    fill: color,
    fontFamily: 'sans-serif',
    textAlign: 'center',
    verticalAlign: 'middle',
  })
}

/** 分页布局计算结果 */
export interface PageLayout {
  /** 每页可容纳的行数 */
  rowsPerPage: number
  /** 总页数 */
  totalPages: number
}

/**
 * 计算分页布局
 * 根据纸张尺寸、网格大小和边距，计算每页可容纳的行数和总页数
 * @param params - 布局参数
 * @param params.charCount - 总字符数
 * @param params.gridSize - 网格尺寸（mm）
 * @param params.rowGap - 行间距（mm）
 * @param params.marginTop - 上边距（mm）
 * @param params.marginBottom - 下边距（mm）
 * @param params.paperHeight - 纸张高度（mm）
 * @param params.insertEmptyRow - 是否插入空行（隔行显示）
 * @param params.showPinyin - 是否显示拼音
 * @returns 分页布局信息
 */
export function calcPageLayout(params: {
  charCount: number
  gridSize: number
  rowGap: number
  marginTop: number
  marginBottom: number
  paperHeight: number
  insertEmptyRow?: boolean
  showPinyin?: boolean
}): PageLayout {
  // 可用内容区域高度
  const contentHeight = params.paperHeight - params.marginTop - params.marginBottom
  // 拼音行高度（如果显示拼音）
  const pinyinHeight = params.showPinyin ? getPinyinHeight(params.gridSize) : 0
  // 单行总高度 = 网格高度 + 拼音高度 + 行间距
  const rowHeight = params.gridSize + pinyinHeight + params.rowGap
  // 每页可容纳的行数（至少1行）
  const rowsPerPage = Math.floor(contentHeight / rowHeight) || 1
  // 如果插入空行，实际内容行数减半
  const charsPerPage = params.insertEmptyRow ? Math.ceil(rowsPerPage / 2) : rowsPerPage
  // 总页数（至少1页）
  const totalPages = Math.max(1, Math.ceil(params.charCount / charsPerPage))
  return { rowsPerPage, totalPages }
}

/**
 * 核心渲染函数：根据参数生成完整的字帖页面元素
 *
 * 渲染流程：
 * 1. 计算布局参数（每行列数、内容区域起始坐标等）
 * 2. 逐行逐列生成网格和文字元素
 * 3. 处理空行/空列插入、拼音显示、首字高亮等特殊逻辑
 *
 * @param params - 渲染参数（见 RenderParams 接口）
 * @param scale - 缩放系数（mm → px），默认为 1（不缩放）
 * @returns 页面所有 Leafer 元素（背景矩形 + 网格线 + 拼音 + 汉字）
 */
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
    showPinyin,
    pinyinMap,
    paperWidth,
    paperHeight,
    startCharIndex = 0,
  } = params

  const elements: (Rect | Line | Text)[] = []

  // 1. 添加白色背景
  elements.push(new Rect({
    x: 0,
    y: 0,
    width: s(paperWidth, scale),
    height: s(paperHeight, scale),
    fill: '#ffffff',
  }))

  // 2. 解析文本为字符数组，获取拼音列表
  const chars = Array.from(text)
  const pinyinList = showPinyin ? getPinyinForChars(text, pinyinMap) : []

  // 3. 计算布局参数
  const contentWidth = paperWidth - marginLeft - marginRight
  const contentHeight = paperHeight - marginTop - marginBottom
  // 每行可容纳的列数（至少1列）
  const colsPerRow = Math.floor(contentWidth / gridSize) || 1
  // 拼音行高度（如果显示拼音）
  const pinyinHeight = showPinyin ? getPinyinHeight(gridSize) : 0
  // 单行总高度 = 网格高度 + 拼音高度 + 行间距
  const rowHeight = gridSize + pinyinHeight + rowGap
  // 可用内容行数（至少1行）
  const totalRows = Math.floor(contentHeight / rowHeight) || 1
  // 如果插入空列，实际内容列数减半
  const contentCols = insertEmptyCol ? Math.ceil(colsPerRow / 2) : colsPerRow
  // 练习描红次数不超过内容列数
  const effectiveTraceCount = Math.min(Math.max(traceCount, 0), contentCols)
  // 网格实际占用的宽高（用于居中计算）
  const actualGridWidth = colsPerRow * gridSize
  const actualGridHeight = totalRows * rowHeight - rowGap
  // 内容区域起始坐标（居中对齐）
  const startX = marginLeft + (contentWidth - actualGridWidth) / 2
  const startY = marginTop + (contentHeight - actualGridHeight) / 2

  // 4. 逐行渲染
  for (let row = 0; row < totalRows; row++) {
    const pinyinY = startY + row * rowHeight
    const gridY = pinyinY + pinyinHeight
    // 边界检查：如果当前行超出纸张底部则停止
    if (gridY + gridSize > paperHeight - marginBottom + gridSize * 0.5)
      break

    // 4.1 渲染拼音行背景（四线三格）
    if (showPinyin) {
      elements.push(...createPinyinRow(startX, pinyinY, actualGridWidth, pinyinHeight, lineColor, scale))
    }

    // 4.2 计算当前行对应的字符索引（考虑空行插入）
    const emptyRowsBefore = insertEmptyRow ? Math.ceil(row / 2) : 0
    const charIdx = startCharIndex + row - emptyRowsBefore
    let contentCol = 0

    // 4.3 逐列渲染网格和文字
    for (let col = 0; col < colsPerRow; col++) {
      const x = startX + col * gridSize
      // 边界检查：如果当前列超出纸张右侧则停止
      if (x + gridSize > paperWidth - marginRight + gridSize * 0.5)
        break

      // 渲染网格单元格
      elements.push(...createGridCell(x, gridY, gridSize, gridType, lineColor, scale))

      // 判断当前位置是否为空（空行或空列）
      const isEmpty = (insertEmptyRow && row % 2 === 1)
        || (insertEmptyCol && col % 2 === 1)

      // 非空位置且有字符时，渲染拼音和汉字
      if (!isEmpty && charIdx < chars.length && chars.length > 0) {
        if (contentCol < effectiveTraceCount) {
          // 首字高亮：第一个练习位置使用黑色，其余使用描红颜色
          const charColor = (contentCol === 0 && highlightFirst) ? '#000000' : traceColor
          const pinyinColor = (contentCol === 0 && highlightFirst) ? '#000000' : traceColor
          // 渲染拼音（仅当拼音与汉字不同时才显示）
          if (showPinyin && pinyinList[charIdx] && pinyinList[charIdx] !== chars[charIdx]) {
            elements.push(createPinyinText(pinyinList[charIdx], x, pinyinY, gridSize, pinyinHeight, scale, pinyinColor))
          }
          // 渲染汉字
          elements.push(createChar(chars[charIdx], x, gridY, gridSize, fontSize, fontOffsetY, charColor, fontFamily, fontWeight, scale))
        }
        contentCol++
      }
    }
  }

  return elements
}
