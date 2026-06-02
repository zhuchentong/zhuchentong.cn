import { useStore } from '@nanostores/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DEFAULT_PINYIN_CONFIG } from '../config'
import { exportPDF, exportPNG } from '../composables/useExport'
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

export default function ExportButton() {
  const [exporting, setExporting] = useState(false)
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

  function getParams() {
    return {
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
    }
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      await exportPDF(getParams())
    }
    finally {
      setExporting(false)
    }
  }

  async function handleExportPNG() {
    setExporting(true)
    try {
      await exportPNG(getParams())
    }
    finally {
      setExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={exporting}>{exporting ? '导出中...' : '导出'}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF}>导出 PDF</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPNG}>导出 PNG</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.print()}>打印</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
