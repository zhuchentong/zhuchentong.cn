import { useStore } from '@nanostores/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { exportPDF, exportPNG } from '@/composables/copybook/useExport'
import { A4_HEIGHT_MM, A4_WIDTH_MM, EXPORT_DPI, MM_PER_INCH } from '@/shared/copybook/constants'
import {
  copybookFontFamily,
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
} from '@/stores/copybook.store'

interface Props {}

export default function ExportButton(_props: Props) {
  const [exporting, setExporting] = useState(false)

  const text = useStore(copybookText)
  const gridType = useStore(copybookGridType)
  const gridSize = useStore(copybookGridSize)
  const rowGap = useStore(copybookRowGap)
  const margin = useStore(copybookMargin)
  const fontFamily = useStore(copybookFontFamily)
  const fontWeight = useStore(copybookFontWeight)
  const fontSize = useStore(copybookFontSize)
  const fontOffsetY = useStore(copybookFontOffsetY)
  const traceCount = useStore(copybookTraceCount)
  const traceColor = useStore(copybookTraceColor)
  const lineColor = useStore(copybookLineColor)
  const highlightFirst = useStore(copybookHighlightFirst)
  const insertEmptyRow = useStore(copybookInsertEmptyRow)
  const insertEmptyCol = useStore(copybookInsertEmptyCol)

  function getParams() {
    return {
      text,
      gridType,
      gridSize,
      rowGap,
      marginTop: margin.top,
      marginRight: margin.right,
      marginBottom: margin.bottom,
      marginLeft: margin.left,
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
      paperWidth: A4_WIDTH_MM,
      paperHeight: A4_HEIGHT_MM,
      pxPerMM: EXPORT_DPI / MM_PER_INCH,
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

  function handleExportPNG() {
    exportPNG(getParams())
  }

  function handlePrint() {
    window.print()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={exporting}>
          {exporting ? '导出中...' : '导出'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF}>
          导出 PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPNG}>
          导出 PNG
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handlePrint}>
          打印
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
