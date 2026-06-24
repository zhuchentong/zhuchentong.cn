import type { WorkbookPageLayout, WorkbookRenderParams } from '../interfaces'
import {
  createChar,
  createGridCell,
  createPinyinRow,
  createPinyinText,
  getPinyinHeight,
} from '@copybook/composables/useGridRenderer'
import { Rect } from 'leafer-draw'

/**
 * 计算练习册分页布局
 *
 * 通过模拟填入过程确定每页可容纳的题目数和总页数：
 * 逐行遍历，在每行内用游标模拟填入题目，当放不下时换行/换页
 *
 * @param params - 布局参数
 * @param params.questionCount - 总题目数
 * @param params.gridSize - 网格尺寸（mm）
 * @param params.questionGap - 题目间距（网格数）
 * @param params.marginTop - 上边距（mm）
 * @param params.marginBottom - 下边距（mm）
 * @param params.marginLeft - 左边距（mm）
 * @param params.marginRight - 右边距（mm）
 * @param params.paperWidth - 纸张宽度（mm）
 * @param params.paperHeight - 纸张高度（mm）
 * @param params.questions - 题目列表（用于计算实际宽度）
 * @returns 分页布局信息：每页题目数、总页数
 */
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
  // 单行总高度 = 拼音行 + 网格 + 行间距
  const rowHeight = pinyinHeight + params.gridSize + rowGap
  const contentWidth = params.paperWidth - params.marginLeft - params.marginRight
  const contentHeight = params.paperHeight - params.marginTop - params.marginBottom
  // 可用行数（至少1行）
  const totalRows = Math.max(1, Math.floor(contentHeight / rowHeight))

  // 模拟填入过程：统计一页能放多少题
  let qi = 0
  let pages = 1
  for (let row = 0; row < totalRows && qi < params.questionCount; row++) {
    let cursorX = 0
    while (qi < params.questionCount) {
      const charCount = Array.from(params.questions[qi].words).length
      const neededWidth = charCount * params.gridSize
      // 放不下当前题
      if (cursorX + neededWidth > contentWidth) {
        // 游标在行首 → 强制跳过该题（题目太长）
        if (cursorX === 0)
          qi++
        break
      }
      // 放得下，游标右移
      cursorX += neededWidth + params.questionGap * params.gridSize
      qi++
    }
  }

  // 如果一页放不下所有题目，计算总页数
  if (qi < params.questionCount) {
    pages = Math.max(1, Math.ceil(params.questionCount / Math.max(1, qi)))
  }

  return { questionsPerPage: Math.max(1, qi), totalPages: pages }
}

/**
 * 生成练习册页面元素
 *
 * 渲染策略（两层）：
 * 1. 第一层（铺底）：逐行铺满四线三格 + 田字格背景
 * 2. 第二层（填内容）：使用游标在网格上横向填入题目内容（拼音 + 汉字）
 *
 * 游标式填入：每个题目占 charCount * gridSize 的宽度，加上题间距
 * 放不下当前题时换行，支持答案模式切换和高亮显示
 *
 * @param params - 渲染参数（见 WorkbookRenderParams 接口）
 * @param scale - 缩放系数（mm → px），默认为 1
 * @returns 页面所有 Leafer 元素
 */
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

  // 添加白色背景
  elements.push(new Rect({
    x: 0,
    y: 0,
    width: paperWidth * scale,
    height: paperHeight * scale,
    fill: '#ffffff',
  }))

  // 计算布局参数
  const pinyinHeight = getPinyinHeight(gridSize)
  const rowGap = 4
  const rowHeight = pinyinHeight + gridSize + rowGap
  const contentWidth = paperWidth - marginLeft - marginRight
  const contentHeight = paperHeight - marginTop - marginBottom
  const colsPerRow = Math.max(1, Math.floor(contentWidth / gridSize))
  const totalRows = Math.max(1, Math.floor(contentHeight / rowHeight))
  // 网格实际占用宽度（用于行尾判断）
  const gridTotalWidth = colsPerRow * gridSize
  const lineEnd = marginLeft + gridTotalWidth

  // 题目游标（从 startQuestionIndex 开始，支持分页续接）
  let qi = startQuestionIndex

  // 逐行渲染
  for (let row = 0; row < totalRows; row++) {
    const qy = marginTop + row * rowHeight
    // 边界检查：超出纸张底部则停止
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

      // 填拼音答案（根据答案模式决定是否显示）
      if (answerMode !== 'hidden') {
        for (let i = 0; i < question.pinyin.length; i++) {
          // hide-keyword 模式下跳过高亮位置的拼音
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
        // 高亮模式：匹配的字用高亮色，不匹配的用灰色
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

      // 游标右移：当前题宽度 + 题间距
      cursorX += neededWidth + questionGap * gridSize
      qi++
    }
  }

  return elements
}
