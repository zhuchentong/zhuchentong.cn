# 汉字字帖 — 字体子集化方案

> 工具: [fontmin](https://github.com/ecomfe/fontmin) (百度 EFE 团队出品)
> 目标: 将中文字体精确子集化，结合 Astro font 系统自托管
> 原因: Google Fonts 在中国不可用，需自托管字体文件

---

## 一、为什么需要子集化

中文字体全量文件极大：

| 字体 | 全量 TTF | 全量 woff2 | 用途 |
|------|----------|-----------|------|
| Ma Shan Zheng（马善政楷） | ~5.7 MB | ~4 MB | 楷体风格（字帖首选） |
| Noto Serif SC | ~14 MB | ~8 MB | 宋体风格 |
| Noto Sans SC | ~10 MB | ~6 MB | 黑体风格 |

通过子集化提取 GB2312 常用汉字（6,763 字），单文件 woff2 约 500KB-1MB。

---

## 二、工具选择: fontmin

### 为什么选 fontmin

| 维度 | fontmin | @zeir/font-subset |
|------|---------|-------------------|
| 维护状态 | 活跃（2025-08 更新） | 停更（2022-09） |
| 维护者 | 百度 EFE 团队 | 个人开发者 |
| 子集化方式 | 按文本内容精确提取字形 | 按 unicode-range 分片切割 |
| 输出格式 | woff2 / woff / eot / svg / css | 仅 woff2 |
| 精确子集 | `glyph({ text: '你好世界' })` | 不支持按文本提取 |
| ESM 支持 | v2.x 支持，Node 16+ | ESM 但依赖较旧 |
| CLI | `fontmin -t "文本" font.ttf` | 无 |

### 核心优势

1. **按文本精确子集** — 只提取需要的汉字，生成最小文件
2. **多格式输出** — `ttf2woff2()` 一行转换
3. **流式 API** — `.src().use().dest().run()` 可组合
4. **CSS 生成** — `.css()` 自动生成 @font-face

---

## 三、前置准备

### 3.1 安装工具

```bash
pnpm add -D fontmin
```

### 3.1.1 下载源字体

```bash
node scripts/fonts/download.mjs
```

脚本从 Google Fonts GitHub 仓库直接下载，无需翻墙。

### 3.2 下载源字体

通过脚本从 Google Fonts GitHub 仓库下载：

```
scripts/fonts/source/
  MaShanZheng-Regular.ttf      ← Ma Shan Zheng 楷体（必须，静态 TTF ~5.6MB）
  NotoSerifSC[wght].ttf        ← Noto Serif SC 宋体（可选，可变 TTF ~17MB）
  NotoSansSC[wght].ttf         ← Noto Sans SC 黑体（可选，可变 TTF ~17MB）
```

运行下载脚本：

```bash
node scripts/fonts/download.mjs
```

下载源为 GitHub raw（`raw.githubusercontent.com/google/fonts/main/ofl/...`），当前网络可访问。

> **注意：** Noto 字体为可变字体（Variable Font），fontmin 子集化时会丢失变轴信息输出为静态字体。对固定 weight 400 的字帖场景无影响。

### 3.3 准备 GB2312 字符表

创建 `scripts/fonts/gb2312-chars.txt`，包含 GB2312 全部 6,763 个常用汉字。

通过脚本精确生成（使用 GBK `TextDecoder` 反向解码，**不是**简单的 Unicode 范围遍历）：

```js
// scripts/fonts/gen-gb2312.mjs
import fs from 'fs'

const decoder = new TextDecoder('gbk')
let chars = ''

// ASCII 可见字符
for (let i = 0x20; i <= 0x7E; i++) chars += String.fromCodePoint(i)

// GB2312 汉字编码区间
// 一级汉字: 区 16–55 → GB 编码 B0A1–D7F9（3,755 字）
// 二级汉字: 区 56–87 → GB 编码 D8A1–F7FE（3,008 字）
for (let qu = 0xB0; qu <= 0xF7; qu++) {
  for (let wei = 0xA1; wei <= 0xFE; wei++) {
    const buf = Buffer.from([qu, wei])
    const decoded = decoder.decode(buf)
    if (/[\u4e00-\u9fff]/.test(decoded)) {
      chars += decoded
    }
  }
}

// 常用标点符号
chars += '，。、；：？！""''（）【】《》—…·'

fs.writeFileSync('scripts/fonts/gb2312-chars.txt', chars)
// 输出: 6,878 字符 (6,763 CJK + 115 非 CJK)
```

---

## 四、子集化脚本

### 4.1 创建脚本

创建 `scripts/fonts/subset.mjs`：

```js
import Fontmin from 'fontmin'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.resolve(__dirname, 'source')
const destDir = path.resolve(__dirname, '../../src/assets/fonts')
const charFile = path.resolve(__dirname, 'gb2312-chars.txt')

const text = fs.readFileSync(charFile, 'utf-8')
console.log(`Loading ${text.length} characters for subsetting`)

const fonts = [
  { file: 'MaShanZheng-Regular.ttf', required: true },
  { file: 'NotoSerifSC[wght].ttf', required: false },
  { file: 'NotoSansSC[wght].ttf', required: false },
]

for (const { file, required } of fonts) {
  const src = path.join(sourceDir, file)
  if (!fs.existsSync(src)) {
    if (required) {
      console.error(`Missing required font: ${src}`)
      process.exit(1)
    }
    console.log(`Skipping optional font: ${file}`)
    continue
  }

  console.log(`\nProcessing: ${file}`)

  await new Promise((resolve) => {
    new Fontmin()
      .src(src)
      .use(Fontmin.glyph({
        text,
        hinting: false,
      }))
      .use(Fontmin.ttf2woff2())
      .dest(destDir)
      .run((err, files) => {
        if (err) {
          console.error(`Error processing ${file}:`, err)
          if (required) process.exit(1)
          resolve()
          return
        }
        const woff2 = files.find(f => f.path.endsWith('.woff2'))
        if (woff2) {
          const size = (woff2.contents.length / 1024).toFixed(0)
          console.log(`✓ ${path.basename(woff2.path)} (${size} KB)`)
        }
        resolve()
      })
  })
}
```

### 4.2 运行

```bash
# 1. 生成 GB2312 字符表（首次）
node scripts/fonts/gen-gb2312.mjs

# 2. 运行子集化
node scripts/fonts/subset.mjs
```

### 4.3 输出

```
src/assets/fonts/
  MaShanZheng-Regular.woff2     ← 楷体子集 (~500-800 KB)
  NotoSerifSC.woff2              ← 宋体子集 (~600-1000 KB，可选)
  NotoSansSC.woff2               ← 黑体子集 (~500-900 KB，可选)
```

---

## 五、集成 Astro font 系统

### 5.1 配置 astro.config.ts

```ts
// astro.config.ts
import { defineConfig, fontProviders } from 'astro/config'

export default defineConfig({
  // ...
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

### 5.2 布局中注入字体

在 `CopybookLayout.astro` 的 `<head>` 中：

```astro
---
import { Font } from 'astro:assets'
---

<head>
  <Font cssVariable="--font-ma-shan-zheng" preload />
  <Font cssVariable="--font-noto-serif-sc" />
  <Font cssVariable="--font-noto-sans-sc" />
</head>
```

Astro 会自动：
- 生成 `@font-face` 声明
- 添加 `preload` 链接
- 设置 fallback 字体链

### 5.3 Vue Canvas 中使用

```ts
// 获取 Astro 注入的字体名
function getFontFamily(cssVariable: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(cssVariable)
    .trim()
}

// Canvas 渲染
const kaiFont = getFontFamily('--font-ma-shan-zheng')
ctx.font = `normal ${fontSize}mm ${kaiFont}`

// 等待字体就绪
await document.fonts.ready
renderGrid()
```

---

## 六、字体与常量映射

`src/config/copybook.config.ts` 中的字体列表更新为：

```ts
export const FONT_FAMILIES = [
  { label: '楷体', cssVariable: '--font-ma-shan-zheng', fallback: 'KaiTi, STKaiti, serif' },
  { label: '宋体', cssVariable: '--font-noto-serif-sc', fallback: 'SimSun, STSong, serif' },
  { label: '黑体', cssVariable: '--font-noto-sans-sc', fallback: 'SimHei, STHeiti, sans-serif' },
]
```

Canvas 渲染时优先使用 CSS 变量解析出的字体名，未加载时 fallback 到系统字体。

---

## 七、文件清单

```
scripts/fonts/
  source/                           ← 源字体 TTF 文件（不入 git）
    MaShanZheng-Regular.ttf
    NotoSerifSC[wght].ttf
    NotoSansSC[wght].ttf
  download.mjs                     ← 从 Google Fonts GitHub 下载字体
  gen-gb2312.mjs                    ← 生成 GB2312 字符表（GBK TextDecoder）
  gb2312-chars.txt                  ← GB2312 字符表（可入 git）
  subset.mjs                        ← 子集化脚本

src/assets/fonts/                   ← 子集化产物（入 git）
  MaShanZheng-Regular.woff2
  NotoSerifSC.woff2                  (可选)
  NotoSansSC.woff2                   (可选)
```

### .gitignore 建议

```gitignore
# 源字体文件较大，不入 git
scripts/fonts/source/*.ttf
```

## 八、操作流程总结

```
1. node scripts/fonts/download.mjs         下载 TTF → scripts/fonts/source/
2. node scripts/fonts/gen-gb2312.mjs       生成 GB2312 字符表（精确 6,763 字）
3. node scripts/fonts/subset.mjs           子集化 → src/assets/fonts/
4. astro.config.ts 配置 fontProviders.local()
5. CopybookLayout.astro 添加 <Font preload />
6. constants.ts 更新字体列表（CSS 变量）
7. Vue Canvas 通过 CSS 变量 + document.fonts.ready 使用
```
