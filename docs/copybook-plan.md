# 汉字字帖功能 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/copybook/hanzi` 路由实现一个完整的汉字字帖生成器，基于 Astro Islands + Vue 3 + Canvas API，支持 7 种方格类型、描红、自定义参数和 PDF/PNG 导出。

**Architecture:** Astro 页面使用自定义全屏布局（CopybookLayout），核心编辑器作为 Vue 3 Island 通过 `client:only="vue"` 纯客户端渲染（避免 SSR 闪烁）。状态管理使用 Nanostores，Canvas 渲染使用毫米坐标系统封装为 Vue composable，导出使用离屏 Canvas 以 300 DPI 重绘。

**Tech Stack:** Astro 6, Vue 3, Nanostores, Canvas API (mm 坐标系统), UnoCSS, jsPDF, fontmin (字体子集化)

---

## 阶段概览

| 阶段 | 名称 | 难度 | 预估工时 |
|------|------|------|----------|
| P1 | 基础骨架 + Canvas 渲染 | 低 | 1-2h |
| P2 | 控制面板 UI + 状态联动 | 中 | 2-3h |
| P3 | 7 种方格类型绘制 | 中 | 1-2h |
| P4 | 导出功能 | 中 | 1-2h |
| P5 | UI 打磨 + 字体集成 + 打印样式 | 中 | 1-2h |

> **字体子集化**为独立前置任务，详见 [docs/copybook-font-subset.md](./copybook-font-subset.md)

---

## 文件结构

```
新增文件:
  src/pages/copybook/hanzi.astro              ← 页面入口
  src/layouts/CopybookLayout.astro             ← 全屏布局（无 Header/Footer）
  src/interfaces/copybook.ts                   ← 类型定义（GridType, Margin, CopybookState, RenderParams）
  src/config/copybook.config.ts                ← 字帖配置常量（色板、字体列表、导航、默认值）
  src/shared/copybook/constants.ts             ← Canvas 渲染常量（A4 尺寸、DPI、mm 换算）
  src/composables/copybook/useGridRenderer.ts  ← Canvas 方格绘制逻辑（mm 坐标）
  src/composables/copybook/useExport.ts        ← 导出 PDF/PNG 逻辑（离屏 Canvas 300DPI）
  src/stores/copybook.store.ts                 ← 字帖状态（Nanostore）
  src/components/copybook/
    CopybookEditor.vue                         ← 主编辑器 Island
    ControlPanel.vue                           ← 左侧控制面板
    CanvasPreview.vue                          ← Canvas 预览组件
    TextInputDialog.vue                        ← 文本输入弹窗
    FontPickerDialog.vue                       ← 字体选择弹窗
    MarginDialog.vue                           ← 页边距弹窗
    ColorPickerDialog.vue                      ← 颜色选择弹窗
    CopybookNav.vue                            ← 顶部导航栏（Astro SSR 组件）
    ExportButton.vue                           ← 导出按钮
  src/assets/fonts/                            ← fontmin 子集化产物目录
    MaShanZheng-Regular.woff2                  ← 楷体（GB2312 子集）
    NotoSerifSC-Regular.woff2                   ← 宋体（GB2312 子集，可选）
    NotoSansSC-Regular.woff2                    ← 黑体（GB2312 子集，可选）

修改文件:
  astro.config.ts                              ← 添加 fonts 配置（fontProviders.local）
  src/config/header.config.ts                  ← 添加"字帖"导航项

字体子集化脚本（不入 git）:
  scripts/fonts/source/*.ttf                   ← 源字体文件
  scripts/fonts/subset.mjs                     ← fontmin 子集化脚本
  scripts/fonts/gen-gb2312.mjs                 ← GB2312 字符表生成
  scripts/fonts/gb2312-chars.txt               ← GB2312 字符表
```

---

## P1: 基础骨架 + Canvas 渲染

### Task 1: 创建类型定义、配置常量和渲染常量

**Files:**
- Create: `src/interfaces/copybook.ts`
- Create: `src/config/copybook.config.ts`
- Create: `src/shared/copybook/constants.ts`

- [ ] **Step 1: 创建类型定义文件**

```ts
// src/interfaces/copybook.ts
export type GridType = 'tian' | 'mi' | 'huigong' | 'jiugong' | 'huitian' | 'huimi' | 'zuowen'

export interface Margin {
  top: number
  right: number
  bottom: number
  left: number
}

export interface CopybookState {
  text: string
  gridType: GridType
  gridSize: number
  rowGap: number
  margin: Margin
  fontFamily: string
  fontWeight: string
  fontSize: number
  fontOffsetY: number
  traceCount: number
  traceColor: string
  lineColor: string
  highlightFirst: boolean
  insertEmptyRow: boolean
  insertEmptyCol: boolean
}

export interface RenderParams {
  text: string
  gridType: GridType
  gridSize: number
  rowGap: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  fontFamily: string
  fontWeight: string
  fontSize: number
  fontOffsetY: number
  traceCount: number
  traceColor: string
  lineColor: string
  highlightFirst: boolean
  insertEmptyRow: boolean
  insertEmptyCol: boolean
  paperWidth: number
  paperHeight: number
}
```

- [ ] **Step 2: 创建字帖配置常量文件**

```ts
// src/config/copybook.config.ts
import type { GridType } from '@/interfaces/copybook'

export const DEFAULT_TEXT = '你好世界'

export const GRID_TYPES: { label: string, value: GridType }[] = [
  { label: '田字格', value: 'tian' },
  { label: '米字格', value: 'mi' },
  { label: '回宫格', value: 'huigong' },
  { label: '九宫格', value: 'jiugong' },
  { label: '回田格', value: 'huitian' },
  { label: '回米格', value: 'huimi' },
  { label: '作文格', value: 'zuowen' },
]

export const FONT_FAMILIES = [
  { label: '楷体', cssVariable: '--font-ma-shan-zheng', fallback: 'KaiTi, STKaiti, serif' },
  { label: '宋体', cssVariable: '--font-noto-serif-sc', fallback: 'SimSun, STSong, serif' },
  { label: '黑体', cssVariable: '--font-noto-sans-sc', fallback: 'SimHei, STHeiti, sans-serif' },
]

export const FONT_WEIGHTS = [
  { label: '常规', value: 'normal' },
  { label: '中等', value: '500' },
  { label: '粗体', value: 'bold' },
]

export const COLOR_PALETTE: { name: string, colors: string[] }[] = [
  { name: 'gray', colors: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', 'black'] },
  { name: 'red', colors: ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'] },
  { name: 'orange', colors: ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'] },
  { name: 'green', colors: ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'] },
  { name: 'blue', colors: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'] },
  { name: 'purple', colors: ['#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#581c87'] },
]

export const DEFAULT_MARGIN = { top: 36, right: 36, bottom: 36, left: 36 }

export const COPYBOOK_NAV_ITEMS = [
  { label: '← 首页', href: '/' },
  { label: '汉字字帖', href: '/copybook/hanzi' },
]
```

- [ ] **Step 3: 创建 Canvas 渲染常量文件**

```ts
// src/shared/copybook/constants.ts
export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297
export const EXPORT_DPI = 300
export const MM_PER_INCH = 25.4
```

- [ ] **Step 4: Commit**

```bash
git add src/interfaces/copybook.ts src/config/copybook.config.ts src/shared/copybook/constants.ts
git commit -m "feat(copybook): add type definitions, config constants and render constants"
```

---

### Task 2: 创建 Nanostore 状态

**Files:**
- Create: `src/stores/copybook.store.ts`

- [ ] **Step 1: 创建字帖状态 store**

```ts
// src/stores/copybook.store.ts
import { atom } from 'nanostores'
import type { GridType, Margin } from '@/interfaces/copybook'
import { DEFAULT_MARGIN, DEFAULT_TEXT } from '@/config/copybook.config'

export const copybookText = atom<string>(DEFAULT_TEXT)
export const copybookGridType = atom<GridType>('tian')
export const copybookGridSize = atom<number>(10)
export const copybookRowGap = atom<number>(2)
export const copybookMargin = atom<Margin>({ ...DEFAULT_MARGIN })
export const copybookFontFamily = atom<string>('--font-ma-shan-zheng')
export const copybookFontWeight = atom<string>('normal')
export const copybookFontSize = atom<number>(68)
export const copybookFontOffsetY = atom<number>(0)
export const copybookTraceCount = atom<number>(20)
export const copybookTraceColor = atom<string>('#e2e8f0')
export const copybookLineColor = atom<string>('#94a3b8')
export const copybookHighlightFirst = atom<boolean>(true)
export const copybookInsertEmptyRow = atom<boolean>(false)
export const copybookInsertEmptyCol = atom<boolean>(false)
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/copybook.store.ts
git commit -m "feat(copybook): add copybook nanostore state"
```

---

### Task 3: 创建全屏布局

**Files:**
- Create: `src/layouts/CopybookLayout.astro`

- [ ] **Step 1: 创建 CopybookLayout**

参考现有 `BaseLayout.astro` 的结构，但移除 Header/Footer，使用全屏布局：

```astro
---
// src/layouts/CopybookLayout.astro
import Bootstrap from '@/components/layouts/Bootstrap.astro'
import Favicons from '@/components/layouts/Favicons.astro'
import Theme from '@/components/layouts/Theme.astro'
import { Font } from 'astro:assets'
import { useStore } from '@/stores'
import '@/styles/index.scss'

export interface Props {
  title: string
  description?: string
}

const { title, description } = Astro.props
const store = useStore()
const theme = store.app.theme
---

<!doctype html>
<html lang="zh-CN" class={theme.value}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description ?? title} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
    <Favicons />
    <Theme />
    <Bootstrap />
    <Font cssVariable="--font-ma-shan-zheng" preload />
    <Font cssVariable="--font-noto-serif-sc" />
    <Font cssVariable="--font-noto-sans-sc" />
  </head>
  <body class="flex flex-col h-screen overflow-hidden">
    <nav class="copybook-nav h-48px flex items-center border-b border-gray-200 px-4 gap-6 bg-white shrink-0">
      <a href="/" class="text-sm text-gray-500 hover:text-gray-800">← 首页</a>
      <span class="text-sm font-medium text-gray-800">汉字字帖</span>
    </nav>
    <div class="flex-1 overflow-hidden">
      <slot />
    </div>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/CopybookLayout.astro
git commit -m "feat(copybook): add full-screen layout without header/footer"
```

---

### Task 4: 创建页面入口和主编辑器骨架

**Files:**
- Create: `src/pages/copybook/hanzi.astro`
- Create: `src/components/copybook/CopybookEditor.vue`

- [ ] **Step 1: 创建 Astro 页面**

> **重要：** 使用 `client:only="vue"` 而非 `client:load`。字帖页面完全依赖 Canvas 渲染，SSR 没有实际收益，`client:only` 避免水合闪烁。

```astro
---
// src/pages/copybook/hanzi.astro
import CopybookLayout from '@/layouts/CopybookLayout.astro'
import CopybookEditor from '@/components/copybook/CopybookEditor.vue'
---

<CopybookLayout title="汉字字帖">
  <CopybookEditor client:only="vue" />
</CopybookLayout>
```

- [ ] **Step 2: 创建 CopybookEditor.vue 骨架**

```vue
<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import { A4_WIDTH_MM, A4_HEIGHT_MM, MM_PER_INCH } from '@/shared/copybook/constants'

const canvasRef = ref<HTMLCanvasElement>()

const A4_CSS_WIDTH = 794
const A4_CSS_HEIGHT = 1123

function setupCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = Math.max(window.devicePixelRatio || 1, 2)
  canvas.width = A4_CSS_WIDTH * dpr
  canvas.height = A4_CSS_HEIGHT * dpr
  const ctx = canvas.getContext('2d')!
  const pxPerMM = (A4_CSS_WIDTH * dpr) / A4_WIDTH_MM
  ctx.scale(pxPerMM, pxPerMM)
  return ctx
}

onMounted(() => {
  const ctx = setupCanvas()
  if (!ctx) return
  // 临时渲染：白色背景
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, A4_WIDTH_MM, A4_HEIGHT_MM)
})
</script>

<template>
  <div class="flex h-full overflow-hidden">
    <aside class="w-300px border-r border-gray-200 overflow-y-auto p-4">
      <p class="text-gray-500">控制面板（待实现）</p>
    </aside>
    <main class="flex-1 overflow-auto bg-gray-100 p-6 flex justify-center">
      <div class="bg-white shadow-lg" :style="{ width: `${A4_CSS_WIDTH}px`, height: `${A4_CSS_HEIGHT}px` }">
        <canvas ref="canvasRef" :style="{ width: `${A4_CSS_WIDTH}px`, height: `${A4_CSS_HEIGHT}px` }" />
      </div>
    </main>
  </div>
</template>
```

- [ ] **Step 3: 验证页面可访问**

Run: `pnpm dev`
访问: `http://localhost:4321/copybook/hanzi`
Expected: 页面显示左右分栏，左侧灰色文字，右侧白色 A4 画布

- [ ] **Step 4: Commit**

```bash
git add src/pages/copybook/hanzi.astro src/components/copybook/CopybookEditor.vue
git commit -m "feat(copybook): add page entry and editor skeleton"
```

---

### Task 5: 实现 Canvas 基础渲染（田字格 + 文字）

**Files:**
- Create: `src/composables/copybook/useGridRenderer.ts`
- Modify: `src/components/copybook/CopybookEditor.vue`

- [ ] **Step 1: 创建 useGridRenderer composable**

核心设计：**所有绘制坐标使用 mm 单位**，通过传入的 `ctx.scale(pxPerMM, pxPerMM)` 映射到像素。一套绘制代码同时服务屏幕显示和导出。

```ts
// src/composables/copybook/useGridRenderer.ts
import type { GridType, RenderParams } from '@/interfaces/copybook'

export function mmToPx(mm: number, dpi: number): number {
  return mm * dpi / 25.4
}

export function drawGridCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  type: GridType,
  lineColor: string,
) {
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 0.3

  // 外框
  ctx.setLineDash([])
  ctx.strokeRect(x, y, size, size)

  if (type === 'tian' || type === 'mi') {
    drawCross(ctx, x, y, size, lineColor)
  }

  if (type === 'mi') {
    drawDiagonals(ctx, x, y, size, lineColor)
  }

  if (type === 'huigong' || type === 'huitian' || type === 'huimi') {
    drawInnerBox(ctx, x, y, size, lineColor)
  }

  if (type === 'huitian' || type === 'huimi') {
    drawCross(ctx, x, y, size, lineColor)
  }

  if (type === 'huimi') {
    drawDiagonals(ctx, x, y, size, lineColor)
  }

  if (type === 'jiugong') {
    drawNineGrid(ctx, x, y, size, lineColor)
  }

  // zuowen: 仅外框，无辅助线
}

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color
  ctx.setLineDash([1.5, 1.5])
  ctx.beginPath()
  ctx.moveTo(x + size / 2, y)
  ctx.lineTo(x + size / 2, y + size)
  ctx.moveTo(x, y + size / 2)
  ctx.lineTo(x + size, y + size / 2)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawDiagonals(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color
  ctx.setLineDash([1.5, 1.5])
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + size, y + size)
  ctx.moveTo(x + size, y)
  ctx.lineTo(x, y + size)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawInnerBox(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const inset = size / 3
  ctx.strokeStyle = color
  ctx.setLineDash([])
  ctx.strokeRect(x + inset, y + inset, size - 2 * inset, size - 2 * inset)
}

function drawNineGrid(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.strokeStyle = color
  ctx.setLineDash([])
  const step = size / 3
  ctx.beginPath()
  for (let i = 1; i <= 2; i++) {
    ctx.moveTo(x + step * i, y)
    ctx.lineTo(x + step * i, y + size)
    ctx.moveTo(x, y + step * i)
    ctx.lineTo(x + size, y + step * i)
  }
  ctx.stroke()
}

export function drawChar(
  ctx: CanvasRenderingContext2D,
  char: string,
  x: number,
  y: number,
  cellSize: number,
  fontSizePercent: number,
  offsetY: number,
  color: string,
  fontFamily: string,
  fontWeight: string,
) {
  const fontSize = cellSize * fontSizePercent / 100
  ctx.fillStyle = color
  // fontFamily 为 CSS 变量名（如 --font-ma-shan-zheng），需解析为实际字体名
  const resolvedFamily = resolveFontFamily(fontFamily)
  ctx.font = `${fontWeight} ${fontSize}mm ${resolvedFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, x + cellSize / 2, y + cellSize / 2 + cellSize * offsetY / 100)
}

function resolveFontFamily(cssVariableOrName: string): string {
  if (cssVariableOrName.startsWith('--')) {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVariableOrName)
      .trim()
    return value || 'serif'
  }
  return cssVariableOrName
}

export function renderGrid(ctx: CanvasRenderingContext2D, params: RenderParams) {
  const {
    text, gridType, gridSize, rowGap,
    marginTop, marginRight, marginBottom, marginLeft,
    fontFamily, fontWeight, fontSize, fontOffsetY,
    traceCount, traceColor, lineColor, highlightFirst,
    insertEmptyRow, insertEmptyCol,
    paperWidth, paperHeight,
  } = params

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, paperWidth, paperHeight)

  const chars = Array.from(text)
  if (chars.length === 0) return

  const contentWidth = paperWidth - marginLeft - marginRight
  const colStep = insertEmptyCol ? gridSize * 2 : gridSize
  const colsPerRow = Math.floor(contentWidth / colStep) || 1
  const rowHeight = gridSize + rowGap
  const rowStep = insertEmptyRow ? rowHeight * 2 : rowHeight

  let currentRow = 0
  let charIndex = 0

  while (charIndex < chars.length) {
    const y = marginTop + currentRow * rowStep

    if (y + gridSize > paperHeight - marginBottom) break

    for (let col = 0; col < colsPerRow && charIndex < chars.length; col++) {
      const x = marginLeft + col * colStep

      for (let trace = 0; trace < traceCount; trace++) {
        const traceX = x + trace * gridSize
        if (traceX + gridSize > paperWidth - marginRight + gridSize * 0.5) continue

        drawGridCell(ctx, traceX, y, gridSize, gridType, lineColor)

        const isFirstChar = highlightFirst && trace === 0
        const color = isFirstChar ? '#000000' : traceColor
        drawChar(ctx, chars[charIndex], traceX, y, gridSize, fontSize, fontOffsetY, color, fontFamily, fontWeight)
      }

      charIndex++
    }

    if (insertEmptyRow) {
      const emptyY = y + rowStep - rowHeight
      for (let col = 0; col < colsPerRow * (traceCount); col++) {
        const x = marginLeft + col * gridSize
        if (x + gridSize > paperWidth - marginRight + gridSize * 0.5) break
        drawGridCell(ctx, x, emptyY, gridSize, gridType, lineColor)
      }
    }

    currentRow++
  }
}
```

- [ ] **Step 2: 在 CopybookEditor.vue 中集成渲染逻辑**

```vue
<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'
import { useStore } from '@nanostores/vue'
import {
  copybookText, copybookGridType, copybookGridSize, copybookRowGap,
  copybookMargin, copybookFontFamily, copybookFontWeight, copybookFontSize,
  copybookFontOffsetY, copybookTraceCount, copybookTraceColor, copybookLineColor,
  copybookHighlightFirst, copybookInsertEmptyRow, copybookInsertEmptyCol,
} from '@/stores/copybook.store'
import { renderGrid } from '@/composables/copybook/useGridRenderer'
import { A4_WIDTH_MM, A4_HEIGHT_MM } from '@/shared/copybook/constants'

const canvasRef = ref<HTMLCanvasElement>()
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

const A4_CSS_WIDTH = 794
const A4_CSS_HEIGHT = 1123

function setupCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return null
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
  if (!ctx) return
  renderGrid(ctx, {
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
  })
}

onMounted(() => {
  watchEffect(() => {
    draw()
  })
})
</script>

<template>
  <div class="flex h-full overflow-hidden">
    <aside class="w-300px border-r border-gray-200 overflow-y-auto p-4">
      <p class="text-gray-500">控制面板（待实现）</p>
    </aside>
    <main class="flex-1 overflow-auto bg-gray-100 p-6 flex justify-center">
      <div class="bg-white shadow-lg" :style="{ width: `${A4_CSS_WIDTH}px`, height: `${A4_CSS_HEIGHT}px` }">
        <canvas ref="canvasRef" :style="{ width: `${A4_CSS_WIDTH}px`, height: `${A4_CSS_HEIGHT}px` }" />
      </div>
    </main>
  </div>
</template>
```

- [ ] **Step 3: 验证默认渲染**

Run: `pnpm dev`
Expected: Canvas 显示 "你好世界" 的田字格字帖，首字高亮

- [ ] **Step 4: Commit**

```bash
git add src/composables/copybook/useGridRenderer.ts src/components/copybook/CopybookEditor.vue
git commit -m "feat(copybook): implement canvas rendering with mm coordinate system"
```

---

## P2: 控制面板 UI + 状态联动

### Task 6: 创建 CanvasPreview 组件

**Files:**
- Create: `src/components/copybook/CanvasPreview.vue`
- Modify: `src/components/copybook/CopybookEditor.vue`

- [ ] **Step 1: 将 Canvas 渲染抽离为独立组件**

CanvasPreview.vue 负责：
- 管理 Canvas DOM 引用
- 使用 `useStore` 读取所有 copybook store 状态
- `watchEffect` 监听所有状态变化，触发重绘
- `await document.fonts.ready` 确保字体就绪后再渲染
- 设置 high-DPI Canvas（使用 mm 坐标系统）
- 监听 `document.fonts.addEventListener('loadingdone', ...)` 字体加载后重绘
- 暴露 `getCanvas()` 方法供导出使用（通过 `defineExpose`）

- [ ] **Step 2: 更新 CopybookEditor.vue 引用 CanvasPreview**

- [ ] **Step 3: Commit**

```bash
git add src/components/copybook/CanvasPreview.vue src/components/copybook/CopybookEditor.vue
git commit -m "feat(copybook): extract CanvasPreview component"
```

---

### Task 7: 创建 TextInputDialog 组件

**Files:**
- Create: `src/components/copybook/TextInputDialog.vue`

- [ ] **Step 1: 实现文本输入对话框**

- 模态遮罩 + 居中对话框
- textarea 输入框，绑定 `copybookText` store
- 取消/确定按钮
- 点击对话框外部或按 Escape 关闭

- [ ] **Step 2: Commit**

```bash
git add src/components/copybook/TextInputDialog.vue
git commit -m "feat(copybook): add text input dialog"
```

---

### Task 8: 创建 MarginDialog 组件

**Files:**
- Create: `src/components/copybook/MarginDialog.vue`

- [ ] **Step 1: 实现页边距设置对话框**

- 模态遮罩 + 居中对话框
- 4 个滑块：上/下/左/右边距（10–100px）
- 重置按钮恢复默认值
- 绑定 `copybookMargin` store

- [ ] **Step 2: Commit**

```bash
git add src/components/copybook/MarginDialog.vue
git commit -m "feat(copybook): add margin settings dialog"
```

---

### Task 9: 创建 FontPickerDialog 组件

**Files:**
- Create: `src/components/copybook/FontPickerDialog.vue`

- [ ] **Step 1: 实现字体选择对话框**

- 模态遮罩 + 居中对话框
- 字体列表，每个选项用对应字体渲染预览文字（使用 `copybook.config.ts` 中的 FONT_FAMILIES，包含跨平台 fallback chain）
- 点击选中，绑定 `copybookFontFamily` store

- [ ] **Step 2: Commit**

```bash
git add src/components/copybook/FontPickerDialog.vue
git commit -m "feat(copybook): add font picker dialog"
```

---

### Task 10: 创建 ColorPickerDialog 组件

**Files:**
- Create: `src/components/copybook/ColorPickerDialog.vue`

- [ ] **Step 1: 实现颜色选择对话框**

- 模态遮罩 + 居中对话框
- 6 行 × 6 列色板网格
- 每个色块可点击选中
- 通过 props 接收当前颜色和回调函数

- [ ] **Step 2: Commit**

```bash
git add src/components/copybook/ColorPickerDialog.vue
git commit -m "feat(copybook): add color picker dialog"
```

---

### Task 11: 创建 ControlPanel 组件并集成所有子组件

**Files:**
- Create: `src/components/copybook/ControlPanel.vue`
- Modify: `src/components/copybook/CopybookEditor.vue`

- [ ] **Step 1: 实现 ControlPanel.vue**

包含所有控制项（按顺序）：
1. 文本输入区（只读显示 + 点击弹出 TextInputDialog）
2. 3 个开关：首字高亮、插入空行、插入空列
3. 方格类型下拉选择
4. 方格大小滑块（6–60mm）
5. 行间距滑块（0–10mm）
6. 页边距按钮（弹出 MarginDialog）
7. 字体按钮（弹出 FontPickerDialog）
8. 字体粗细下拉
9. 字体大小滑块（48–128%）
10. 上下偏移滑块（-50–50%）
11. 描红数量滑块（1–20）
12. 描红颜色按钮（弹出 ColorPickerDialog）
13. 线条颜色按钮（弹出 ColorPickerDialog）

所有控件直接读写对应的 Nanostore atom。

- [ ] **Step 2: 更新 CopybookEditor.vue 集成 ControlPanel**

替换左侧面板占位内容为 `<ControlPanel />`

- [ ] **Step 3: 验证状态联动**

Run: `pnpm dev`
调整任意控制项，确认 Canvas 实时重绘

- [ ] **Step 4: Commit**

```bash
git add src/components/copybook/ControlPanel.vue src/components/copybook/CopybookEditor.vue
git commit -m "feat(copybook): add control panel with all settings"
```

---

## P3: 7 种方格类型绘制

### Task 12: 验证所有方格类型绘制

**Files:**
- Modify: `src/composables/copybook/useGridRenderer.ts`（如需修复）

> **注：** Task 5 的 `drawGridCell` 已实现所有 7 种方格类型的绘制分发逻辑。本 Task 主要是验证和修复。

- [ ] **Step 1: 验证所有方格类型**

切换 7 种类型逐一确认绘制正确：
- 田字格：外框 + 十字虚线
- 米字格：田字格 + 对角虚线
- 回宫格：外框 + 内框
- 九宫格：外框 + 三等分线
- 回田格：回宫格 + 十字虚线
- 回米格：回宫格 + 十字虚线 + 对角虚线
- 作文格：仅外框

- [ ] **Step 2: 修复如有问题**

- [ ] **Step 3: Commit**

```bash
git add src/composables/copybook/useGridRenderer.ts
git commit -m "fix(copybook): fix grid type rendering issues"
```

---

### Task 13: 实现空行/空列逻辑

**Files:**
- Modify: `src/composables/copybook/useGridRenderer.ts`

- [ ] **Step 1: 验证/修复空行空列逻辑**

Task 5 的 `renderGrid` 已包含空行/空列基础逻辑。验证以下场景：
- `insertEmptyRow`：每个字行后插入一个空白行（仅方格无文字）
- `insertEmptyCol`：每个字列后插入一个空白列（影响列数计算）
- 两个开关同时开启

- [ ] **Step 2: Commit**

```bash
git add src/composables/copybook/useGridRenderer.ts
git commit -m "fix(copybook): fix empty row/col layout calculation"
```

---

## P4: 导出功能

### Task 14: 安装 jsPDF 并实现导出逻辑

**Files:**
- Create: `src/composables/copybook/useExport.ts`
- Modify: `package.json`（新增依赖）

- [ ] **Step 1: 安装 jsPDF**

```bash
pnpm add jspdf
```

- [ ] **Step 2: 创建 useExport composable**

> **关键设计：** 导出时不使用屏幕 Canvas，而是创建离屏 Canvas 以固定 300 DPI 重新渲染，确保不同设备导出质量一致。复用同一套 `renderGrid()` mm 坐标绘制逻辑。

```ts
// src/composables/copybook/useExport.ts
import { jsPDF } from 'jspdf'
import { renderGrid } from './useGridRenderer'
import { A4_WIDTH_MM, A4_HEIGHT_MM, EXPORT_DPI, MM_PER_INCH } from '@/shared/copybook/constants'
import type { RenderParams } from '@/interfaces/copybook'

function createExportCanvas(params: RenderParams): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(A4_WIDTH_MM * EXPORT_DPI / MM_PER_INCH)
  canvas.height = Math.round(A4_HEIGHT_MM * EXPORT_DPI / MM_PER_INCH)
  const ctx = canvas.getContext('2d')!
  const pxPerMM = EXPORT_DPI / MM_PER_INCH
  ctx.scale(pxPerMM, pxPerMM)
  renderGrid(ctx, params)
  return canvas
}

export function exportPNG(params: RenderParams) {
  const canvas = createExportCanvas(params)
  const link = document.createElement('a')
  link.download = 'copybook.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function exportPDF(params: RenderParams) {
  const { jsPDF } = await import('jspdf')
  const canvas = createExportCanvas(params)
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM)
  pdf.save('copybook.pdf')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/composables/copybook/useExport.ts package.json pnpm-lock.yaml
git commit -m "feat(copybook): add export with offscreen canvas at 300 DPI"
```

---

### Task 15: 创建 ExportButton 组件并集成打印功能

**Files:**
- Create: `src/components/copybook/ExportButton.vue`
- Modify: `src/components/copybook/CopybookEditor.vue`

- [ ] **Step 1: 实现 ExportButton.vue**

- 导出按钮（下拉菜单）：导出 PDF / 导出 PNG
- 打印按钮：调用 `window.print()`
- 下拉菜单使用纯 CSS/UnoCSS 实现（不引入 UI 库）
- 导出时调用 `exportPNG(params)` / `exportPDF(params)`，传入当前 store 状态构建 RenderParams

- [ ] **Step 2: 在 CopybookEditor.vue 顶部工具栏添加 ExportButton**

- [ ] **Step 3: 验证导出和打印**

- 导出 PDF 文件可正常打开（300 DPI 清晰度）
- 导出 PNG 图片清晰（2480×3508 像素）
- 打印预览正常

- [ ] **Step 4: Commit**

```bash
git add src/components/copybook/ExportButton.vue src/components/copybook/CopybookEditor.vue
git commit -m "feat(copybook): add export button with PDF/PNG/print"
```

---

## P5: UI 打磨 + 字体集成 + 打印样式

### Task 16: 控制面板样式优化

**Files:**
- Modify: `src/components/copybook/ControlPanel.vue`

- [ ] **Step 1: 统一控制面板样式**

- 使用 UnoCSS 统一间距、圆角、字号
- 控制项分组：文本/显示/方格/字体/描红
- 每组添加分组标题
- 滑块显示当前值标签

- [ ] **Step 2: Commit**

```bash
git add src/components/copybook/ControlPanel.vue
git commit -m "style(copybook): polish control panel layout"
```

---

### Task 17: Canvas 预览区优化

**Files:**
- Modify: `src/components/copybook/CanvasPreview.vue`

- [ ] **Step 1: 优化预览区样式**

- A4 纸模拟：白色背景 + box-shadow 阴影
- 居中显示在预览区
- 预览区灰色背景（#f5f5f5）
- 可选：支持 Ctrl+滚轮缩放

- [ ] **Step 2: Commit**

```bash
git add src/components/copybook/CanvasPreview.vue
git commit -m "style(copybook): improve canvas preview area"
```

---

### Task 18: Astro font 系统集成

**前置条件：** 字体子集化已完成（详见 [docs/copybook-font-subset.md](./copybook-font-subset.md)），`src/assets/fonts/` 中已有 woff2 文件。

**Files:**
- Modify: `astro.config.ts`
- Verify: `src/layouts/CopybookLayout.astro`（Task 3 已添加 `<Font />` 组件）

- [ ] **Step 1: 确认字体文件就绪**

```bash
ls -la src/assets/fonts/
# 预期：MaShanZheng-Regular.woff2 (~500-800KB)
# 可选：NotoSerifSC-Regular.woff2, NotoSansSC-Regular.woff2
```

- [ ] **Step 2: 在 astro.config.ts 中配置 fontProviders.local()**

```ts
import { defineConfig, fontProviders } from 'astro/config'

export default defineConfig({
  // ... 现有配置
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'MaShanZheng',
      cssVariable: '--font-ma-shan-zheng',
      fallbacks: ['KaiTi', 'STKaiti', 'serif'],
      options: {
        variants: [{
          src: ['./src/assets/fonts/MaShanZheng-Regular.woff2'],
          weight: 'normal',
          style: 'normal',
        }],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'NotoSerifSC',
      cssVariable: '--font-noto-serif-sc',
      fallbacks: ['SimSun', 'STSong', 'serif'],
      options: {
        variants: [{
          src: ['./src/assets/fonts/NotoSerifSC-Regular.woff2'],
          weight: '400',
          style: 'normal',
        }],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'NotoSansSC',
      cssVariable: '--font-noto-sans-sc',
      fallbacks: ['SimHei', 'STHeiti', 'sans-serif'],
      options: {
        variants: [{
          src: ['./src/assets/fonts/NotoSansSC-Regular.woff2'],
          weight: '400',
          style: 'normal',
        }],
      },
    },
  ],
})
```

- [ ] **Step 3: 验证 CopybookLayout.astro 中已有 Font 组件**

Task 3 已在 `<head>` 中添加：
```astro
<Font cssVariable="--font-ma-shan-zheng" preload />
<Font cssVariable="--font-noto-serif-sc" />
<Font cssVariable="--font-noto-sans-sc" />
```

- [ ] **Step 4: 验证字体加载**

Run: `pnpm dev`
在浏览器 DevTools Network 面板确认 woff2 文件被加载，Canvas 文字使用 Ma Shan Zheng 字体渲染

- [ ] **Step 5: Commit**

```bash
git add astro.config.ts src/assets/fonts/
git commit -m "feat(copybook): integrate Astro font system with fontmin subsets"
```

---

### Task 19: 打印样式

**Files:**
- Modify: `src/layouts/CopybookLayout.astro`

- [ ] **Step 1: 添加打印样式**

在 CopybookLayout 中添加 `<style>` 标签：

```css
@media print {
  aside, .toolbar, .copybook-nav { display: none !important; }
  main { padding: 0 !important; background: white !important; }
  canvas { box-shadow: none !important; }
}
```

- [ ] **Step 2: 验证打印预览**

打印时控制面板隐藏，仅显示 Canvas

- [ ] **Step 3: Commit**

```bash
git add src/layouts/CopybookLayout.astro
git commit -m "style(copybook): add print styles"
```

---

### Task 20: 更新导航配置

**Files:**
- Modify: `src/config/header.config.ts`

- [ ] **Step 1: 在导航中添加字帖入口**

```ts
{
  text: '字帖',
  link: '/copybook',  // 总入口，由 CopybookNav 分流到子功能
},
```

- [ ] **Step 2: Commit**

```bash
git add src/config/header.config.ts
git commit -m "feat(copybook): add nav entry for copybook"
```

---

### Task 21: 最终验证

- [ ] **Step 1: 运行 lint 检查**

```bash
npx eslint --fix .
```

- [ ] **Step 2: 运行 build 检查**

```bash
pnpm run build
```

Expected: build 成功，无类型错误

- [ ] **Step 3: 功能全量测试**

- 访问 `/copybook/hanzi`
- 输入汉字 → 预览更新
- 切换 7 种方格类型
- 调整所有滑块参数
- 导出 PDF/PNG（验证 300 DPI 清晰度）
- 打印预览
- 导航栏有字帖入口
