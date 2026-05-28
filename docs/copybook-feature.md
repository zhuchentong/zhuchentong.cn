# 汉字字帖功能 — 需求与功能文档

> 参考网站: https://z2h.cn/hanzi
> 项目路由: `/copybook/hanzi`

---

## 一、功能概述

在线汉字字帖生成工具，用户输入汉字后实时预览并生成可打印的字帖，支持多种方格类型、描红、自定义字体、导出 PDF/PNG 等功能。

基于 Astro Islands 架构，使用 Vue 3 构建交互式字帖编辑器，通过 Canvas API 渲染字帖预览。

---

## 二、技术架构

### 2.1 整体架构

```
Astro Page (SSR)
  └── CopybookLayout.astro（全屏布局，无 Header/Footer）
        ├── CopybookNav（顶部导航栏：← 首页 + 字帖类型 Tab，SSR 渲染）
        └── <slot /> 内容区
              └── /copybook/hanzi → CopybookEditor.vue (client:only="vue")
                    ├── ControlPanel.vue（左侧控制面板，含导出按钮）
                    ├── CanvasPreview.vue（右侧 Canvas 预览）
                    ├── TextInputDialog.vue（文本输入对话框）
                    ├── FontPickerDialog.vue（字体选择对话框）
                    ├── MarginDialog.vue（页边距设置）
                    └── ColorPickerDialog.vue（颜色选择）
```

### 2.2 核心技术栈

| 技术                                | 用途                                                      |
| ----------------------------------- | --------------------------------------------------------- |
| Astro Islands + `client:only="vue"` | 页面框架，Vue Island 纯客户端渲染（避免 SSR 闪烁）        |
| Vue 3 + Composition API             | 所有交互 UI 组件                                          |
| Nanostores                          | 组件间状态共享（已有）                                    |
| Canvas API                          | 方格绘制、文字渲染                                        |
| jsPDF                               | 导出 PDF（通过 Canvas toDataURL + addImage 绕过字体限制） |

### 2.3 数据流

```
用户输入 → Nanostore 状态更新 → Canvas 重绘 → 实时预览
                                        ↓
                               导出按钮 → PDF/PNG 文件
```

### 2.4 Canvas 渲染架构

采用**毫米坐标系统**，通过 `ctx.scale()` 统一屏幕显示和导出：

```ts
// 屏幕显示：使用 devicePixelRatio 保证清晰
// 导出：使用固定 300 DPI 保证打印质量
// 绘制代码统一使用 mm 单位，scale 处理像素映射

const pxPerMM = dpi / 25.4
ctx.scale(pxPerMM, pxPerMM)
// 之后所有绘制坐标都用 mm
ctx.strokeRect(0, 0, 210, 297) // A4 尺寸
```

### 2.5 字体策略

> **详细方案见 [docs/copybook-font-subset.md](./copybook-font-subset.md)**

Google Fonts 在中国不可用，采用 **Astro `fontProviders.local()` + fontmin 子集化自托管** 方案：

| 层级   | 策略                           | 说明                                                                               |
| ------ | ------------------------------ | ---------------------------------------------------------------------------------- |
| 第一层 | Astro font 系统自托管 Web 字体 | fontmin 子集化 GB2312 woff2，`fontProviders.local()` 注册，`<Font preload />` 注入 |
| 第二层 | 系统字体 fallback              | `KaiTi, STKaiti, serif`（Astro `fallbacks` 自动生成）                              |

字体来源与子集化工具：

- **工具：** [fontmin](https://github.com/ecomfe/fontmin)（百度 EFE 团队，按文本精确子集 + ttf 转 woff2）
- **楷体：** Ma Shan Zheng（Google Fonts 下载后自托管）
- **宋体：** Noto Serif SC（可选）
- **黑体：** Noto Sans SC（可选）

> **关键：** 使用 `document.fonts.ready` 确保字体就绪后再渲染 Canvas，避免 fallback 字体渲染后不自动更新。

---

## 三、功能模块详细说明

### 3.1 页面布局

**整体结构：** 全屏左右分栏，不使用 MainLayout（无 Header/Footer），顶部有字帖导航栏

```
┌─────────────────────────────────────────────┐
│  CopybookNav：← 首页 │ 汉字字帖 │ ...未来Tab  │
├──────────────┬──────────────────────────────┤
│              │                              │
│  控制面板     │     Canvas 预览区             │
│  (固定宽300px)│     (A4 纸模拟，居中)         │
│              │                              │
│  - 文本输入   │                              │
│  - 显示选项   │                              │
│  - 方格设置   │                              │
│  - 字体设置   │                              │
│  - 描红设置   │                              │
│  - 导出按钮   │                              │
│              │                              │
├──────────────┴──────────────────────────────┤
```

#### 3.1.1 导航栏（CopybookNav）

导航栏为 CopybookLayout 的一部分，由 Astro SSR 渲染（非 Vue Island），用于在 `/copybook` 子功能间切换：

| 导航项   | 路由                    | 状态   |
| -------- | ----------------------- | ------ |
| ← 首页   | `/`                     | 已实现 |
| 汉字字帖 | `/copybook/hanzi`       | 当前   |
| 数字字帖 | `/copybook/number`      | 未来   |
| 拼音字帖 | `/copybook/pinyin`      | 未来   |
| 控笔练习 | `/copybook/pen-control` | 未来   |

导航配置定义在 `src/config/copybook.config.ts` 的 `COPYBOOK_NAV_ITEMS` 中。

### 3.2 文本输入

| 功能     | 说明                                       |
| -------- | ------------------------------------------ |
| 输入方式 | 点击文本框弹出模态对话框，输入汉字字符串   |
| 默认文本 | "你好世界"                                 |
| 空白行   | 支持"插入空行"开关，在每行汉字后插入空白行 |
| 空白列   | 支持"插入空列"开关，在每列汉字后插入空白列 |
| 字符限制 | 无硬性限制，超出页面自动分页               |

### 3.3 显示选项（开关控制）

| 选项     | 默认值 | 说明                                             |
| -------- | ------ | ------------------------------------------------ |
| 首字高亮 | 开启   | 每行第一个字以深色（黑色）显示，描红字以浅色显示 |
| 插入空行 | 关闭   | 在字行之间插入空白行                             |
| 插入空列 | 关闭   | 在字列之间插入空白列                             |

> **注：** 笔顺显示、拼音显示暂不实现，作为后续迭代功能。

### 3.4 方格设置

#### 方格类型

| 类型   | 说明                                      |
| ------ | ----------------------------------------- |
| 田字格 | 外框 + 十字虚线（横竖中线）               |
| 米字格 | 外框 + 十字虚线 + 对角虚线                |
| 回宫格 | 外框 + 内框（内缩约 1/3）                 |
| 九宫格 | 外框 + 横竖各两条分割线（将格子分为 3×3） |
| 回田格 | 外框 + 内框 + 十字虚线                    |
| 回米格 | 外框 + 内框 + 十字虚线 + 对角虚线         |
| 作文格 | 仅外框，用于段落书写                      |

#### 方格参数

| 参数     | 范围   | 默认值 | 步长 |
| -------- | ------ | ------ | ---- |
| 方格大小 | 6–60mm | 10mm   | 1mm  |
| 行间距   | 0–10mm | 2mm    | 1mm  |

### 3.5 页边距设置

弹出对话框，分别控制四个方向的页边距：

| 参数   | 范围     | 默认值 |
| ------ | -------- | ------ |
| 上边距 | 10–100px | 36px   |
| 下边距 | 10–100px | 36px   |
| 左边距 | 10–100px | 36px   |
| 右边距 | 10–100px | 36px   |

- 提供重置按钮恢复默认值
- 使用滑块控件

### 3.6 字体设置

| 参数     | 说明                                           |
| -------- | ---------------------------------------------- |
| 字体选择 | 弹出对话框，支持常用字体（楷体、宋体、黑体等） |
| 字体粗细 | 下拉选择（常规/中等/粗体）                     |
| 字体大小 | 48%–128%，默认 68%（相对方格大小百分比）       |
| 上下偏移 | -50%–50%，默认 0%（字在方格内垂直微调）        |

常用字体列表（Astro CSS 变量 + 系统 fallback）：

| 显示名                | Astro CSS 变量         | 系统 fallback                 |
| --------------------- | ---------------------- | ----------------------------- |
| 楷体（Ma Shan Zheng） | `--font-ma-shan-zheng` | `KaiTi, STKaiti, serif`       |
| 宋体（Noto Serif SC） | `--font-noto-serif-sc` | `SimSun, STSong, serif`       |
| 黑体（Noto Sans SC）  | `--font-noto-sans-sc`  | `SimHei, STHeiti, sans-serif` |

> **注：** 字体通过 fontmin 子集化后自托管（GB2312 常用汉字，单文件约 500KB-1MB woff2），Astro `fontProviders.local()` 自动处理 @font-face、preload、fallback。详见 [docs/copybook-font-subset.md](./copybook-font-subset.md)。

### 3.7 描红设置

| 参数     | 范围     | 默认值       | 说明                 |
| -------- | -------- | ------------ | -------------------- |
| 描红数量 | 1–20     | 20           | 每个字的描红重复次数 |
| 描红颜色 | 预设色板 | gray #e2e8f0 | 点击弹出颜色选择器   |
| 线条颜色 | 预设色板 | gray #94a3b8 | 方格线条颜色         |

颜色色板包含 6 个色系，每种 6 级深浅，共 36 种预设色：

- gray: #e2e8f0, #cbd5e1, #94a3b8, #64748b, #475569, black
- red: #fca5a5, #f87171, #ef4444, #dc2626, #b91c1c, #7f1d1d
- orange: #fdba74, #fb923c, #f97316, #ea580c, #c2410c, #9a3412
- green: #86efac, #4ade80, #22c55e, #16a34a, #15803d, #14532d
- blue: #93c5fd, #60a5fa, #3b82f6, #2563eb, #1d4ed8, #1e3a8a
- purple: #d8b4fe, #c084fc, #a855f7, #9333ea, #7e22ce, #581c87

### 3.8 导出功能

| 功能     | 说明                                                                      |
| -------- | ------------------------------------------------------------------------- |
| 导出 PDF | 离屏 Canvas 以 300 DPI 重绘 → `toDataURL()` → `jsPDF.addImage()` → A4 PDF |
| 导出 PNG | 离屏 Canvas 以 300 DPI 重绘 → `toDataURL('image/png')` → 下载             |
| 打印     | `window.print()` + `@media print` 样式隐藏控制面板                        |

> **导出策略：** 不直接使用屏幕 Canvas 导出，而是创建离屏 Canvas 以固定 300 DPI 重新渲染，确保不同设备导出质量一致。Canvas → PNG → jsPDF.addImage() 路径完全绕过 jsPDF 的字体限制。

---

## 四、Canvas 渲染规格

### 4.1 纸张尺寸

- A4 纸：210mm × 297mm
- 屏幕显示 DPI：`Math.max(window.devicePixelRatio * 96, 150)`，保证 Retina 屏清晰
- 导出 DPI：固定 300（A4@300DPI = 2480×3508 像素，约 8.7M 像素，现代浏览器无性能问题）
- 所有绘制使用**毫米坐标**，通过 `ctx.scale(pxPerMM, pxPerMM)` 映射

### 4.2 方格绘制

每种方格类型对应的绘制规则（坐标单位为 mm）：

```
田字格:  外框(实线) + 水平中线(虚线) + 垂直中线(虚线)
米字格:  田字格 + 左上→右下对角线(虚线) + 右上→左下对角线(虚线)
回宫格:  外框(实线) + 内框(实线, 内缩约1/3)
九宫格:  外框(实线) + 2条水平分割线 + 2条垂直分割线
回田格:  回宫格 + 十字虚线
回米格:  回宫格 + 十字虚线 + 对角虚线
作文格:  仅外框(实线)
```

### 4.3 文字渲染

- 每个字居中绘制在方格内
- 首字高亮模式：第一个字 fillText 为黑色，后续字为描红色
- 字体大小 = 方格大小(mm) × 字体大小百分比
- 上下偏移用于微调文字在方格中的垂直位置
- 渲染前检查 `await document.fonts.ready` 确保字体就绪

---

## 五、技术难点与应对策略

### 5.1 中文字体跨平台 — 核心难点

**问题：** 楷体(KaiTi)/宋体(SimSun)/黑体(SimHei) 仅 Windows 预装，macOS/Linux 无这些字体。Google Fonts 在中国被墙。Canvas `fillText()` 会静默 fallback，不报错。

**应对：** 使用 [fontmin](https://github.com/ecomfe/fontmin) 子集化 + Astro `fontProviders.local()` 自托管：

```ts
// 1. fontmin 子集化：TTF → GB2312 子集 woff2 (~500KB-1MB)
// 2. astro.config.ts 注册字体
{
  provider: fontProviders.local(),
  name: 'MaShanZheng',
  cssVariable: '--font-ma-shan-zheng',
  fallbacks: ['KaiTi', 'STKaiti', 'serif'],
  options: { variants: [{ src: ['./src/assets/fonts/MaShanZheng-Regular.woff2'] }] },
}

// 3. Canvas 中通过 CSS 变量获取字体名
const fontFamily = getComputedStyle(document.documentElement)
  .getPropertyValue('--font-ma-shan-zheng')
ctx.font = `normal ${fontSize}mm ${fontFamily}`

// 4. 等待字体就绪后渲染
await document.fonts.ready
renderGrid()
```

> 详见 [docs/copybook-font-subset.md](./copybook-font-subset.md)

### 5.2 Canvas 高 DPI 与导出一致性

**问题：** 屏幕显示 DPI 因设备不同（1x-3x），直接用屏幕 Canvas 导出质量不一致。

**应对：** 导出时创建离屏 Canvas 以固定 300 DPI 重新渲染：

```ts
function renderForExport(): HTMLCanvasElement {
  const EXPORT_DPI = 300
  const canvas = document.createElement('canvas')
  canvas.width = 210 * EXPORT_DPI / 25.4 // 2480px
  canvas.height = 297 * EXPORT_DPI / 25.4 // 3508px
  const ctx = canvas.getContext('2d')!
  const pxPerMM = EXPORT_DPI / 25.4
  ctx.scale(pxPerMM, pxPerMM)
  drawCopybook(ctx) // 复用同一套 mm 坐标绘制逻辑
  return canvas
}
```

### 5.3 字体异步加载时序

**问题：** Web 字体加载完成前 Canvas 已渲染，使用的是 fallback 字体。字体加载后 Canvas 不会自动重绘。

**应对：** 监听 `document.fonts.ready` 和 `loadingdone` 事件：

```ts
// 初始渲染：等待字体就绪
await document.fonts.ready
renderGrid()

// 字体动态加载后：自动重绘
document.fonts.addEventListener('loadingdone', () => {
  renderGrid()
})
```

---

## 六、暂不实现（后续迭代）

| 功能           | 说明                                        |
| -------------- | ------------------------------------------- |
| 显示笔顺       | 依赖 hanzi-writer / makemeahanzi 笔画数据库 |
| 显示拼音       | 依赖 pinyin-pro 等拼音转换库                |
| 本机字体       | 需要本地字体扫描 API                        |
| 多页支持       | 超出单页 A4 时的自动分页                    |
| URL 参数持久化 | 通过 URL query 保存/恢复字帖配置            |
