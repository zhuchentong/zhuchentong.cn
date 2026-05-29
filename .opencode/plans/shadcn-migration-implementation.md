# shadcn-vue → shadcn 迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目从 shadcn-vue (Vue + reka-ui) 迁移到官方 shadcn (React TSX + radix-ui)，所有 Vue island 组件改为 React 组件。

**Architecture:** 5 阶段渐进式迁移：基础设施 → 简单 widget → 导航 widget → copybook → 清理。每阶段 build 验证。

**Tech Stack:** React, @astrojs/react, shadcn, radix-ui, @nanostores/react, @iconify/react

---

## 文件结构总览

### 需要创建的文件

```
src/components/widgets/Icon.tsx
src/components/widgets/ThemeToggle.tsx
src/components/widgets/Test.tsx
src/components/widgets/MobileMenu.tsx
src/components/widgets/NavMenu.tsx
src/components/copybook/ColorPickerDialog.tsx
src/components/copybook/FontPickerDialog.tsx
src/components/copybook/TextInputDialog.tsx
src/components/copybook/MarginDialog.tsx
src/components/copybook/ExportButton.tsx
src/components/copybook/ControlPanel.tsx
src/components/copybook/CanvasPreview.tsx
src/hooks/copybook/useFontLoader.ts
```

### 需要修改的文件

```
astro.config.ts                          — 添加 @astrojs/react 集成
src/styles/globals.css                   — 清理重复导入
src/components/layouts/HeaderLogo.astro  — Icon.vue → Icon.tsx
src/components/layouts/Footer.astro      — Icon.vue → Icon.tsx
src/components/layouts/HeaderAction.astro — MobileMenu.vue/ThemeToggle.vue → .tsx
src/components/layouts/HeaderMenu.astro  — NavMenu.vue → NavMenu.tsx
src/pages/demo/icon.astro               — Icon.vue → Icon.tsx
src/pages/demo/component.astro          — Test.vue → Test.tsx
src/pages/copybook/hanzi.astro          — 指令 vue → react
```

### 需要删除的文件

```
src/components/widgets/Icon.vue
src/components/widgets/ThemeToggle.vue
src/components/widgets/Test.vue
src/components/widgets/MobileMenu.vue
src/components/widgets/NavMenu.vue
src/components/copybook/ControlPanel.vue
src/components/copybook/CanvasPreview.vue
src/components/copybook/TextInputDialog.vue
src/components/copybook/ColorPickerDialog.vue
src/components/copybook/FontPickerDialog.vue
src/components/copybook/MarginDialog.vue
src/components/copybook/ExportButton.vue
src/composables/copybook/useFontLoader.ts
src/pages/_app.ts
```

---

## Phase 1 — 基础设施层

### Task 1.1: 安装 React 依赖

**Files:**

- Modify: `package.json`

- [ ] **Step 1:** 安装 React 及相关依赖

```bash
pnpm add react react-dom @astrojs/react @nanostores/react @iconify/react
```

- [ ] **Step 2:** 安装 React 类型声明

```bash
pnpm add -D @types/react @types/react-dom
```

- [ ] **Step 3:** 验证安装

```bash
pnpm list react react-dom @astrojs/react @nanostores/react @iconify/react
```

### Task 1.2: 配置 Astro React 集成

**Files:**

- Modify: `astro.config.ts`

- [ ] **Step 1:** 添加 `@astrojs/react` 导入和集成

```typescript
import react from '@astrojs/react'
import Vue from '@astrojs/vue'

export default defineConfig({
  integrations: [
    react(), // 添加在 Vue 前面
    Vue({ jsx: true, appEntrypoint: '/src/pages/_app' }),
  ],
})
```

- [ ] **Step 2:** 清理 `globals.css` 重复导入

移除 `src/styles/globals.css` 第 2 行（保留第 3 行双引号版本）：

```css
/* 删除这行 */
@import 'tw-animate-css';
```

- [ ] **Step 3:** 运行 `pnpm run build` 验证构建通过

### Task 1.3: 生成 shadcn React UI 组件

- [ ] **Step 1:** 使用 shadcn CLI 生成 8 个组件

```bash
pnpm dlx shadcn@latest add dialog dropdown-menu label navigation-menu select sheet slider switch
```

- [ ] **Step 2:** 验证文件已生成

```bash
ls src/components/ui/*.tsx
```

期望输出：button.tsx dialog.tsx dropdown-menu.tsx label.tsx navigation-menu.tsx select.tsx sheet.tsx slider.tsx switch.tsx

- [ ] **Step 3:** 运行 `pnpm run build` 验证构建通过

---

## Phase 2 — 简单 Widget 迁移

### Task 2.1: Icon.vue → Icon.tsx

**Files:**

- Create: `src/components/widgets/Icon.tsx`
- Delete: `src/components/widgets/Icon.vue`
- Modify: `src/components/layouts/HeaderLogo.astro` (import 路径)
- Modify: `src/components/layouts/Footer.astro` (import 路径)
- Modify: `src/pages/demo/icon.astro` (import 路径)

- [ ] **Step 1:** 创建 `src/components/widgets/Icon.tsx`

```tsx
import { Icon as IconifyIcon } from '@iconify/react'

interface Props {
  icon: string
  class?: string
}

export default function Icon({ icon, class: className }: Props) {
  return <IconifyIcon icon={icon} className={className} />
}
```

- [ ] **Step 2:** 更新 `src/components/layouts/HeaderLogo.astro`

```diff
- import Icon from '@/components/widgets/Icon.vue'
+ import Icon from '@/components/widgets/Icon.tsx'
```

`client:load` 不变（React 组件同样使用 `client:load`）。

- [ ] **Step 3:** 更新 `src/components/layouts/Footer.astro`

```diff
- import Icon from '@/components/widgets/Icon.vue'
+ import Icon from '@/components/widgets/Icon.tsx'
```

- [ ] **Step 4:** 更新 `src/pages/demo/icon.astro`

```diff
- import Icon from '@/components/widgets/Icon.vue'
+ import Icon from '@/components/widgets/Icon.tsx'
```

- [ ] **Step 5:** 删除 `src/components/widgets/Icon.vue`

- [ ] **Step 6:** 运行 `pnpm run build` 验证

### Task 2.2: ThemeToggle.vue → ThemeToggle.tsx

**Files:**

- Create: `src/components/widgets/ThemeToggle.tsx`
- Delete: `src/components/widgets/ThemeToggle.vue`
- Modify: `src/components/layouts/HeaderAction.astro`

- [ ] **Step 1:** 创建 `src/components/widgets/ThemeToggle.tsx`

```tsx
import { Icon } from '@iconify/react'
import { useStore } from '@nanostores/react'
import * as AppStore from '@/stores/app.store'

export default function ThemeToggle() {
  const theme = useStore(AppStore.theme)

  function onToggleTheme() {
    const value = theme === 'dark' ? 'light' : 'dark'
    AppStore.updateTheme(value)
  }

  return (
    <div className="cursor-pointer" onClick={onToggleTheme}>
      {theme === 'dark'
        ? <Icon icon="icon-park-outline:moon" className="text-[16px]" />
        : <Icon icon="icon-park-outline:sun-one" className="text-[16px]" />}
    </div>
  )
}
```

- [ ] **Step 2:** 更新 `src/components/layouts/HeaderAction.astro`

```diff
- import ThemeToggle from '@/components/widgets/ThemeToggle.vue'
+ import ThemeToggle from '@/components/widgets/ThemeToggle.tsx'
```

```diff
- <ThemeToggle client:only="vue" />
+ <ThemeToggle client:only="react" />
```

- [ ] **Step 3:** 删除 `src/components/widgets/ThemeToggle.vue`

- [ ] **Step 4:** 运行 `pnpm run build` 验证

### Task 2.3: Test.vue → Test.tsx

**Files:**

- Create: `src/components/widgets/Test.tsx`
- Delete: `src/components/widgets/Test.vue`
- Modify: `src/pages/demo/component.astro`

- [ ] **Step 1:** 创建 `src/components/widgets/Test.tsx`

```tsx
import { useEffect, useState } from 'react'

export default function Test() {
  const [counter, setCounter] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="text-red">
      Counter: -
      {' '}
      {counter}
    </div>
  )
}
```

- [ ] **Step 2:** 更新 `src/pages/demo/component.astro`

```diff
- import Test from '@/components/widgets/Test.vue'
+ import Test from '@/components/widgets/Test.tsx'
```

更新页面中的文档文本（Vue → React）。

- [ ] **Step 3:** 删除 `src/components/widgets/Test.vue`

- [ ] **Step 4:** 运行 `pnpm run build` 验证

---

## Phase 3 — 导航 Widget 迁移

### Task 3.1: MobileMenu.vue → MobileMenu.tsx

**Files:**

- Create: `src/components/widgets/MobileMenu.tsx`
- Delete: `src/components/widgets/MobileMenu.vue`
- Modify: `src/components/layouts/HeaderAction.astro`

- [ ] **Step 1:** 创建 `src/components/widgets/MobileMenu.tsx`

```tsx
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface NavBarItem {
  text: string
  link?: string
  children?: NavBarItem[]
}

interface Props {
  items: NavBarItem[]
}

export default function MobileMenu({ items }: Props) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>菜单</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 p-4">
          {items.map(item => (
            <div key={item.text}>
              {item.link
                ? (
                    <a href={item.link} className="block px-3 py-2 rounded-md hover:bg-accent">
                      {item.text}
                    </a>
                  )
                : (
                    <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                      {item.text}
                    </div>
                  )}
              {item.children?.map(child => (
                <a
                  key={child.text}
                  href={child.link}
                  className="block px-6 py-2 rounded-md hover:bg-accent text-sm"
                >
                  {child.text}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2:** 更新 `src/components/layouts/HeaderAction.astro`

```diff
- import MobileMenu from '@/components/widgets/MobileMenu.vue'
+ import MobileMenu from '@/components/widgets/MobileMenu.tsx'
```

- [ ] **Step 3:** 删除 `src/components/widgets/MobileMenu.vue`

- [ ] **Step 4:** 运行 `pnpm run build` 验证

### Task 3.2: NavMenu.vue → NavMenu.tsx

**Files:**

- Create: `src/components/widgets/NavMenu.tsx`
- Delete: `src/components/widgets/NavMenu.vue`
- Modify: `src/components/layouts/HeaderMenu.astro`

- [ ] **Step 1:** 创建 `src/components/widgets/NavMenu.tsx`

```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

interface NavBarItem {
  text: string
  link?: string
  children?: NavBarItem[]
}

interface Props {
  items: NavBarItem[]
}

export default function NavMenu({ items }: Props) {
  return (
    <NavigationMenu className="flex-auto">
      <NavigationMenuList>
        {items.map(item => (
          <NavigationMenuItem key={item.text}>
            {item.children?.length
              ? (
                  <>
                    <NavigationMenuTrigger>{item.text}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      {item.children.map(child => (
                        <NavigationMenuLink
                          key={child.text}
                          href={child.link}
                          className={navigationMenuTriggerStyle()}
                        >
                          {child.text}
                        </NavigationMenuLink>
                      ))}
                    </NavigationMenuContent>
                  </>
                )
              : (
                  <NavigationMenuLink href={item.link} className={navigationMenuTriggerStyle()}>
                    {item.text}
                  </NavigationMenuLink>
                )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
```

- [ ] **Step 2:** 更新 `src/components/layouts/HeaderMenu.astro`

```diff
- import NavMenu from '@/components/widgets/NavMenu.vue'
+ import NavMenu from '@/components/widgets/NavMenu.tsx'
```

- [ ] **Step 3:** 删除 `src/components/widgets/NavMenu.vue`

- [ ] **Step 4:** 运行 `pnpm run build` 验证

---

## Phase 4 — Copybook 全量迁移

### Task 4.1: useFontLoader Vue composable → React hook

**Files:**

- Create: `src/hooks/copybook/useFontLoader.ts`
- Read reference: `src/composables/copybook/useFontLoader.ts`

- [ ] **Step 1:** 创建 `src/hooks/copybook/useFontLoader.ts`

```typescript
import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { FONT_FAMILIES } from '@/config/copybook.config'
import { copybookFontFamily, copybookText } from '@/stores/copybook.store'

const fontCache = new Map<string, string>()

export function useFontLoader() {
  const text = useStore(copybookText)
  const fontFamily = useStore(copybookFontFamily)
  const [resolvedFontName, setResolvedFontName] = useState<string>(fontFamily)

  useEffect(() => {
    if (!text)
      return

    const font = FONT_FAMILIES.find(f => f.id === fontFamily)
    if (!font)
      return

    let cancelled = false
    const timeout = setTimeout(async () => {
      const cacheKey = `${fontFamily}:${text}`
      const cached = fontCache.get(cacheKey)
      if (cached) {
        if (!cancelled)
          setResolvedFontName(cached)
        return
      }

      try {
        const res = await fetch(`/api/font-subset?text=${encodeURIComponent(text)}&font=${fontFamily}`)
        const { data } = await res.json()
        const fontFace = new FontFace(fontFamily, `url(${data})`)
        await fontFace.load()
        document.fonts.add(fontFace)
        fontCache.set(cacheKey, fontFamily)
        if (!cancelled)
          setResolvedFontName(fontFamily)
      }
      catch (e) {
        console.error('Font loading failed:', e)
        if (!cancelled)
          setResolvedFontName(font.fallback)
      }
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [text, fontFamily])

  return resolvedFontName
}
```

- [ ] **Step 2:** 运行 `pnpm run build` 验证 TypeScript 无错误

### Task 4.2: ColorPickerDialog.vue → ColorPickerDialog.tsx

**Files:**

- Create: `src/components/copybook/ColorPickerDialog.tsx`
- Delete: `src/components/copybook/ColorPickerDialog.vue`

- [ ] **Step 1:** 创建 `src/components/copybook/ColorPickerDialog.tsx`

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { COLOR_PALETTE } from '@/config/copybook.config'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedColor: string
  onSelect: (color: string) => void
}

export default function ColorPickerDialog({ open, onOpenChange, selectedColor, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>选择颜色</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {COLOR_PALETTE.map(group => (
            <div key={group.name}>
              <div className="text-sm text-muted-foreground mb-2">{group.name}</div>
              <div className="flex flex-wrap gap-2">
                {group.colors.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-md border-2 ${selectedColor === color ? 'border-primary' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => { onSelect(color); onOpenChange(false) }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2:** 删除 `src/components/copybook/ColorPickerDialog.vue`

### Task 4.3: FontPickerDialog.vue → FontPickerDialog.tsx

**Files:**

- Create: `src/components/copybook/FontPickerDialog.tsx`
- Delete: `src/components/copybook/FontPickerDialog.vue`

- [ ] **Step 1:** 创建 `src/components/copybook/FontPickerDialog.tsx`

```tsx
import { useStore } from '@nanostores/react'
import { Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FONT_FAMILIES } from '@/config/copybook.config'
import { copybookFontFamily } from '@/stores/copybook.store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function FontPickerDialog({ open, onOpenChange }: Props) {
  const fontFamily = useStore(copybookFontFamily)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>选择字体</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {FONT_FAMILIES.map(font => (
            <button
              key={font.id}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-left"
              onClick={() => copybookFontFamily.set(font.id)}
            >
              <span style={{ fontFamily: font.fallback }}>{font.name}</span>
              {fontFamily === font.id && <Check className="ml-auto size-4" />}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2:** 删除 `src/components/copybook/FontPickerDialog.vue`

### Task 4.4: TextInputDialog.vue → TextInputDialog.tsx

**Files:**

- Create: `src/components/copybook/TextInputDialog.tsx`
- Delete: `src/components/copybook/TextInputDialog.vue`

- [ ] **Step 1:** 创建 `src/components/copybook/TextInputDialog.tsx`

```tsx
import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { copybookText } from '@/stores/copybook.store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TextInputDialog({ open, onOpenChange }: Props) {
  const text = useStore(copybookText)
  const [localText, setLocalText] = useState(text)

  useEffect(() => {
    if (open)
      setLocalText(text)
  }, [open, text])

  function onConfirm() {
    copybookText.set(localText)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>输入练习文字</DialogTitle>
        </DialogHeader>
        <textarea
          className="w-full h-40 p-3 rounded-md border border-input bg-background resize-none"
          value={localText}
          onChange={e => setLocalText(e.target.value)}
          placeholder="请输入要练习的汉字..."
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onConfirm}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2:** 删除 `src/components/copybook/TextInputDialog.vue`

### Task 4.5: MarginDialog.vue → MarginDialog.tsx

**Files:**

- Create: `src/components/copybook/MarginDialog.tsx`
- Delete: `src/components/copybook/MarginDialog.vue`

- [ ] **Step 1:** 创建 `src/components/copybook/MarginDialog.tsx`

```tsx
import { useStore } from '@nanostores/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { DEFAULT_MARGIN } from '@/config/copybook.config'
import { copybookMargin } from '@/stores/copybook.store'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function MarginDialog({ open, onOpenChange }: Props) {
  const margin = useStore(copybookMargin)

  function updateMargin(key: keyof typeof margin, value: number) {
    copybookMargin.set({ ...margin, [key]: value })
  }

  function onReset() {
    copybookMargin.set({ ...DEFAULT_MARGIN })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>页面边距</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {(['top', 'right', 'bottom', 'left'] as const).map(side => (
            <div key={side} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{({ top: '上', right: '右', bottom: '下', left: '左' })[side]}</span>
                <span>
                  {margin[side]}
                  px
                </span>
              </div>
              <Slider
                min={10}
                max={100}
                value={[margin[side]]}
                onValueChange={([v]) => updateMargin(side, v)}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onReset}>重置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2:** 删除 `src/components/copybook/MarginDialog.vue`

### Task 4.6: ExportButton.vue → ExportButton.tsx

**Files:**

- Create: `src/components/copybook/ExportButton.tsx`
- Delete: `src/components/copybook/ExportButton.vue`

- [ ] **Step 1:** 创建 `src/components/copybook/ExportButton.tsx`

```tsx
import { useStore } from '@nanostores/react'
import { Download, FileImage, Printer } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportPDF, exportPNG } from '@/composables/copybook/useExport'
import { copybookFontFamily, copybookFontOffsetY, copybookFontSize, copybookFontWeight, copybookGridSize, copybookGridType, copybookHighlightFirst, copybookInsertEmptyCol, copybookInsertEmptyRow, copybookLineColor, copybookMargin, copybookRowGap, copybookText, copybookTraceColor, copybookTraceCount } from '@/stores/copybook.store'

export default function ExportButton({ getCanvas }: { getCanvas: () => HTMLCanvasElement | null }) {
  const [loading, setLoading] = useState(false)
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

  async function onExportPDF() {
    setLoading(true)
    try {
      await exportPDF(getParams())
    }
    finally {
      setLoading(false)
    }
  }

  function onExportPNG() {
    exportPNG(getParams())
  }

  function onPrint() {
    window.print()
  }

  function getParams() {
    return { text, gridType, gridSize, rowGap, margin, fontFamily, fontWeight, fontSize, fontOffsetY, traceCount, traceColor, lineColor, highlightFirst, insertEmptyRow, insertEmptyCol, getCanvas }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading
            ? '导出中...'
            : (
                <>
                  <Download className="size-4 mr-2" />
                  {' '}
                  导出
                </>
              )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onExportPDF}>
          <FileImage className="size-4 mr-2" />
          {' '}
          导出 PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPNG}>
          <FileImage className="size-4 mr-2" />
          {' '}
          导出 PNG
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onPrint}>
          <Printer className="size-4 mr-2" />
          {' '}
          打印
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 2:** 删除 `src/components/copybook/ExportButton.vue`

### Task 4.7: ControlPanel.vue → ControlPanel.tsx

**Files:**

- Create: `src/components/copybook/ControlPanel.tsx`
- Delete: `src/components/copybook/ControlPanel.vue`

- [ ] **Step 1:** 创建 `src/components/copybook/ControlPanel.tsx`

```tsx
import { useStore } from '@nanostores/react'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { FONT_WEIGHTS, GRID_TYPES } from '@/config/copybook.config'
import { copybookFontFamily, copybookFontOffsetY, copybookFontSize, copybookFontWeight, copybookGridSize, copybookGridType, copybookHighlightFirst, copybookInsertEmptyCol, copybookInsertEmptyRow, copybookLineColor, copybookRowGap, copybookText, copybookTraceColor, copybookTraceCount } from '@/stores/copybook.store'
import ColorPickerDialog from './ColorPickerDialog'
import ExportButton from './ExportButton'
import FontPickerDialog from './FontPickerDialog'
import MarginDialog from './MarginDialog'
import TextInputDialog from './TextInputDialog'

export default function ControlPanel({ getCanvas }: { getCanvas: () => HTMLCanvasElement | null }) {
  const gridType = useStore(copybookGridType)
  const gridSize = useStore(copybookGridSize)
  const rowGap = useStore(copybookRowGap)
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

  const [textDialogOpen, setTextDialogOpen] = useState(false)
  const [fontDialogOpen, setFontDialogOpen] = useState(false)
  const [marginDialogOpen, setMarginDialogOpen] = useState(false)
  const [traceColorOpen, setTraceColorOpen] = useState(false)
  const [lineColorOpen, setLineColorOpen] = useState(false)

  return (
    <div className="space-y-6 p-4">
      {/* 文本 */}
      <div>
        <Label>练习文字</Label>
        <button
          className="mt-1 w-full text-left px-3 py-2 rounded-md border border-input hover:bg-accent"
          onClick={() => setTextDialogOpen(true)}
        >
          {copybookText.get() || '点击输入文字...'}
        </button>
      </div>

      {/* 显示 */}
      <div className="space-y-3">
        <Label>显示</Label>
        <div className="flex items-center justify-between">
          <span className="text-sm">高亮首字</span>
          <Switch checked={highlightFirst} onCheckedChange={v => copybookHighlightFirst.set(v)} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">插入空行</span>
          <Switch checked={insertEmptyRow} onCheckedChange={v => copybookInsertEmptyRow.set(v)} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">插入空列</span>
          <Switch checked={insertEmptyCol} onCheckedChange={v => copybookInsertEmptyCol.set(v)} />
        </div>
      </div>

      {/* 方格 */}
      <div className="space-y-3">
        <Label>方格</Label>
        <Select value={gridType} onValueChange={v => copybookGridType.set(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {GRID_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div>
          <div className="flex justify-between text-sm">
            <span>格子大小</span>
            <span>
              {gridSize}
              mm
            </span>
          </div>
          <Slider min={5} max={30} value={[gridSize]} onValueChange={([v]) => copybookGridSize.set(v)} />
        </div>
        <div>
          <div className="flex justify-between text-sm">
            <span>行间距</span>
            <span>
              {rowGap}
              mm
            </span>
          </div>
          <Slider min={0} max={10} value={[rowGap]} onValueChange={([v]) => copybookRowGap.set(v)} />
        </div>
        <button
          className="text-sm text-primary underline"
          onClick={() => setMarginDialogOpen(true)}
        >
          调整边距
        </button>
      </div>

      {/* 字体 */}
      <div className="space-y-3">
        <Label>字体</Label>
        <button
          className="w-full text-left px-3 py-2 rounded-md border border-input hover:bg-accent"
          onClick={() => setFontDialogOpen(true)}
        >
          {fontFamily}
        </button>
        <Select value={fontWeight} onValueChange={v => copybookFontWeight.set(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {FONT_WEIGHTS.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div>
          <div className="flex justify-between text-sm">
            <span>字号</span>
            <span>{fontSize}</span>
          </div>
          <Slider min={20} max={120} value={[fontSize]} onValueChange={([v]) => copybookFontSize.set(v)} />
        </div>
        <div>
          <div className="flex justify-between text-sm">
            <span>垂直偏移</span>
            <span>{fontOffsetY}</span>
          </div>
          <Slider min={-50} max={50} value={[fontOffsetY]} onValueChange={([v]) => copybookFontOffsetY.set(v)} />
        </div>
      </div>

      {/* 描红 */}
      <div className="space-y-3">
        <Label>描红</Label>
        <div>
          <div className="flex justify-between text-sm">
            <span>描红次数</span>
            <span>{traceCount}</span>
          </div>
          <Slider min={0} max={50} value={[traceCount]} onValueChange={([v]) => copybookTraceCount.set(v)} />
        </div>
        <div className="flex gap-2">
          <button
            className="w-8 h-8 rounded-md border"
            style={{ backgroundColor: traceColor }}
            onClick={() => setTraceColorOpen(true)}
          />
          <button
            className="w-8 h-8 rounded-md border"
            style={{ backgroundColor: lineColor }}
            onClick={() => setLineColorOpen(true)}
          />
        </div>
      </div>

      {/* 导出 */}
      <ExportButton getCanvas={getCanvas} />

      {/* Dialogs */}
      <TextInputDialog open={textDialogOpen} onOpenChange={setTextDialogOpen} />
      <FontPickerDialog open={fontDialogOpen} onOpenChange={setFontDialogOpen} />
      <MarginDialog open={marginDialogOpen} onOpenChange={setMarginDialogOpen} />
      <ColorPickerDialog open={traceColorOpen} onOpenChange={setTraceColorOpen} selectedColor={traceColor} onSelect={v => copybookTraceColor.set(v)} />
      <ColorPickerDialog open={lineColorOpen} onOpenChange={setLineColorOpen} selectedColor={lineColor} onSelect={v => copybookLineColor.set(v)} />
    </div>
  )
}
```

- [ ] **Step 2:** 删除 `src/components/copybook/ControlPanel.vue`

### Task 4.8: CanvasPreview.vue → CanvasPreview.tsx

**Files:**

- Create: `src/components/copybook/CanvasPreview.tsx`
- Delete: `src/components/copybook/CanvasPreview.vue`

- [ ] **Step 1:** 创建 `src/components/copybook/CanvasPreview.tsx`

```tsx
import { useStore } from '@nanostores/react'
import { useEffect, useRef, useState } from 'react'
import { renderGrid } from '@/composables/copybook/useGridRenderer'
import { useFontLoader } from '@/hooks/copybook/useFontLoader'
import { A4_HEIGHT_MM, A4_WIDTH_MM } from '@/shared/copybook/constants'
import { copybookFontOffsetY, copybookFontSize, copybookFontWeight, copybookGridSize, copybookGridType, copybookHighlightFirst, copybookInsertEmptyCol, copybookInsertEmptyRow, copybookLineColor, copybookMargin, copybookRowGap, copybookText, copybookTraceColor, copybookTraceCount } from '@/stores/copybook.store'

const PX_PER_MM = 96 / 25.4

export default function CanvasPreview({ onReady }: { onReady: (getCanvas: () => HTMLCanvasElement | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const resolvedFontName = useFontLoader()

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

  useEffect(() => {
    onReady(() => canvasRef.current)
  }, [onReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas)
      return

    const dpr = window.devicePixelRatio || 1
    const width = Math.round(A4_WIDTH_MM * PX_PER_MM)
    const height = Math.round(A4_HEIGHT_MM * PX_PER_MM)

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx)
      return

    ctx.scale(dpr, dpr)
    renderGrid(ctx, {
      text,
      gridType,
      gridSize,
      rowGap,
      margin,
      fontFamily: resolvedFontName,
      fontWeight,
      fontSize,
      fontOffsetY,
      traceCount,
      traceColor,
      lineColor,
      highlightFirst,
      insertEmptyRow,
      insertEmptyCol,
      pxPerMM: PX_PER_MM,
      paperWidth: A4_WIDTH_MM,
      paperHeight: A4_HEIGHT_MM,
    })
  }, [text, gridType, gridSize, rowGap, margin, resolvedFontName, fontWeight, fontSize, fontOffsetY, traceCount, traceColor, lineColor, highlightFirst, insertEmptyRow, insertEmptyCol])

  return (
    <canvas ref={canvasRef} className="border shadow-lg" style={{ width: '100%', maxWidth: '794px' }} />
  )
}
```

- [ ] **Step 2:** 删除 `src/components/copybook/CanvasPreview.vue`

### Task 4.9: 更新 hanzi.astro

**Files:**

- Modify: `src/pages/copybook/hanzi.astro`

- [ ] **Step 1:** 更新 import 和指令

```diff
- import ControlPanel from '@/components/copybook/ControlPanel.vue'
- import CanvasPreview from '@/components/copybook/CanvasPreview.vue'
+ import ControlPanel from '@/components/copybook/ControlPanel.tsx'
+ import CanvasPreview from '@/components/copybook/CanvasPreview.tsx'
```

```diff
- <ControlPanel client:only="vue" />
- <CanvasPreview client:only="vue" />
+ <ControlPanel client:only="react" />
+ <CanvasPreview client:only="react" />
```

- [ ] **Step 2:** 运行 `pnpm run build` 验证

### Task 4.10: 删除旧 composables

**Files:**

- Delete: `src/composables/copybook/useFontLoader.ts`
- Keep: `src/composables/copybook/useGridRenderer.ts` (纯函数)
- Keep: `src/composables/copybook/useExport.ts` (纯函数)

- [ ] **Step 1:** 删除 `src/composables/copybook/useFontLoader.ts`

- [ ] **Step 2:** 运行 `pnpm run build` 验证

---

## Phase 5 — 清理

### Task 5.1: 删除旧 Vue 文件

- [ ] **Step 1:** 删除 `src/pages/_app.ts`

- [ ] **Step 2:** 删除所有剩余 `.vue` 文件（如果还有遗漏的话）

### Task 5.2: 移除 Vue 集成

**Files:**

- Modify: `astro.config.ts`

- [ ] **Step 1:** 从 astro.config.ts 移除 Vue 集成

```diff
- import Vue from '@astrojs/vue'
- import react from '@astrojs/react'
+ import react from '@astrojs/react'

  export default defineConfig({
    integrations: [
-     react(),
-     Vue({ jsx: true, appEntrypoint: '/src/pages/_app' }),
+     react(),
    ],
  })
```

### Task 5.3: 移除 Vue 依赖

- [ ] **Step 1:** 卸载 Vue 相关依赖

```bash
pnpm remove vue @astrojs/vue reka-ui @nanostores/vue @vueuse/core @lucide/vue @iconify/vue
```

- [ ] **Step 2:** 运行 `pnpm run build` 验证

### Task 5.4: 更新 AGENTS.md

**Files:**

- Modify: `AGENTS.md`

- [ ] **Step 1:** 更新架构描述，将 Vue 相关内容改为 React

### Task 5.5: 最终验证

- [ ] **Step 1:** 运行 `pnpm run build` 确保完全通过
- [ ] **Step 2:** 运行 `npx eslint --fix .` 确保代码风格一致
