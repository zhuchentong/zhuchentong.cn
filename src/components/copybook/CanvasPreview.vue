<script setup lang="ts">
import { useStore } from '@nanostores/vue'
import { onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { useFontLoader } from '@/composables/copybook/useFontLoader'
import { renderGrid } from '@/composables/copybook/useGridRenderer'
import { A4_HEIGHT_MM, A4_WIDTH_MM } from '@/shared/copybook/constants'
import {
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

const canvasRef = ref<HTMLCanvasElement>()
const text = useStore(copybookText)
const gridType = useStore(copybookGridType)
const gridSize = useStore(copybookGridSize)
const rowGap = useStore(copybookRowGap)
const margin = useStore(copybookMargin)
const fontWeight = useStore(copybookFontWeight)
const fontSize = useStore(copybookFontSize)
const fontOffsetY = useStore(copybookFontOffsetY)
const traceCount = useStore(copybookTraceCount)
const traceColor = useStore(copybookTraceColor)
const lineColor = useStore(copybookLineColor)
const highlightFirst = useStore(copybookHighlightFirst)
const insertEmptyRow = useStore(copybookInsertEmptyRow)
const insertEmptyCol = useStore(copybookInsertEmptyCol)

const { resolvedFontName } = useFontLoader()

const A4_CSS_WIDTH = 794
const A4_CSS_HEIGHT = 1123

function setupCanvas() {
  const canvas = canvasRef.value
  if (!canvas)
    return null
  const dpr = Math.max(window.devicePixelRatio || 1, 2)
  canvas.width = A4_CSS_WIDTH * dpr
  canvas.height = A4_CSS_HEIGHT * dpr
  const ctx = canvas.getContext('2d')!
  const pxPerMM = (A4_CSS_WIDTH * dpr) / A4_WIDTH_MM
  ctx.scale(pxPerMM, pxPerMM)
  return ctx
}

function draw() {
  const ctx = setupCanvas()
  if (!ctx)
    return
  renderGrid(ctx, {
    text: text.value,
    gridType: gridType.value,
    gridSize: gridSize.value,
    rowGap: rowGap.value,
    marginTop: margin.value.top,
    marginRight: margin.value.right,
    marginBottom: margin.value.bottom,
    marginLeft: margin.value.left,
    fontFamily: resolvedFontName.value,
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
  })
}

function onFontsReady() {
  draw()
}

onMounted(async () => {
  await document.fonts.ready
  watchEffect(() => {
    draw()
  })
  document.fonts.addEventListener('loadingdone', onFontsReady)
})

onBeforeUnmount(() => {
  document.fonts.removeEventListener('loadingdone', onFontsReady)
})

defineExpose({
  getCanvas: () => canvasRef.value,
})
</script>

<template>
  <div class="p-6 bg-gray-100 flex flex-1 justify-center overflow-auto">
    <div class="bg-white shadow-lg" :style="{ width: `${A4_CSS_WIDTH}px`, height: `${A4_CSS_HEIGHT}px` }">
      <canvas ref="canvasRef" :style="{ width: `${A4_CSS_WIDTH}px`, height: `${A4_CSS_HEIGHT}px` }" />
    </div>
  </div>
</template>
