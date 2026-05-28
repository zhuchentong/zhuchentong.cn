# 实时字体子集化 API 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将预生成静态 woff2 字体方案替换为后端实时子集化 API，前端按需加载字体，实现零初始字体加载。

**Architecture:** 用户输入文字后，前端 debounce 500ms 调用 `GET /api/font-subset`，后端使用 fontmin 从源 TTF 实时提取所需字形生成 woff2，返回 base64。前端通过 `new FontFace()` 动态注册字体后 Canvas 重绘。LRU 缓存避免重复子集化。

**Tech Stack:** Astro SSR API Route, fontmin, Vue 3 FontFace API, LRU Cache

---

## 性能基准（已验证）

| 输入字数 | 唯一字数 | 子集化耗时 | woff2 大小 | base64 大小 |
| -------- | -------- | ---------- | ---------- | ----------- |
| 4        | 4        | 153ms      | 2.8 KB     | 3.7 KB      |
| 50       | 48       | 308ms      | 21.9 KB    | 29.2 KB     |
| 144      | 96       | 450ms      | 37.2 KB    | 49.6 KB     |

---

## 关键设计决策

1. **源字体路径：`src/assets/fonts/`**（非 `src/assets/fonts/source/`）
2. **fontmin 从 devDependencies → dependencies**（Docker 生产环境需要运行时子集化）
3. **环境感知路径解析**：开发模式用 `src/assets/fonts/`，生产模式用 `dist/fonts/`
4. **构建步骤**：astro build 后，脚本将 `src/assets/fonts/*.ttf` 复制到 `dist/fonts/`

---

## 文件结构

```
新增:
  src/config/fonts.config.ts                   ← 字体注册配置（中心化）
  src/pages/api/font-subset.ts                 ← API 端点
  src/server/font-subset-service.ts            ← 子集化服务（fontmin + LRU 缓存）
  src/composables/copybook/useFontLoader.ts    ← 前端动态字体加载 composable
  scripts/copy-fonts.mjs                       ← 构建后复制源字体到 dist/fonts/

修改:
  package.json                                  ← fontmin 从 devDeps → deps，添加 copy-fonts 脚本
  src/config/copybook.config.ts                ← FONT_FAMILIES 改用 fonts.config.ts
  src/stores/copybook.store.ts                 ← copybookFontFamily 默认值改为 font id
  src/composables/copybook/useGridRenderer.ts  ← resolveFontFamily 简化
  src/components/copybook/CanvasPreview.vue     ← 集成 useFontLoader
  src/components/copybook/FontPickerDialog.vue  ← 适配新字体配置
  src/layouts/CopybookLayout.astro              ← 移除 <Font preload />
  astro.config.ts                               ← 移除 fonts 配置
  Dockerfile                                    ← 添加复制源字体步骤
  .gitignore                                    ← 更新源字体路径
  scripts/fonts/download.mjs                    ← sourceDir 路径更新

移动:
  scripts/fonts/source/MaShanZheng-Regular.ttf → src/assets/fonts/MaShanZheng-Regular.ttf

删除:
  src/assets/fonts/MaShanZheng-Regular.woff2   ← 不再需要静态子集
  scripts/fonts/chars.txt                       ← 不再需要预生成字符表
  scripts/fonts/gb2312-chars.txt                ← 不再需要
  scripts/fonts/subset.mjs                      ← 不再需要预子集化脚本
```

---

## Task 1: 创建字体注册配置文件

**Files:**

- Create: `src/config/fonts.config.ts`

- [ ] **Step 1: 创建字体配置**

```ts
// src/config/fonts.config.ts

export interface FontConfig {
  id: string
  label: string
  sourceFile: string
  fallback: string
}

export const FONTS: FontConfig[] = [
  {
    id: 'mashanzheng',
    label: '楷体',
    sourceFile: 'MaShanZheng-Regular.ttf',
    fallback: 'KaiTi, STKaiti, serif',
  },
]

export const FONT_MAP = new Map(FONTS.map(f => [f.id, f]))

export const ALLOWED_FONT_IDS = new Set(FONTS.map(f => f.id))
```

- [ ] **Step 2: Commit**

```bash
git add src/config/fonts.config.ts
git commit -m "feat(copybook): add centralized font registry config"
```

---

## Task 2: 移动源字体到 src/assets/fonts/

**Files:**

- Move: `scripts/fonts/source/MaShanZheng-Regular.ttf` → `src/assets/fonts/MaShanZheng-Regular.ttf`
- Modify: `.gitignore`
- Modify: `scripts/fonts/download.mjs`

- [ ] **Step 1: 移动源字体**

```bash
mv scripts/fonts/source/MaShanZheng-Regular.ttf src/assets/fonts/
```

- [ ] **Step 2: 更新 .gitignore**

将现有的：

```gitignore
# font source files (large, not tracked)
scripts/fonts/source/*.ttf
```

替换为：

```gitignore
# font source files - tracked in src/assets/fonts/
```

- [ ] **Step 3: 更新 scripts/fonts/download.mjs 的 sourceDir**

将：

```js
const sourceDir = path.resolve(__dirname, 'source')
```

改为：

```js
const sourceDir = path.resolve(__dirname, '../../src/assets/fonts')
```

同时将最后的日志输出从 `scripts/fonts/source/` 改为 `src/assets/fonts/`：

```js
console.log('\nDone. Files in src/assets/fonts/:')
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore scripts/fonts/download.mjs src/assets/fonts/MaShanZheng-Regular.ttf
git commit -m "refactor(copybook): move source fonts to src/assets/fonts/"
```

---

## Task 3: 将 fontmin 从 devDependencies 移到 dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: 移动 fontmin**

在 `package.json` 中：

- 从 `devDependencies` 中删除 `"fontmin": "^1.1.1",`
- 在 `dependencies` 中添加 `"fontmin": "^1.1.1",`

- [ ] **Step 2: 验证安装**

```bash
pnpm install
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build(copybook): move fontmin to dependencies for runtime subsetting"
```

---

## Task 4: 创建后端字体子集化服务

**Files:**

- Create: `src/server/font-subset-service.ts`

- [ ] **Step 1: 创建子集化服务**

```ts
import fs from 'node:fs'
import path from 'node:path'
// src/server/font-subset-service.ts
import Fontmin from 'fontmin'
import { FONT_MAP } from '@/config/fonts.config'

const SOURCE_DIR = process.env.NODE_ENV === 'production'
  ? path.resolve(process.cwd(), 'dist/fonts')
  : path.resolve(process.cwd(), 'src/assets/fonts')

const BASE_CHARS = (() => {
  let chars = ''
  for (let i = 0x20; i <= 0x7E; i++)
    chars += String.fromCodePoint(i)
  chars += '，。、；：？！\u201C\u201D\u2018\u2019（）【】《》—…·'
  return chars
})()

interface CacheEntry {
  data: string
  timestamp: number
}

const MAX_CACHE_SIZE = 200
const cache = new Map<string, CacheEntry>()

function getCacheKey(fontId: string, text: string): string {
  const uniqueChars = [...new Set(text)].sort().join('')
  return `${fontId}:${uniqueChars}`
}

function evictCache() {
  if (cache.size <= MAX_CACHE_SIZE)
    return
  const entries = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
  for (const [key] of entries.slice(0, cache.size - MAX_CACHE_SIZE)) {
    cache.delete(key)
  }
}

function getSourceFontPath(fontId: string): string {
  const config = FONT_MAP.get(fontId)
  if (!config)
    throw new Error(`Unknown font: ${fontId}`)
  return path.join(SOURCE_DIR, config.sourceFile)
}

function subsetFont(sourcePath: string, text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    new Fontmin()
      .src(sourcePath)
      .use(Fontmin.glyph({ text, hinting: false }))
      .use(Fontmin.ttf2woff2())
      .run((err: Error | null, files: { path: string, contents: Buffer }[]) => {
        if (err) {
          reject(err)
          return
        }
        const woff2 = files.find(f => f.path.endsWith('.woff2'))
        if (!woff2) {
          reject(new Error('woff2 output not found'))
          return
        }
        resolve(woff2.contents)
      })
  })
}

export async function getFontSubsetBase64(fontId: string, text: string): Promise<string> {
  const key = getCacheKey(fontId, text)
  const cached = cache.get(key)
  if (cached) {
    cached.timestamp = Date.now()
    return cached.data
  }

  const sourcePath = getSourceFontPath(fontId)
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source font file not found: ${sourcePath}`)
  }

  const fullText = BASE_CHARS + text
  const woff2Buf = await subsetFont(sourcePath, fullText)
  const base64 = `data:font/woff2;base64,${woff2Buf.toString('base64')}`

  cache.set(key, { data: base64, timestamp: Date.now() })
  evictCache()

  return base64
}
```

**关键设计：** `SOURCE_DIR` 根据 `NODE_ENV` 区分路径：

- 开发模式：`<project-root>/src/assets/fonts/`（源码目录）
- 生产模式：`<project-root>/dist/fonts/`（构建产物，由 scripts/copy-fonts.mjs 复制）

- [ ] **Step 2: Commit**

```bash
git add src/server/font-subset-service.ts
git commit -m "feat(copybook): add server-side font subsetting service with LRU cache"
```

---

## Task 5: 创建 API 端点

**Files:**

- Create: `src/pages/api/font-subset.ts`

- [ ] **Step 1: 创建 API Route**

```ts
// src/pages/api/font-subset.ts
import type { APIRoute } from 'astro'
import { ALLOWED_FONT_IDS } from '@/config/fonts.config'
import { getFontSubsetBase64 } from '@/server/font-subset-service'

const MAX_TEXT_LENGTH = 2000

export const GET: APIRoute = async ({ url }) => {
  const text = url.searchParams.get('text') || ''
  const fontId = url.searchParams.get('font') || 'mashanzheng'

  if (!text.trim()) {
    return new Response(JSON.stringify({ error: 'text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return new Response(JSON.stringify({ error: `text too long (max ${MAX_TEXT_LENGTH})` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!ALLOWED_FONT_IDS.has(fontId)) {
    return new Response(JSON.stringify({ error: 'unsupported font' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const data = await getFontSubsetBase64(fontId, text)
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }
  catch (err: any) {
    console.error('Font subset error:', err)
    return new Response(JSON.stringify({ error: 'font subsetting failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

- [ ] **Step 2: 验证 API**

```bash
pnpm dev
# 在另一个终端:
curl -s "http://localhost:4321/api/font-subset?text=你好世界&font=mashanzheng" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('OK:', 'data' in d)
print('Base64 length:', len(d.get('data', '')))
"
```

Expected: `OK: True`, base64 长度 ~5,000 字符

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/font-subset.ts
git commit -m "feat(copybook): add font subset API endpoint"
```

---

## Task 6: 创建前端 useFontLoader composable

**Files:**

- Create: `src/composables/copybook/useFontLoader.ts`

- [ ] **Step 1: 创建 composable**

```ts
// src/composables/copybook/useFontLoader.ts
import { useStore } from '@nanostores/vue'
import { ref, watch } from 'vue'
import { FONT_MAP } from '@/config/fonts.config'
import { copybookFontFamily, copybookText } from '@/stores/copybook.store'

const loadedFonts = new Map<string, string>()
let fontCounter = 0

export function useFontLoader() {
  const text = useStore(copybookText)
  const fontFamily = useStore(copybookFontFamily)

  const fontLoaded = ref(false)
  const resolvedFontName = ref('serif')
  const loading = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let currentLoadId = 0

  async function loadFont(inputText: string, fontId: string) {
    if (!inputText.trim()) {
      const config = FONT_MAP.get(fontId)
      resolvedFontName.value = config?.fallback ?? 'serif'
      fontLoaded.value = false
      return
    }

    const cacheKey = `${fontId}:${[...new Set(inputText)].sort().join('')}`
    if (loadedFonts.has(cacheKey)) {
      resolvedFontName.value = loadedFonts.get(cacheKey)!
      fontLoaded.value = true
      return
    }

    loading.value = true
    const loadId = ++currentLoadId

    try {
      const params = new URLSearchParams({ text: inputText, font: fontId })
      const res = await fetch(`/api/font-subset?${params}`)
      if (!res.ok)
        throw new Error(`API error: ${res.status}`)
      const { data } = await res.json()

      if (loadId !== currentLoadId)
        return

      const fontFaceName = `CopybookSubset_${fontCounter++}`
      const fontFace = new FontFace(fontFaceName, `url(${data})`)
      const loaded = await fontFace.load()
      document.fonts.add(loaded)

      resolvedFontName.value = fontFaceName
      loadedFonts.set(cacheKey, fontFaceName)
      fontLoaded.value = true
    }
    catch (err) {
      console.error('Font load error:', err)
      const config = FONT_MAP.get(fontId)
      resolvedFontName.value = config?.fallback ?? 'serif'
      fontLoaded.value = false
    }
    finally {
      if (loadId === currentLoadId)
        loading.value = false
    }
  }

  watch([text, fontFamily], ([newText, newFont]) => {
    if (debounceTimer)
      clearTimeout(debounceTimer)
    fontLoaded.value = false
    debounceTimer = setTimeout(() => {
      loadFont(newText, newFont)
    }, 500)
  }, { immediate: true })

  return { fontLoaded, resolvedFontName, loading }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/composables/copybook/useFontLoader.ts
git commit -m "feat(copybook): add useFontLoader composable with debounce and cache"
```

---

## Task 7: 更新 Store 和 Config

**Files:**

- Modify: `src/stores/copybook.store.ts`
- Modify: `src/config/copybook.config.ts`

- [ ] **Step 1: 更新 copybook.store.ts**

将第 10 行：

```ts
export const copybookFontFamily = atom<string>('--font-ma-shan-zheng')
```

改为：

```ts
export const copybookFontFamily = atom<string>('mashanzheng')
```

- [ ] **Step 2: 更新 copybook.config.ts 的 FONT_FAMILIES**

将第 15-19 行的 `FONT_FAMILIES` 替换为：

```ts
import { FONTS } from './fonts.config'

export const FONT_FAMILIES = FONTS.map(f => ({
  label: f.label,
  id: f.id,
  fallback: f.fallback,
}))
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/copybook.store.ts src/config/copybook.config.ts
git commit -m "refactor(copybook): use font id in store and config"
```

---

## Task 8: 更新 Canvas 渲染和 CanvasPreview

**Files:**

- Modify: `src/composables/copybook/useGridRenderer.ts` (第 112-120 行)
- Modify: `src/components/copybook/CanvasPreview.vue`

- [ ] **Step 1: 简化 resolveFontFamily**

将 `src/composables/copybook/useGridRenderer.ts` 第 112-120 行：

```ts
function resolveFontFamily(cssVariableOrName: string): string {
  if (cssVariableOrName.startsWith('--')) {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(cssVariableOrName)
      .trim()
    return value || 'serif'
  }
  return cssVariableOrName
}
```

替换为：

```ts
function resolveFontFamily(fontName: string): string {
  return fontName || 'serif'
}
```

- [ ] **Step 2: 更新 CanvasPreview.vue**

在现有 `<script setup>` 中：

1. 添加 import：

```ts
import { useFontLoader } from '@/composables/copybook/useFontLoader'
```

2. 移除 `fontFamily` store 的引用（第 30 行 `const fontFamily = useStore(copybookFontFamily)`）

3. 添加 useFontLoader 调用：

```ts
const { fontLoaded, resolvedFontName } = useFontLoader()
```

4. 在 `draw()` 函数中，将 `fontFamily: fontFamily.value` 改为 `fontFamily: resolvedFontName.value`

5. 保留 `copybookText` store 的引用（用于传给 renderGrid）

- [ ] **Step 3: Commit**

```bash
git add src/composables/copybook/useGridRenderer.ts src/components/copybook/CanvasPreview.vue
git commit -m "feat(copybook): integrate useFontLoader into CanvasPreview"
```

---

## Task 9: 更新 FontPickerDialog

**Files:**

- Modify: `src/components/copybook/FontPickerDialog.vue`

- [ ] **Step 1: 更新模板和逻辑**

主要改动：

1. `FONT_FAMILIES` 现在包含 `id` 而非 `cssVariable`
2. `select()` 参数改为 `item.id`
3. `v-for :key` 改为 `item.id`
4. `getPreviewStyle` 使用 `item.fallback` 而非 CSS 变量
5. 比较条件 `fontFamily === item.cssVariable` 改为 `fontFamily === item.id`

具体替换：

- 第 16 行 `function select(cssVariable: string)` → `function select(id: string)`
- 第 17 行 `fontFamily.value = cssVariable` → `fontFamily.value = id`
- 第 30-33 行 `getPreviewStyle` 改为 `fontFamily: item.fallback`
- 第 49 行 `:key="item.cssVariable"` → `:key="item.id"`
- 第 52 行 `fontFamily === item.cssVariable` → `fontFamily === item.id`（两处）
- 第 53 行 `@click="select(item.cssVariable)"` → `@click="select(item.id)"`

- [ ] **Step 2: Commit**

```bash
git add src/components/copybook/FontPickerDialog.vue
git commit -m "refactor(copybook): update FontPickerDialog to use font id"
```

---

## Task 10: 清理静态字体配置

**Files:**

- Modify: `src/layouts/CopybookLayout.astro`
- Modify: `astro.config.ts`

- [ ] **Step 1: 移除 CopybookLayout.astro 中的 Font 组件**

删除第 5 行 `import { Font } from 'astro:assets'`
删除第 30 行 `<Font cssVariable="--font-ma-shan-zheng" preload />`

- [ ] **Step 2: 移除 astro.config.ts 中的 fonts 配置**

1. import 行从 `import { defineConfig, fontProviders, passthroughImageService } from 'astro/config'` 改回 `import { defineConfig, passthroughImageService } from 'astro/config'`
2. 删除 `defineConfig` 中的整个 `fonts` 数组（约 15 行）

- [ ] **Step 3: 删除静态产物和废弃文件**

```bash
rm -f src/assets/fonts/MaShanZheng-Regular.woff2
rm -f scripts/fonts/chars.txt
rm -f scripts/fonts/gb2312-chars.txt
rm -f scripts/fonts/subset.mjs
```

- [ ] **Step 4: 验证构建**

```bash
pnpm run build
```

Expected: 构建成功

- [ ] **Step 5: Commit**

```bash
git add src/layouts/CopybookLayout.astro astro.config.ts src/assets/fonts/ scripts/fonts/
git commit -m "refactor(copybook): remove static font config, switch to real-time subsetting"
```

---

## Task 11: 添加构建步骤（复制源字体到 dist）

**Files:**

- Create: `scripts/copy-fonts.mjs`
- Modify: `package.json`（build 脚本）
- Modify: `Dockerfile`

- [ ] **Step 1: 创建复制脚本**

```js
// scripts/copy-fonts.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../src/assets/fonts')
const destDir = path.resolve(__dirname, '../dist/fonts')

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true })
}

let copied = 0
for (const file of fs.readdirSync(srcDir)) {
  if (!file.endsWith('.ttf'))
    continue
  const src = path.join(srcDir, file)
  const dest = path.join(destDir, file)
  fs.copyFileSync(src, dest)
  const size = (fs.statSync(dest).size / 1024 / 1024).toFixed(1)
  console.log(`  Copied: ${file} (${size} MB)`)
  copied++
}
console.log(`\nDone. ${copied} font files copied to dist/fonts/`)
```

- [ ] **Step 2: 更新 package.json build 脚本**

将：

```json
"build": "astro check && astro build"
```

改为：

```json
"build": "astro check && astro build && node scripts/copy-fonts.mjs"
```

- [ ] **Step 3: 验证**

```bash
pnpm run build
ls -la dist/fonts/
```

Expected: `dist/fonts/MaShanZheng-Regular.ttf` 存在

- [ ] **Step 4: Commit**

```bash
git add scripts/copy-fonts.mjs package.json
git commit -m "build(copybook): add copy-fonts build step for production TTF access"
```

---

## Task 12: 端到端验证

- [ ] **Step 1: 测试 API（开发模式）**

```bash
pnpm dev
# 另一终端:
curl -s "http://localhost:4321/api/font-subset?text=你好世界&font=mashanzheng" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('Success:', 'data' in d)
print('Base64 length:', len(d.get('data', '')))
"
```

- [ ] **Step 2: 测试页面**

1. 访问 `/copybook/hanzi`
2. DevTools Network → 筛选 `font-subset` → 应有 200 响应
3. Canvas 使用楷体渲染
4. 修改文字 → 500ms 后新请求 → Canvas 重绘

- [ ] **Step 3: 测试生产构建**

```bash
pnpm run build
NODE_ENV=production node ./dist/server/entry.mjs
# 另一终端:
curl -s "http://localhost:4000/api/font-subset?text=你好世界&font=mashanzheng" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('Success:', 'data' in d)
print('Base64 length:', len(d.get('data', '')))
"
```

- [ ] **Step 4: Lint + Build**

```bash
npx eslint --fix .
pnpm run build
```
