# shadcn-vue → shadcn 迁移设计

## 目标

将项目从 shadcn-vue (Vue 组件 + reka-ui) 迁移到官方 shadcn (React TSX 组件 + radix-ui)，同时将所有 Vue island 组件（包括 copybook 功能）改写为 React 组件，最终移除 Vue 相关依赖。

## 前置条件

- `pnpm dlx shadcn@latest init -t astro` 已执行
- `components.json` 已配置 (`style: "radix-nova"`, `tsx: true`)
- `globals.css` 已添加 `@import "shadcn/tailwind.css"`
- `src/components/ui/button.tsx` 已生成
- 依赖已添加：`radix-ui`, `shadcn`, `class-variance-authority`, `lucide-react`

## 迁移范围

### 需要的 shadcn React UI 组件 (9)

button, dialog, dropdown-menu, label, navigation-menu, select, sheet, slider, switch

### Vue → React 组件 (12)

**widgets (5):**

| 旧文件                    | 新文件                    | shadcn UI 依赖 |
| ------------------------- | ------------------------- | -------------- |
| `widgets/ThemeToggle.vue` | `widgets/ThemeToggle.tsx` | 无             |
| `widgets/Icon.vue`        | `widgets/Icon.tsx`        | 无             |
| `widgets/Test.vue`        | `widgets/Test.tsx`        | 无             |
| `widgets/MobileMenu.vue`  | `widgets/MobileMenu.tsx`  | Button, Sheet  |
| `widgets/NavMenu.vue`     | `widgets/NavMenu.tsx`     | NavigationMenu |

**copybook (7):**

| 旧文件                           | 新文件                           | shadcn UI 依赖                |
| -------------------------------- | -------------------------------- | ----------------------------- |
| `copybook/ControlPanel.vue`      | `copybook/ControlPanel.tsx`      | Label, Select, Slider, Switch |
| `copybook/CanvasPreview.vue`     | `copybook/CanvasPreview.tsx`     | 无                            |
| `copybook/TextInputDialog.vue`   | `copybook/TextInputDialog.tsx`   | Button, Dialog                |
| `copybook/ColorPickerDialog.vue` | `copybook/ColorPickerDialog.tsx` | Dialog                        |
| `copybook/FontPickerDialog.vue`  | `copybook/FontPickerDialog.tsx`  | Dialog                        |
| `copybook/MarginDialog.vue`      | `copybook/MarginDialog.tsx`      | Button, Dialog, Slider        |
| `copybook/ExportButton.vue`      | `copybook/ExportButton.tsx`      | Button, DropdownMenu          |

### Composable → React Hook

| 旧文件                                    | 新文件                            | 说明                                                   |
| ----------------------------------------- | --------------------------------- | ------------------------------------------------------ |
| `composables/copybook/useFontLoader.ts`   | `hooks/copybook/useFontLoader.ts` | Vue `watchEffect`/`ref` → React `useEffect`/`useState` |
| `composables/copybook/useGridRenderer.ts` | 不变                              | 纯函数，无框架依赖                                     |
| `composables/copybook/useExport.ts`       | 不变                              | 纯函数，无框架依赖                                     |

### Store 层

`src/stores/copybook.store.ts` 和 `src/stores/app.store.ts` 使用 Nanostores 原子，框架无关，**无需修改**。

### 依赖变更

**新增：**

- `react`, `react-dom`
- `@astrojs/react`
- `@nanostores/react`
- `@iconify/react`

**移除：**

- `vue`, `@astrojs/vue`
- `reka-ui`
- `@nanostores/vue`
- `@vueuse/core`
- `@lucide/vue`
- `@iconify/vue`

**保留：**

- `@nanostores/persistent` (框架无关)
- `nanostores`
- `@iconify-json/icon-park*` (Iconify 图标数据)

## 实施计划：5 阶段渐进式迁移

### Phase 1 — 基础设施层

**目标：** 配置 React 环境 + 生成所有 shadcn React UI 组件

**步骤：**

1. 安装 React 依赖

   ```bash
   pnpm add react react-dom @astrojs/react @nanostores/react @iconify/react
   ```

2. 修改 `astro.config.ts`：添加 `@astrojs/react` 集成（与 Vue 集成并存）

3. 通过 shadcn CLI 生成 9 个 React UI 组件：

   ```bash
   pnpm dlx shadcn@latest add dialog dropdown-menu label navigation-menu select sheet slider switch
   ```

   button 已存在，跳过。CLI 生成扁平的 `.tsx` 文件到 `src/components/ui/`。

4. 删除旧 Vue UI 目录中的 `index.ts`（barrel exports），避免 import 路径冲突。保留 `.vue` 文件直到 Phase 5。

5. 验证：`pnpm run build`

### Phase 2 — 简单 Widget 迁移

**目标：** 迁移不依赖 shadcn UI 的 3 个简单 widget

**步骤：**

1. `Icon.vue` → `Icon.tsx`：`@iconify/vue` → `@iconify/react`，Vue SFC → React 函数组件
2. `ThemeToggle.vue` → `ThemeToggle.tsx`：`useStore` 从 `@nanostores/react`，`@iconify/vue` → `@iconify/react`，`v-if`/`v-else` → 三元表达式
3. `Test.vue` → `Test.tsx`：`useIntervalFn` → `useState` + `useEffect` with `setInterval`
4. 更新所有引用这些组件的 `.astro` 文件：`client:only="vue"` → `client:only="react"`（或其他适当指令）
5. 删除旧 `.vue` 文件
6. 验证：`pnpm run build`

### Phase 3 — 导航 Widget 迁移

**目标：** 迁移 MobileMenu 和 NavMenu

**步骤：**

1. `MobileMenu.vue` → `MobileMenu.tsx`：
   - `@lucide/vue` → `lucide-react`
   - Vue `<Sheet>`, `<Button>` → React 版
   - `v-slot` / `as-child` → React props pattern
   - `v-for` → `.map()`

2. `NavMenu.vue` → `NavMenu.tsx`：
   - `NavigationMenu` 全套改为 React 版
   - `v-for` → `.map()`
   - `v-if` / `v-else` → 三元表达式

3. 更新引用的 `.astro` 文件中的 client 指令
4. 删除旧 `.vue` 文件
5. 验证：`pnpm run build`

### Phase 4 — Copybook 全量迁移

**目标：** 将 copybook 功能从 Vue 切换到 React

**步骤：**

1. **创建 React hooks：**
   - `src/hooks/copybook/useFontLoader.ts`：将 Vue `watchEffect` + `ref` 转为 React `useEffect` + `useState`。核心逻辑不变（fetch subset font → `new FontFace()` → `document.fonts.add()`）
   - `useGridRenderer.ts` 和 `useExport.ts` 无需修改（纯函数）

2. **迁移 copybook 组件（按复杂度从低到高）：**

   a. `ColorPickerDialog.tsx` — 最简单，纯展示 + 事件
   b. `FontPickerDialog.tsx` — 列表选择 + store 读写
   c. `TextInputDialog.tsx` — Dialog + 表单 + store 同步
   d. `MarginDialog.tsx` — Dialog + Slider + store
   e. `ExportButton.tsx` — DropdownMenu + 异步导出
   f. `ControlPanel.tsx` — 最复杂：13 个 store 绑定 + 多种 UI 组件 + 5 个子组件组合
   g. `CanvasPreview.tsx` — Canvas API + font loading + 生命周期管理

3. **关键 API 转换参考：**

   | Vue                          | React                                       |
   | ---------------------------- | ------------------------------------------- |
   | `useStore(atom)` (返回 ref)  | `useStore(atom)` (返回值)                   |
   | `ref(x)` / `.value`          | `useState(x)` / `[val, setVal]`             |
   | `watchEffect(() => ...)`     | `useEffect(() => { ... }, [deps])`          |
   | `onMounted(() => ...)`       | `useEffect(() => { ... }, [])`              |
   | `onBeforeUnmount(() => ...)` | `useEffect(() => { return () => ... }, [])` |
   | `v-model:visible`            | `open` + `onOpenChange` props               |
   | `defineEmits`                | callback props                              |
   | `defineProps`                | 函数参数 / Props type                       |
   | `v-for="x in list"`          | `list.map(x => ...)`                        |
   | `v-if` / `v-else`            | `{condition ? ... : ...}`                   |

4. 更新 `src/pages/copybook/hanzi.astro`：`client:only="vue"` → `client:only="react"`
5. 删除旧 `.vue` 文件和旧 `composables/` 目录
6. 验证：`pnpm run build`

### Phase 5 — 清理

**目标：** 移除所有 Vue 相关代码和依赖

**步骤：**

1. 删除旧 shadcn-vue UI 组件目录：
   - `src/components/ui/button/` (保留 `button.tsx`)
   - `src/components/ui/dialog/`
   - `src/components/ui/dropdown-menu/`
   - `src/components/ui/label/`
   - `src/components/ui/navigation-menu/`
   - `src/components/ui/select/`
   - `src/components/ui/sheet/`
   - `src/components/ui/slider/`
   - `src/components/ui/switch/`

2. 删除 Vue 相关文件：
   - `src/pages/_app.ts` (Vue `inheritAttrs` 配置)
   - 所有剩余 `.vue` 文件

3. 从 `astro.config.ts` 移除 Vue 集成和 `appEntrypoint`

4. 移除 Vue 依赖：

   ```bash
   pnpm remove vue @astrojs/vue reka-ui @nanostores/vue @vueuse/core @lucide/vue @iconify/vue
   ```

5. 更新 `AGENTS.md`：
   - Vue → React 相关说明
   - 命令/架构描述更新

6. 最终验证：`pnpm run build`

## 风险与注意事项

1. **Nanostores React binding**：`@nanostores/react` 的 `useStore` 直接返回值（不像 Vue 版返回 ref），所有 `.value` 访问需移除
2. **Dialog `v-model:visible`**：shadcn React Dialog 使用 `open` + `onOpenChange` props，不同于 Vue 的 `v-model`
3. **`asChild` 模式**：Vue 版通过 `as-child` prop，React shadcn 使用 Radix 的 `asChild`，模式类似但 API 细节不同
4. **CanvasPreview 的字体加载**：依赖 `document.fonts` API，`client:only="react"` 确保仅在客户端渲染，与 Vue 版行为一致
5. **Print CSS**：CopybookLayout 中的 print 样式不受框架切换影响，因为作用于 CSS 层面
6. **globals.css 重复导入**：当前 `globals.css` 有重复的 `@import "tw-animate-css"`（行 2 和 3），需清理
