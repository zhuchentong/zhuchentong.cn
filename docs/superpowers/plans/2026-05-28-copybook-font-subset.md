# 汉字字帖 — 字体子集化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 通过脚本下载 Google Fonts 字体、生成精确 GB2312 字符表、使用 fontmin 子集化为 woff2，并集成 Astro font 系统自托管。

**Architecture:** Node.js 脚本流水线：下载 TTF → 生成 GB2312 字符表 → fontmin 子集化 → woff2 输出。Astro 通过 `fontProviders.local()` 注册字体，`<Font preload />` 注入页面。Canvas 通过 CSS 变量 + `document.fonts.ready` 使用。

**Tech Stack:** Node.js, fontmin, TextDecoder('gbk'), Astro 6 fontProviders.local()

---

## 文件结构

```
新增文件:
  scripts/fonts/
    download.mjs                ← 下载 Google Fonts TTF 到 source/
    gen-gb2312.mjs              ← 通过 GBK TextDecoder 精确生成 GB2312 字符表
    gb2312-chars.txt            ← GB2312 字符表产物（入 git）
    subset.mjs                  ← fontmin 子集化脚本
    source/                     ← 源字体 TTF（不入 git）
      MaShanZheng-Regular.ttf
      NotoSerifSC[wght].ttf     ← 可变字体
      NotoSansSC[wght].ttf      ← 可变字体

  src/assets/fonts/             ← 子集化产物（入 git）
    MaShanZheng-Regular.woff2
    NotoSerifSC-Regular.woff2   (可选)
    NotoSansSC-Regular.woff2    (可选)

修改文件:
  astro.config.ts               ← 添加 fonts 配置
  .gitignore                    ← 忽略 scripts/fonts/source/*.ttf
```

---

## Task 1: 安装 fontmin 并创建目录结构

**Files:**
- Modify: `package.json`（新增 devDependency）
- Modify: `.gitignore`

- [ ] **Step 1: 安装 fontmin**

```bash
pnpm add -D fontmin
```

- [ ] **Step 2: 创建目录结构**

```bash
mkdir -p scripts/fonts/source
mkdir -p src/assets/fonts
```

- [ ] **Step 3: 在 .gitignore 末尾添加源字体忽略规则**

在 `.gitignore` 文件末尾追加：

```gitignore
# 字体源文件（体积大，不入 git）
scripts/fonts/source/*.ttf
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore
git commit -m "chore(copybook): add fontmin dependency and font directories"
```

---

## Task 2: 创建字体下载脚本

**Files:**
- Create: `scripts/fonts/download.mjs`

- [ ] **Step 1: 创建下载脚本**

```js
// scripts/fonts/download.mjs
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.resolve(__dirname, 'source')

if (!fs.existsSync(sourceDir)) {
  fs.mkdirSync(sourceDir, { recursive: true })
}

const fonts = [
  {
    name: 'MaShanZheng-Regular.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/mashanzheng/MaShanZheng-Regular.ttf',
    required: true,
  },
  {
    name: 'NotoSerifSC[wght].ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf',
    required: false,
  },
  {
    name: 'NotoSansSC[wght].ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
    required: false,
  },
]

for (const { name, url, required } of fonts) {
  const dest = path.join(sourceDir, name)
  if (fs.existsSync(dest)) {
    console.log(`Already exists: ${name}`)
    continue
  }

  console.log(`Downloading: ${name}...`)
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(dest, buf)
    console.log(`  ✓ ${name} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`)
  } catch (err) {
    if (required) {
      console.error(`  ✗ Failed to download required font: ${name}`, err)
      process.exit(1)
    }
    console.log(`  ✗ Skipped optional font: ${name} (${err.message})`)
  }
}

console.log('\nDone. Files in scripts/fonts/source/:')
for (const f of fs.readdirSync(sourceDir)) {
  const stat = fs.statSync(path.join(sourceDir, f))
  console.log(`  ${f} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`)
}
```

- [ ] **Step 2: 运行下载脚本验证**

```bash
node scripts/fonts/download.mjs
```

Expected: 输出 3 个字体文件大小，`scripts/fonts/source/` 目录下有 TTF 文件

- [ ] **Step 3: Commit**

```bash
git add scripts/fonts/download.mjs
git commit -m "feat(copybook): add font download script from Google Fonts"
```

---

## Task 3: 创建 GB2312 字符表生成脚本

**Files:**
- Create: `scripts/fonts/gen-gb2312.mjs`
- Create: `scripts/fonts/gb2312-chars.txt`（由脚本生成）

- [ ] **Step 1: 创建字符表生成脚本**

> **关键修正：** 使用 `TextDecoder('gbk')` 遍历 GB2312 编码区间，精确提取 6,763 个汉字。原方案用 `U+4E00~U+9FFF`（20,992 字）是错误的。

```js
// scripts/fonts/gen-gb2312.mjs
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const destFile = path.resolve(__dirname, 'gb2312-chars.txt')

const decoder = new TextDecoder('gbk')
let chars = ''

// ASCII 可见字符 (33–126)
for (let i = 0x20; i <= 0x7E; i++) {
  chars += String.fromCodePoint(i)
}

// GB2312 汉字编码区间
// 一级汉字: 区 16–55 → GB 编码 B0A1–D7F9
// 二级汉字: 区 56–87 → GB 编码 D8A1–F7FE
for (let qu = 0xB0; qu <= 0xF7; qu++) {
  for (let wei = 0xA1; wei <= 0xFE; wei++) {
    const buf = Buffer.from([qu, wei])
    const decoded = decoder.decode(buf)
    if (/[\u4e00-\u9fff]/.test(decoded)) {
      chars += decoded
    }
  }
}

// 常用中文标点符号
chars += '，。、；：？！""''（）【】《》—…·'

fs.writeFileSync(destFile, chars, 'utf-8')

let cjkCount = 0
for (const ch of chars) {
  if (/[\u4e00-\u9fff]/.test(ch)) cjkCount++
}
console.log(`Generated ${chars.length} total characters (${cjkCount} CJK, ${chars.length - cjkCount} non-CJK)`)
console.log(`Saved to: ${destFile}`)
```

- [ ] **Step 2: 运行生成脚本**

```bash
node scripts/fonts/gen-gb2312.mjs
```

Expected: 输出 `Generated 6878 total characters (6763 CJK, 115 non-CJK)`，生成 `scripts/fonts/gb2312-chars.txt`

- [ ] **Step 3: Commit**

```bash
git add scripts/fonts/gen-gb2312.mjs scripts/fonts/gb2312-chars.txt
git commit -m "feat(copybook): add GB2312 charset generator with precise GBK decoding"
```

---

## Task 4: 创建 fontmin 子集化脚本

**Files:**
- Create: `scripts/fonts/subset.mjs`

- [ ] **Step 1: 创建子集化脚本**

```js
// scripts/fonts/subset.mjs
import Fontmin from 'fontmin'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.resolve(__dirname, 'source')
const destDir = path.resolve(__dirname, '../../src/assets/fonts')
const charFile = path.resolve(__dirname, 'gb2312-chars.txt')

const text = fs.readFileSync(charFile, 'utf-8')
let cjkCount = 0
for (const ch of text) {
  if (/[\u4e00-\u9fff]/.test(ch)) cjkCount++
}
console.log(`Loading ${text.length} characters (${cjkCount} CJK) for subsetting`)

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true })
}

const fonts = [
  { file: 'MaShanZheng-Regular.ttf', output: 'MaShanZheng-Regular', required: true },
  { file: 'NotoSerifSC[wght].ttf', output: 'NotoSerifSC-Regular', required: false },
  { file: 'NotoSansSC[wght].ttf', output: 'NotoSansSC-Regular', required: false },
]

let processed = 0
let failed = 0

for (const { file, output, required } of fonts) {
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
          if (required) {
            process.exit(1)
          }
          failed++
          resolve()
          return
        }
        const woff2 = files.find(f => f.path.endsWith('.woff2'))
        if (woff2) {
          const size = (woff2.contents.length / 1024).toFixed(0)
          console.log(`  ✓ ${path.basename(woff2.path)} (${size} KB)`)
          processed++
        }
        resolve()
      })
  })
}

console.log(`\nDone. ${processed} fonts subsetted, ${failed} failed.`)
console.log(`Output: ${destDir}`)
for (const f of fs.readdirSync(destDir).filter(f => f.endsWith('.woff2'))) {
  const stat = fs.statSync(path.join(destDir, f))
  console.log(`  ${f} (${(stat.size / 1024).toFixed(0)} KB)`)
}
```

- [ ] **Step 2: 运行子集化脚本**

```bash
node scripts/fonts/subset.mjs
```

Expected:
- MaShanZheng-Regular.woff2 (~500-800 KB)
- NotoSerifSC-Regular.woff2 (~600-1000 KB，如源字体存在)
- NotoSansSC-Regular.woff2 (~500-900 KB，如源字体存在)

> **注意：** Noto 字体为可变字体，fontmin 底层 `fonteditor-core` 会丢失变轴信息输出静态 woff2。对固定 weight 400 的字帖场景无影响。如子集化失败，可跳过 Noto 字体（使用系统 fallback）。

- [ ] **Step 3: Commit**

```bash
git add scripts/fonts/subset.mjs src/assets/fonts/
git commit -m "feat(copybook): add font subsetting script and woff2 outputs"
```

---

## Task 5: 配置 Astro font 系统

**Files:**
- Modify: `astro.config.ts`

- [ ] **Step 1: 确认字体产物存在**

```bash
ls -la src/assets/fonts/
```

Expected: 至少有 `MaShanZheng-Regular.woff2`

- [ ] **Step 2: 在 astro.config.ts 添加 fonts 配置**

在 `astro.config.ts` 中：

1. 修改 import 行，添加 `fontProviders`：

```ts
import { defineConfig, fontProviders, passthroughImageService } from 'astro/config'
```

2. 在 `defineConfig` 内部、`devToolbar` 之后添加 `fonts` 数组：

```ts
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
  ],
```

> **注意：** 仅配置 Ma Shan Zheng（必须）。Noto Serif/Sans SC 暂不配置——字体文件可选、体积较大，且可变字体子集化可能有兼容性问题。后续需要时再添加。

- [ ] **Step 3: 验证配置生效**

```bash
pnpm dev
```

在浏览器 DevTools 中检查：
- Network 面板有 `MaShanZheng-Regular.woff2` 请求
- Elements 面板 `:root` 上有 `--font-ma-shan-zheng` CSS 变量

- [ ] **Step 4: Commit**

```bash
git add astro.config.ts
git commit -m "feat(copybook): configure Astro local font provider for MaShanZheng"
```

---

## Task 6: 验证端到端字体加载

**前置条件：** 主功能计划中 Task 3（CopybookLayout.astro）已创建且包含 `<Font cssVariable="--font-ma-shan-zheng" preload />`。

- [ ] **Step 1: 确认 CopybookLayout.astro 中有 Font 组件**

检查 `src/layouts/CopybookLayout.astro` 的 `<head>` 中存在：

```astro
<Font cssVariable="--font-ma-shan-zheng" preload />
```

如果该文件尚未创建（主功能计划未执行），此步骤跳过。

- [ ] **Step 2: 在浏览器中验证字体渲染**

1. 访问 `/copybook/hanzi`（如页面已实现）
2. 打开 DevTools → Network → 确认 woff2 文件加载成功（200）
3. 在 Canvas 区域右键检查元素，确认 CSS 变量 `--font-ma-shan-zheng` 有值
4. Canvas 上的汉字应使用 Ma Shan Zheng 楷体渲染（非系统默认字体）

- [ ] **Step 3: 最终 build 验证**

```bash
pnpm run build
```

Expected: build 成功，无类型错误

---

## 操作流程总结

```
1. pnpm add -D fontmin
2. node scripts/fonts/download.mjs        下载 TTF → scripts/fonts/source/
3. node scripts/fonts/gen-gb2312.mjs      生成 GB2312 字符表
4. node scripts/fonts/subset.mjs          子集化 → src/assets/fonts/
5. astro.config.ts 配置 fontProviders.local()
6. CopybookLayout.astro 添加 <Font preload />（主功能计划 Task 3）
7. Vue Canvas 通过 CSS 变量 + document.fonts.ready 使用
```
