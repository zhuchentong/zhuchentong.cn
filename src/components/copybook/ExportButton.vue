<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { ref } from 'vue'
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

const showMenu = ref(false)
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
  showMenu.value = false
  exporting.value = true
  try {
    await exportPDF(getParams())
  }
  finally {
    exporting.value = false
  }
}

function handleExportPNG() {
  showMenu.value = false
  exportPNG(getParams())
}

function handlePrint() {
  showMenu.value = false
  window.print()
}

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function closeMenu() {
  showMenu.value = false
}
</script>

<template>
  <div class="relative" @mouseleave="closeMenu">
    <button
      class="text-sm text-white px-4 py-1.5 rounded-md bg-blue-500 flex gap-1 items-center hover:bg-blue-600 disabled:opacity-50"
      :disabled="exporting"
      @click="toggleMenu"
    >
      {{ exporting ? '导出中...' : '导出' }}
      <span class="text-xs">▼</span>
    </button>
    <div v-if="showMenu" class="mt-1 py-1 border border-gray-200 rounded-md bg-white min-w-120px shadow-lg right-0 top-full absolute z-10">
      <button class="text-sm px-4 py-2 text-left w-full hover:bg-gray-50" @click="handleExportPDF">
        导出 PDF
      </button>
      <button class="text-sm px-4 py-2 text-left w-full hover:bg-gray-50" @click="handleExportPNG">
        导出 PNG
      </button>
      <div class="my-1 border-t border-gray-100" />
      <button class="text-sm px-4 py-2 text-left w-full hover:bg-gray-50" @click="handlePrint">
        打印
      </button>
    </div>
  </div>
</template>
