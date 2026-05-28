<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { exportPDF, exportPNG } from '@/composables/copybook/useExport'
import { A4_HEIGHT_MM, A4_WIDTH_MM } from '@/shared/copybook/constants'
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

const exporting = ref(false)

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
    text: text.value,
    gridType: gridType.value,
    gridSize: gridSize.value,
    rowGap: rowGap.value,
    marginTop: margin.value.top,
    marginRight: margin.value.right,
    marginBottom: margin.value.bottom,
    marginLeft: margin.value.left,
    fontFamily: fontFamily.value,
    fontWeight: fontWeight.value,
    fontSize: fontSize.value,
    fontOffsetY: fontOffsetY.value,
    traceCount: traceCount.value,
    traceColor: traceColor.value,
    lineColor: lineColor.value,
    highlightFirst: highlightFirst.value,
    insertEmptyRow: insertEmptyRow.value,
    insertEmptyCol: insertEmptyCol.value,
    paperWidth: A4_WIDTH_MM,
    paperHeight: A4_HEIGHT_MM,
  }
}

async function handleExportPDF() {
  exporting.value = true
  try {
    await exportPDF(getParams())
  }
  finally {
    exporting.value = false
  }
}

function handleExportPNG() {
  exportPNG(getParams())
}

function handlePrint() {
  window.print()
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button :disabled="exporting">
        {{ exporting ? '导出中...' : '导出' }}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="handleExportPDF">
        导出 PDF
      </DropdownMenuItem>
      <DropdownMenuItem @click="handleExportPNG">
        导出 PNG
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="handlePrint">
        打印
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
