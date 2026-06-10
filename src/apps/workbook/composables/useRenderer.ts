import type { WorkbookPageLayout, WorkbookRenderParams } from '../interfaces'
import {
  createChar,
  createGridCell,
  createPinyinRow,
  createPinyinText,
  getPinyinHeight,
} from '@copybook/composables/useGridRenderer'
import { Rect } from 'leafer-draw'

export function calcWorkbookPageLayout(params: {
  questionCount: number
  gridSize: number
  questionGap: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  paperWidth: number
  paperHeight: number
  questions: { words: string }[]
}): WorkbookPageLayout {
  const pinyinHeight = getPinyinHeight(params.gridSize)
  const rowGap = 4
  const rowHeight = pinyinHeight + params.gridSize + rowGap
  const contentWidth = params.paperWidth - params.marginLeft - params.marginRight
  const contentHeight = params.paperHeight - params.marginTop - params.marginBottom
  const totalRows = Math.max(1, Math.floor(contentHeight / rowHeight))

  let qi = 0
  let pages = 1
  for (let row = 0; row < totalRows && qi < params.questionCount; row++) {
    let cursorX = 0
    while (qi < params.questionCount) {
      const charCount = Array.from(params.questions[qi].words).length
      const neededWidth = charCount * params.gridSize
      if (cursorX + neededWidth > contentWidth) {
        if (cursorX === 0)
          qi++
        break
      }
      cursorX += neededWidth + params.questionGap * params.gridSize
      qi++
    }
  }

  if (qi < params.questionCount) {
    pages = Math.max(1, Math.ceil(params.questionCount / Math.max(1, qi)))
  }

  return { questionsPerPage: Math.max(1, qi), totalPages: pages }
}

export function createWorkbookElements(
  params: WorkbookRenderParams,
  scale = 1,
) {
  const {
    questions,
    answerMode,
    highlightEnabled,
    highlightColor,
    gridSize,
    questionGap,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    lineColor,
    answerColor,
    fontFamily,
    fontWeight,
    fontSize,
    fontColor,
    paperWidth,
    paperHeight,
    startQuestionIndex = 0,
  } = params

  const elements: (Rect | import('leafer-draw').Line | import('leafer-draw').Text)[] = []

  elements.push(new Rect({
    x: 0,
    y: 0,
    width: paperWidth * scale,
    height: paperHeight * scale,
    fill: '#ffffff',
  }))

  const pinyinHeight = getPinyinHeight(gridSize)
  const rowGap = 4
  const rowHeight = pinyinHeight + gridSize + rowGap
  const contentWidth = paperWidth - marginLeft - marginRight
  const contentHeight = paperHeight - marginTop - marginBottom
  const colsPerRow = Math.max(1, Math.floor(contentWidth / gridSize))
  const totalRows = Math.max(1, Math.floor(contentHeight / rowHeight))
  const gridTotalWidth = colsPerRow * gridSize
  const lineEnd = marginLeft + gridTotalWidth

  let qi = startQuestionIndex

  for (let row = 0; row < totalRows; row++) {
    const qy = marginTop + row * rowHeight
    if (qy + rowHeight - rowGap > paperHeight - marginBottom)
      break

    const gridY = qy + pinyinHeight

    // 第一层：铺满整行四线三格 + 田字格
    elements.push(...createPinyinRow(marginLeft, qy, gridTotalWidth, pinyinHeight, lineColor, scale))
    for (let col = 0; col < colsPerRow; col++) {
      elements.push(...createGridCell(marginLeft + col * gridSize, gridY, gridSize, 'tian', lineColor, scale))
    }

    // 第二层：横向填入题目内容（游标式）
    let cursorX = marginLeft
    while (qi < questions.length) {
      const question = questions[qi]
      const chars = Array.from(question.words)
      const neededWidth = chars.length * gridSize

      // 放不下当前题且游标不在行首 → 换行
      if (cursorX + neededWidth > lineEnd) {
        break
      }

      // 填拼音答案
      if (answerMode !== 'hidden') {
        for (let i = 0; i < question.pinyin.length; i++) {
          if (answerMode === 'hide-keyword' && question.highlight?.[i])
            continue
          elements.push(createPinyinText(
            question.pinyin[i],
            cursorX + i * gridSize,
            qy,
            gridSize,
            pinyinHeight,
            scale,
            answerColor,
          ))
        }
      }

      // 填汉字
      for (let i = 0; i < chars.length; i++) {
        const charColor = highlightEnabled && question.highlight
          ? (question.highlight[i] ? highlightColor : 'rgb(100, 116, 139)')
          : fontColor
        elements.push(createChar(
          chars[i],
          cursorX + i * gridSize,
          gridY,
          gridSize,
          fontSize,
          0,
          charColor,
          fontFamily,
          fontWeight,
          scale,
        ))
      }

      cursorX += neededWidth + questionGap * gridSize
      qi++
    }
  }

  return elements
}
