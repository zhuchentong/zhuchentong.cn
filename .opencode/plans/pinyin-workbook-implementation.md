# 拼音练习册实现计划（修订版）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 `src/apps/workbook/` 下实现拼音练习册功能，生成可导出/打印的拼音试题。

**Architecture:** 复用 copybook 的 Leafer 渲染函数（`createPinyinRow`/`createPinyinText`/`createGridCell`/`createChar`），不重复实现。预生成题库 JSON 按章节组织，按知识点覆盖抽取试题。

**Tech Stack:** Astro 6 (SSR) + React + Leafer Draw + Nanostores + shadcn + Tailwind CSS v4

---

## 复用 copybook 函数清单

从 `@copybook/composables/useGridRenderer` 导入：

| 函数                                                                                         | 用途                                             |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `mmToPx(mm, dpi)`                                                                            | mm 转 px                                         |
| `createPinyinRow(x, y, width, height, lineColor, scale)`                                     | 四线三格（外框 Rect + 2 条内部虚线 = 4 线 3 格） |
| `createPinyinText(pinyin, x, y, cellSize, pinyinHeight, scale, color?)`                      | 拼音格内文字                                     |
| `getPinyinHeight(gridSize)`                                                                  | 拼音格高度 = `gridSize * 0.5`                    |
| `createGridCell(x, y, size, type, lineColor, scale)`                                         | 田字格（type='tian'）                            |
| `createChar(char, x, y, cellSize, fontSize%, offsetY, color, fontFamily, fontWeight, scale)` | 汉字文字                                         |

---

## File Structure

```
src/apps/workbook/
├── config.ts                          # [MODIFY] 扩展章节、颜色、默认值
├── interfaces.ts                      # [CREATE] 类型定义
├── constants.ts                       # [CREATE] 物理常量（同 copybook）
├── store.ts                           # [CREATE] Nanostores atoms
├── layout.astro                       # [MODIFY] 添加打印 CSS
├── assets/
│   └── data/
│       └── pinyin-questions.json      # [CREATE] 12 章题库
├── components/
│   ├── ControlPanel.tsx               # [CREATE]
│   ├── CanvasPreview.tsx              # [CREATE]
│   └── ExportButton.tsx               # [CREATE]
├── composables/
│   ├── useRenderer.ts                 # [CREATE] 组合 copybook 函数
│   ├── useExport.ts                   # [CREATE] PDF/PNG 导出
│   └── useQuizGenerator.ts            # [CREATE] 试题生成
└── pages/
    └── pinyin.astro                   # [MODIFY] 替换占位
```

---

### Task 1: 类型定义 + 常量

**Files:**

- Create: `src/apps/workbook/interfaces.ts`
- Create: `src/apps/workbook/constants.ts`

- [ ] **创建 `interfaces.ts`**

```ts
export interface Question {
  words: string
  pinyin: string[]
  chapter: number
  knowledgePoints: string[]
}

export interface Chapter {
  id: number
  title: string
  pinyinRange: string
}

export interface Margin {
  top: number
  right: number
  bottom: number
  left: number
}

export interface WorkbookRenderParams {
  questions: Question[]
  showAnswer: boolean
  gridSize: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  lineColor: string
  answerColor: string
  fontFamily: string
  fontWeight: string
  paperWidth: number
  paperHeight: number
  startQuestionIndex?: number
}

export interface WorkbookPageLayout {
  questionsPerPage: number
  totalPages: number
}
```

- [ ] **创建 `constants.ts`**

```ts
export const A4_WIDTH_MM = 210
export const A4_HEIGHT_MM = 297
export const EXPORT_DPI = 300
export const MM_PER_INCH = 25.4
```

---

### Task 2: 题库 JSON

**Files:**

- Create: `src/apps/workbook/assets/data/pinyin-questions.json`

- [ ] **创建完整 12 章题库**

每章 5-8 道题，覆盖本章所有知识点。JSON 数组格式：

```json
[
  { "words": "阿姨", "pinyin": ["ā", "yí"], "chapter": 1, "knowledgePoints": ["a", "yi"] },
  { "words": "雨衣", "pinyin": ["yǔ", "yī"], "chapter": 1, "knowledgePoints": ["yu", "yi"] },
  ...
]
```

**第 1 章（单韵母 + 四声 + y/w规则）- 5 题：**
阿姨 ā yí | 雨衣 yǔ yī | 乌鸦 wū yā | 鳄鱼 è yú | 衣服 yī fu

**第 2 章（+ b p m f）- 6 题：**
爸爸 bà ba | 妈妈 mā ma | 泼水 pō shuǐ | 木马 mù mǎ | 大米 dà mǐ | 发现 fā xiàn

**第 3 章（+ d t n l）- 5 题：**
大地 dà dì | 土地 tǔ dì | 那里 nà lǐ | 拉力 lā lì | 泥巴 ní bā

**第 4 章（+ g k h）- 5 题：**
哥哥 gē ge | 哭喊 kū hǎn | 荷花 hé huā | 老虎 lǎo hǔ | 苦瓜 kǔ guā

**第 5 章（+ j q x + ü去点）- 6 题：**
学习 xué xí | 请客 qǐng kè | 西瓜 xī guā | 句子 jù zi | 有趣 yǒu qù | 希望 xī wàng

**第 6 章（+ zh ch sh r）- 5 题：**
知道 zhī dào | 吃饭 chī fàn | 老师 lǎo shī | 日出 rì chū | 热水 rè shuǐ

**第 7 章（+ z c s）- 5 题：**
写字 xiě zì | 词语 cí yǔ | 思考 sī kǎo | 紫色 zǐ sè | 擦车 cā chē

**第 8 章（+ ai ei ao ou）- 5 题：**
买菜 mǎi cài | 妹妹 mèi mei | 高兴 gāo xìng | 头发 tóu fa | 口袋 kǒu dài

**第 9 章（+ ia ie ua uo üe）- 5 题：**
下雨 xià yǔ | 爷爷 yé ye | 过河 guò hé | 月亮 yuè liang | 菊花 jú huā

**第 10 章（+ iao iou uai uei 及缩写）- 5 题：**
学校 xué xiào | 六岁 liù suì | 快跑 kuài pǎo | 回家 huí jiā | 对错 duì cuò

**第 11 章（+ 前鼻韵母 an en in un ün）- 5 题：**
看见 kàn jiàn | 认真 rèn zhēn | 关心 guān xīn | 春天 chūn tiān | 云彩 yún cai

**第 12 章（+ 后鼻韵母 ang eng ing ong）- 5 题：**
上课 shàng kè | 灯光 dēng guāng | 听写 tīng xiě | 红色 hóng sè | 风筝 fēng zheng

---

### Task 3: 配置扩展 + 状态管理

**Files:**

- Modify: `src/apps/workbook/config.ts`
- Create: `src/apps/workbook/store.ts`

- [ ] **扩展 `config.ts`** — 保留现有 `WORKBOOK_NAV_ITEMS`，追加：

```ts
import type { Chapter, Margin } from './interfaces'

// 已有内容保留
export const WORKBOOK_NAV_ITEMS = [
  { label: '← 首页', href: '/' },
  { label: '拼音练习', href: '/workbook/pinyin' },
]

// 新增
export const CHAPTERS: Chapter[] = [
  { id: 1, title: '单韵母 + 四声 + y/w规则', pinyinRange: 'a o e i u ü y w' },
  { id: 2, title: '+ b p m f', pinyinRange: '+ b p m f' },
  { id: 3, title: '+ d t n l', pinyinRange: '+ d t n l' },
  { id: 4, title: '+ g k h', pinyinRange: '+ g k h' },
  { id: 5, title: '+ j q x + ü 去点', pinyinRange: '+ j q x' },
  { id: 6, title: '+ zh ch sh r', pinyinRange: '+ zh ch sh r' },
  { id: 7, title: '+ z c s', pinyinRange: '+ z c s' },
  { id: 8, title: '+ ai ei ao ou', pinyinRange: '+ ai ei ao ou' },
  { id: 9, title: '+ ia ie ua uo üe', pinyinRange: '+ ia ie ua uo üe' },
  { id: 10, title: '+ iao iou uai uei 及缩写', pinyinRange: '+ iao iou(iu) uai uei(ui)' },
  { id: 11, title: '+ 前鼻韵母 an en in un ün', pinyinRange: '+ an en in un ün' },
  { id: 12, title: '+ 后鼻韵母 ang eng ing ong', pinyinRange: '+ ang eng ing ong' },
]

export const COLOR_PALETTE = [
  { name: 'gray', colors: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', 'black'] },
  { name: 'red', colors: ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#7f1d1d'] },
  { name: 'orange', colors: ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'] },
  { name: 'green', colors: ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#14532d'] },
  { name: 'blue', colors: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a'] },
  { name: 'purple', colors: ['#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#581c87'] },
]

export const DEFAULT_MARGIN: Margin = { top: 20, right: 20, bottom: 20, left: 20 }

export const DEFAULT_PINYIN_CONFIG = {
  chapter: 1,
  showAnswer: false,
  gridSize: 14,
  margin: { ...DEFAULT_MARGIN },
  lineColor: '#cbd5e1',
  answerColor: '#ef4444',
  seed: Date.now(),
}
```

- [ ] **创建 `store.ts`**

```ts
import type { Margin, Question } from './interfaces'
import { atom } from 'nanostores'
import { DEFAULT_PINYIN_CONFIG } from './config'

export const pinyinChapter = atom<number>(DEFAULT_PINYIN_CONFIG.chapter)
export const pinyinShowAnswer = atom<boolean>(DEFAULT_PINYIN_CONFIG.showAnswer)
export const pinyinGridSize = atom<number>(DEFAULT_PINYIN_CONFIG.gridSize)
export const pinyinMargin = atom<Margin>({ ...DEFAULT_PINYIN_CONFIG.margin })
export const pinyinLineColor = atom<string>(DEFAULT_PINYIN_CONFIG.lineColor)
export const pinyinAnswerColor = atom<string>(DEFAULT_PINYIN_CONFIG.answerColor)
export const pinyinSeed = atom<number>(DEFAULT_PINYIN_CONFIG.seed)
export const pinyinQuestions = atom<Question[]>([])
```

---

### Task 4: 试题生成逻辑

**Files:**

- Create: `src/apps/workbook/composables/useQuizGenerator.ts`

- [ ] **实现 `useQuizGenerator.ts`**

```ts
import type { Question } from '../interfaces'
import allQuestions from '../assets/data/pinyin-questions.json'

export { allQuestions }

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF
    return (s >>> 0) / 0xFFFFFFFF
  }
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateQuiz(chapter: number, seed: number): Question[] {
  const questions = allQuestions as Question[]
  const candidates = questions.filter(q => q.chapter <= chapter)

  // 按知识点分组
  const kpMap = new Map<string, Question[]>()
  for (const q of candidates) {
    for (const kp of q.knowledgePoints) {
      const list = kpMap.get(kp) || []
      list.push(q)
      kpMap.set(kp, list)
    }
  }

  // 每个知识点组随机抽 1-2 题，确保全覆盖
  const rng = seededRandom(seed)
  const selected = new Map<string, Question>()
  for (const [_, qs] of kpMap) {
    const shuffled = shuffle(qs, rng)
    const count = Math.min(2, shuffled.length)
    for (let i = 0; i < count; i++) {
      if (!selected.has(shuffled[i].words)) {
        selected.set(shuffled[i].words, shuffled[i])
      }
    }
  }

  return shuffle(Array.from(selected.values()), rng)
}
```

---

### Task 5: 核心渲染逻辑（复用 copybook）

**Files:**

- Create: `src/apps/workbook/composables/useRenderer.ts`

**核心思路：** 导入 copybook 的 `createPinyinRow`（四线三格）、`createPinyinText`（拼音文字）、`createGridCell`（田字格）、`createChar`（汉字）来组合每道题。

- [ ] **实现 `useRenderer.ts`**

```ts
import type { Question, WorkbookPageLayout, WorkbookRenderParams } from '../interfaces'
import {
  createChar,
  createGridCell,
  createPinyinRow,
  createPinyinText,
  getPinyinHeight,
  mmToPx,
} from '@copybook/composables/useGridRenderer'
import { Line, Rect } from 'leafer-draw'

export { getPinyinHeight, mmToPx }

export function calcWorkbookPageLayout(params: {
  questionCount: number
  gridSize: number
  marginTop: number
  marginBottom: number
  paperHeight: number
}): WorkbookPageLayout {
  const pinyinHeight = getPinyinHeight(params.gridSize)
  // 每题：拼音格 + 田字格 + 间距
  const questionGap = 4
  const questionHeight = pinyinHeight + params.gridSize + questionGap
  const contentHeight = params.paperHeight - params.marginTop - params.marginBottom
  const questionsPerPage = Math.max(1, Math.floor(contentHeight / questionHeight))
  const totalPages = Math.max(1, Math.ceil(params.questionCount / questionsPerPage))
  return { questionsPerPage, totalPages }
}

function createQuestionBlock(
  question: Question,
  x: number,
  y: number,
  gridSize: number,
  pinyinHeight: number,
  showAnswer: boolean,
  lineColor: string,
  answerColor: string,
  fontFamily: string,
  fontWeight: string,
  scale: number,
): (Rect | Line | import('leafer-draw').Text)[] {
  const elements: (Rect | Line | import('leafer-draw').Text)[] = []
  const chars = Array.from(question.words)
  const charCount = chars.length
  const totalWidth = charCount * gridSize

  // 上方：四线三格（复用 copybook）
  elements.push(...createPinyinRow(x, y, totalWidth, pinyinHeight, lineColor, scale))

  // 答案文字（复用 copybook 的 createPinyinText，传入红色）
  if (showAnswer) {
    for (let i = 0; i < question.pinyin.length; i++) {
      elements.push(createPinyinText(
        question.pinyin[i],
        x + i * gridSize,
        y,
        gridSize,
        pinyinHeight,
        scale,
        answerColor,
      ))
    }
  }

  // 下方：田字格 + 汉字（复用 copybook）
  const gridY = y + pinyinHeight
  for (let i = 0; i < charCount; i++) {
    const cellX = x + i * gridSize
    elements.push(...createGridCell(cellX, gridY, gridSize, 'tian', lineColor, scale))
    elements.push(createChar(
      chars[i],
      cellX,
      gridY,
      gridSize,
      68,
      0, // fontSize%, offsetY — 与 copybook 默认值一致
      '#000000',
      fontFamily,
      fontWeight,
      scale,
    ))
  }

  return elements
}

export function createWorkbookElements(
  params: WorkbookRenderParams,
  scale = 1,
): (Rect | Line | import('leafer-draw').Text)[] {
  const {
    questions,
    showAnswer,
    gridSize,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    lineColor,
    answerColor,
    fontFamily,
    fontWeight,
    paperWidth,
    paperHeight,
    startQuestionIndex = 0,
  } = params

  const elements: (Rect | Line | import('leafer-draw').Text)[] = []

  // 白色背景
  elements.push(new Rect({
    x: 0,
    y: 0,
    width: paperWidth * scale,
    height: paperHeight * scale,
    fill: '#ffffff',
  }))

  const pinyinHeight = getPinyinHeight(gridSize)
  const questionGap = 4
  const questionHeight = pinyinHeight + gridSize + questionGap
  const contentHeight = paperHeight - marginTop - marginBottom

  const maxRows = Math.max(1, Math.floor(contentHeight / questionHeight))

  for (let row = 0; row < maxRows; row++) {
    const qi = startQuestionIndex + row
    if (qi >= questions.length)
      break

    const qy = marginTop + row * questionHeight
    if (qy + questionHeight - questionGap > paperHeight - marginBottom)
      break

    elements.push(...createQuestionBlock(
      questions[qi],
      marginLeft,
      qy,
      gridSize,
      pinyinHeight,
      showAnswer,
      lineColor,
      answerColor,
      fontFamily,
      fontWeight,
      scale,
    ))
  }

  return elements
}
```

**注意：** `createPinyinRow`、`createPinyinText`、`createGridCell`、`createChar` 都是纯函数，返回 leafer 元素数组，不依赖 Leafer 实例或 store，可安全跨 app 导入复用。

---

### Task 6: 导出逻辑

**Files:**

- Create: `src/apps/workbook/composables/useExport.ts`

- [ ] **实现 `useExport.ts`**

```ts
import type { WorkbookRenderParams } from '../interfaces'
import { Leafer } from 'leafer-draw'
import { A4_HEIGHT_MM, A4_WIDTH_MM, EXPORT_DPI, MM_PER_INCH } from '../constants'
import { calcWorkbookPageLayout, createWorkbookElements } from './useRenderer'
import '@leafer-in/export'

function getRenderParamsList(params: WorkbookRenderParams): WorkbookRenderParams[] {
  const { questionsPerPage, totalPages } = calcWorkbookPageLayout({
    questionCount: params.questions.length,
    gridSize: params.gridSize,
    marginTop: params.marginTop,
    marginBottom: params.marginBottom,
    paperHeight: params.paperHeight,
  })
  const list: WorkbookRenderParams[] = []
  for (let page = 0; page < totalPages; page++) {
    list.push({ ...params, startQuestionIndex: page * questionsPerPage })
  }
  return list
}

function createExportLeafer(params: WorkbookRenderParams): Leafer {
  const exportWidth = Math.round(A4_WIDTH_MM * EXPORT_DPI / MM_PER_INCH)
  const exportHeight = Math.round(A4_HEIGHT_MM * EXPORT_DPI / MM_PER_INCH)
  const leafer = new Leafer({ width: exportWidth, height: exportHeight, pixelRatio: 1 })
  const pxPerMM = EXPORT_DPI / MM_PER_INCH
  const elements = createWorkbookElements(params, pxPerMM)
  elements.forEach(el => leafer.add(el))
  return leafer
}

export async function exportPNG(params: WorkbookRenderParams) {
  await document.fonts.ready
  const pages = getRenderParamsList(params)
  for (let i = 0; i < pages.length; i++) {
    const leafer = createExportLeafer(pages[i])
    const filename = pages.length === 1 ? 'pinyin-workbook.png' : `pinyin-workbook-${i + 1}.png`
    await leafer.export(filename, { pixelRatio: 1 })
    leafer.destroy()
  }
}

export async function exportPDF(params: WorkbookRenderParams) {
  await document.fonts.ready
  const { jsPDF } = await import('jspdf')
  const pages = getRenderParamsList(params)
  const pdf = new jsPDF('p', 'mm', 'a4')
  for (let i = 0; i < pages.length; i++) {
    if (i > 0)
      pdf.addPage()
    const leafer = createExportLeafer(pages[i])
    const result = await leafer.export('png', { pixelRatio: 1 })
    pdf.addImage(result.data as string, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM)
    leafer.destroy()
  }
  pdf.save('pinyin-workbook.pdf')
}
```

---

### Task 7: 控制面板组件

**Files:**

- Create: `src/apps/workbook/components/ControlPanel.tsx`

- [ ] **实现 ControlPanel.tsx**

组件结构：

- 顶部：重置 + 导出按钮（一行两列）
- 重新出题按钮
- FieldSet 1：章节选择（Select）、显示答案（Switch）
- FieldSet 2：网格大小（Slider）、页边距（Dialog）
- FieldSet 3：线条颜色、答案颜色（ColorPicker）
- 内嵌 `ColorPickerDialog` 和 `MarginDialog`（props 受控模式，不依赖 copybook store）

关键逻辑：

- `useEffect` 监听 `chapter` 变化，自动调用 `generateQuiz` 更新 `pinyinQuestions`
- 重新出题按钮更新 `pinyinSeed` 并重新生成
- `MarginDialog` 接收 `margin` + `onChange` props（受控模式）
- `ColorPickerDialog` 接收 `color` + `onSelect` props（受控模式）

从 `@workbook/store` 读取：`pinyinChapter`, `pinyinShowAnswer`, `pinyinGridSize`, `pinyinMargin`, `pinyinLineColor`, `pinyinAnswerColor`, `pinyinSeed`
写入 `@workbook/store`：对应 set 方法

UI 组件来自 `@/components/ui/`：Button, Select, Slider, Switch, Dialog, Field\*

---

### Task 8: 导出按钮组件

**Files:**

- Create: `src/apps/workbook/components/ExportButton.tsx`

- [ ] **实现 ExportButton.tsx**

从 `@workbook/store` 读取所有渲染参数，组装 `WorkbookRenderParams`，调用 `exportPDF`/`exportPNG`/`window.print()`。

与 copybook 的 ExportButton 结构一致，但参数来源是 workbook store。

---

### Task 9: Canvas 预览组件

**Files:**

- Create: `src/apps/workbook/components/CanvasPreview.tsx`

- [ ] **实现 CanvasPreview.tsx**

核心逻辑（参考 copybook CanvasPreview 简化版）：

1. 从 store 读取所有状态
2. `useMemo` 计算 `calcWorkbookPageLayout` 得到 `questionsPerPage` + `totalPages`
3. `getRenderParams(page)` 组装 `WorkbookRenderParams`
4. `renderAllPages()` — 每页创建 Leafer 实例，调用 `createWorkbookElements` 添加元素
5. `useEffect` 监听变化触发重渲染
6. 监听 `document.fonts.loadingdone` 触发重渲染
7. 缩放控制（固定右下角，25%-200%）
8. `questions.length === 0` 时显示空状态提示

---

### Task 10: 页面与布局更新

**Files:**

- Modify: `src/apps/workbook/pages/pinyin.astro`
- Modify: `src/apps/workbook/layout.astro`

- [ ] **更新 `pinyin.astro`** — 替换占位内容为左右布局：

```astro
---
import WorkbookLayout from '@workbook/layout.astro'
import CanvasPreview from '@workbook/components/CanvasPreview.tsx'
import ControlPanel from '@workbook/components/ControlPanel.tsx'
---

<WorkbookLayout title="拼音练习">
  <div class="flex h-full overflow-hidden">
    <aside class="p-4 border-r border-gray-200 w-[300px] overflow-y-auto">
      <ControlPanel client:only="react" />
    </aside>
    <CanvasPreview client:only="react" />
  </div>
</WorkbookLayout>
```

- [ ] **更新 `layout.astro`** — 在 `</body>` 前添加打印 CSS（与 copybook layout 一致）：

```html
<style is:global>
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    nav,
    aside,
    [data-radix-popper-content-wrapper] {
      display: none !important;
    }
    .flex-1 {
      overflow: visible !important;
    }
    .bg-gray-100 {
      background: white !important;
      padding: 0 !important;
    }
    .shadow-lg {
      box-shadow: none !important;
    }
  }
</style>
```

---

### Task 11: 构建验证

- [ ] **运行 `pnpm run build`** — 确保无类型错误
- [ ] **运行 `pnpm dev`** — 打开 `/workbook/pinyin` 验证功能
- [ ] **运行 `npx eslint --fix .`** — 修复 lint 问题
