# 拼音练习册设计文档

## 概述

在 `src/apps/workbook/` 下实现拼音练习册功能，生成可导出/打印的拼音试题。基于 Leafer Canvas 渲染，复用 copybook 的田字格绘制和导出逻辑。

## 需求

- 12 个章节，循序渐进学习拼音
- 预生成题库 JSON，按知识点覆盖抽取试题
- 试题格式：上方四线三格（拼音书写区）+ 下方田字格（词组显示）
- 支持显示/隐藏答案（红色标注）
- 导出 PDF/PNG/打印
- 左右布局：控制面板 + Leafer 预览

## 数据模型

### Question

```ts
interface Question {
  words: string              // 词组，如 "阿姨"
  pinyin: string[]           // 每个字的拼音，如 ["ā", "yí"]
  chapter: number            // 所属章节 1-12
  knowledgePoints: string[]  // 涉及的知识点，如 ["a", "yi", "四声"]
}
```

### Chapter

```ts
interface Chapter {
  id: number
  title: string              // 如 "单韵母 + 四声 + y/w规则"
  pinyinRange: string        // 已学拼音范围描述
}
```

### 试题生成逻辑

1. 选择章节 N
2. 从题库中筛选 `chapter <= N` 的所有题目
3. 按知识点分组，每组随机抽取 1-2 题
4. 确保所有知识点都被覆盖
5. 用 seed 控制随机顺序（可重现）

### 章节规划（12 章）

| 章节 | 已学拼音范围 | 示例词组 |
|------|-------------|---------|
| 1 | 单韵母 + 四声 + y/w规则 | 阿姨、雨衣、乌鸦、鳄鱼 |
| 2 | + b p m f | 爸爸、妈妈、泼水、发卡、木马 |
| 3 | + d t n l | 大地、土地、那里、拉力、泥巴 |
| 4 | + g k h | 哥哥、哭喊、荷花、老虎、苦瓜 |
| 5 | + j q x + ü 去点 | 学习、请客、西瓜、句子、有趣 |
| 6 | + zh ch sh r | 知道、吃饭、老师、日出、热水 |
| 7 | + z c s | 写字、词语、思考、紫色、擦车 |
| 8 | + ai ei ao ou | 买菜、妹妹、高兴、头发、口袋 |
| 9 | + ia ie ua uo üe | 下雨、爷爷、西瓜、过河、月亮 |
| 10 | + iao iou uai uei 及缩写 | 学校、六岁、快跑、回家、对错 |
| 11 | + 前鼻韵母 an en in un ün | 看见、认真、关心、春天、云彩 |
| 12 | + 后鼻韵母 ang eng ing ong | 上课、灯光、听写、红色、风筝 |

## 文件结构

```
src/apps/workbook/
├── config.ts                  # 章节配置、默认值、颜色常量（已存在，需扩展）
├── interfaces.ts              # Question, Chapter, PinyinState 等类型
├── constants.ts               # A4 尺寸、DPI 等物理常量
├── store.ts                   # Nanostores 状态管理
├── layout.astro               # Astro 布局（已存在）
├── data/
│   └── questions.ts           # 预生成的完整题库（12 章，约 70-100 题）
├── components/
│   ├── ControlPanel.tsx        # 左侧控制面板（章节选择、开关、导出）
│   ├── CanvasPreview.tsx       # Leafer 预览渲染
│   └── ExportButton.tsx        # 导出/打印按钮
├── composables/
│   ├── useRenderer.ts          # 核心渲染（四线三格 + 田字格）
│   ├── useExport.ts            # PDF/PNG 导出
│   └── useQuizGenerator.ts     # 试题生成逻辑
└── pages/
    └── pinyin.astro            # 主页 /workbook/pinyin（已存在，需替换）
```

### 路由与别名（已配置）

- 路由：`/workbook/pinyin` → `./src/apps/workbook/pages/pinyin.astro`
- 别名：`@workbook/*` → `./src/apps/workbook/*`

## 状态管理

使用 Nanostores，与 copybook 一致：

| Atom | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `pinyinChapter` | `number` | `1` | 当前章节 (1-12) |
| `pinyinShowAnswer` | `boolean` | `false` | 是否显示答案 |
| `pinyinLineColor` | `string` | `"#cbd5e1"` | 线条颜色 |
| `pinyinAnswerColor` | `string` | `"#ef4444"` | 答案颜色（红色） |
| `pinyinGridSize` | `number` | `14` | 田字格大小 (mm) |
| `pinyinMargin` | `Margin` | `{top:20,right:20,bottom:20,left:20}` | 页面边距 |
| `pinyinQuestions` | `Question[]` | `[]` | 当前试题列表 |
| `pinyinSeed` | `number` | `Date.now()` | 随机种子 |

## 页面布局

左右布局，与 copybook 一致：

```
┌──────────────┬────────────────────────────────────┐
│ 控制面板 (300px) │       预览区域 (Leafer Canvas)      │
│              │                                    │
│ 章节选择      │  ┌──────────────────────────────┐  │
│ ○ 第1章       │  │ 四线三格: [ā] [yí]           │  │
│ ○ 第2章       │  │ 田字格:   [阿] [姨]          │  │
│ ...          │  │                              │  │
│              │  │ 四线三格: [___] [___]         │  │
│ 显示答案 [开关] │  │ 田字格:   [乌] [鸦]          │  │
│              │  └──────────────────────────────┘  │
│ 重新出题      │                                    │
│ 导出按钮      │  [缩放控制 25%-200%]               │
└──────────────┴────────────────────────────────────┘
```

## 每道题的渲染结构

上下结构：

```
┌──────────────────────────────────────┐
│  四线三格区域（拼音书写/答案区）         │
│  ──────────┬──────────┬──────────    │
│  ──────────┼──────────┼──────────    │  (第3线稍粗 = 基线)
│  ──────────┼──────────┼──────────    │
│  ──────────┴──────────┴──────────    │
│  显示答案时：红色拼音文字在格内          │
├──────────────────────────────────────┤
│  田字格区域（词组显示）                 │
│  ┌──────────┬──────────┬──────────┐  │
│  │    阿    │    姨    │          │  │
│  └──────────┴──────────┴──────────┘  │
└──────────────────────────────────────┘
```

### 四线三格细节

- 4 条水平线，等间距
- 第 3 条线（基线）稍粗，其余细线
- 每个汉字对应一个拼音格子宽度，用虚线竖线分隔
- 显示答案时，用红色小字在对应格子内标出正确拼音
- 四线三格总高度 = 田字格大小（与田字格等高）

### 田字格

直接复用 copybook 的 `createGridCell(type='tian')` 和 `createChar()` 函数。

## 核心渲染逻辑

### useRenderer.ts

```ts
function createQuestionBlock(params, question, x, y, scale) {
  const charCount = question.words.length

  // 上方：四线三格
  createFourLineGrid(x, y, width, charCount, scale)
  if (showAnswer) {
    createPinyinAnswers(x, y, question.pinyin, scale)
  }

  // 下方：田字格 + 汉字
  for (const char of question.words) {
    createGridCell(cellX, cellY, gridSize, 'tian', lineColor, scale)
    createChar(cellX, cellY, gridSize, char, 'black', scale)
  }
}

function createFourLineGrid(x, y, width, charCount, scale) {
  const totalHeight = gridSize
  const lineSpacing = totalHeight / 3
  // 绘制 4 条水平线 + 分隔竖线
}

function calcPageLayout(params) {
  // 每题高度 = 四线三格高度 + 间距 + 田字格高度
  // 每题宽度 = 字数 × 田字格大小
  // 自动分页
}
```

### useQuizGenerator.ts

```ts
function generateQuiz(chapter, allQuestions, seed): Question[] {
  // 1. 筛选 chapter <= N 的题目
  // 2. 收集所有知识点
  // 3. 按知识点分组
  // 4. 每组随机抽取 1-2 题（确保覆盖）
  // 5. 用 seed 控制随机（seeded random）
  // 6. 返回打乱后的题目列表
}
```

### useExport.ts

复用 copybook 的导出框架：300 DPI offscreen Leafer → PNG → jsPDF。

## 字体处理

- 田字格汉字：复用 copybook 的字体系统（通过 `/api/copybook/font-subset` 加载田英章楷书等）
- 拼音文字：使用系统拉丁字体（Arial/sans-serif），无需额外加载

## 控制面板功能

- **章节选择**：RadioGroup 或 Select（第 1-12 章）
- **显示答案**：Switch 开关
- **重新出题**：按钮，更换随机种子
- **网格大小**：Slider（6-60mm）
- **页面边距**：MarginDialog（复用 copybook）
- **线条颜色**：ColorPicker（复用 copybook）
- **导出**：ExportButton（PDF/PNG/打印）

## 复用 copybook 的代码

| 来源 | 复用内容 |
|------|---------|
| `copybook/constants.ts` | A4 尺寸、DPI、MM_PER_INCH |
| `copybook/composables/useGridRenderer.ts` | `mmToPx`, `s`, `sPoints`, `createGridCell`, `createChar`, `createCross` |
| `copybook/composables/useExport.ts` | PDF/PNG 导出框架 |
| `copybook/components/ColorPickerDialog.tsx` | 颜色选择器 |
| `copybook/components/MarginDialog.tsx` | 边距设置 |
| `copybook/hooks/useFontLoader.ts` | 字体加载 |
| `copybook/server/font-subset-service.ts` | 字体子集化 API |

## 技术方案

- **渲染引擎**：Leafer Draw（与 copybook 一致）
- **导出**：Leafer 导出 + jsPDF 组装 PDF
- **状态管理**：Nanostores
- **UI 框架**：React + shadcn + Tailwind CSS
- **拼音工具**：不需要 cnchar（题库预生成，拼音已写死）
