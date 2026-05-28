# AGENTS.md

## Project

Personal website (zhuchentong.cn) built with Astro 6 in SSR mode (`output: 'server'`), using the Node.js standalone adapter. Uses pnpm as the package manager.

## AIFirst

本项目采用 AI 优先的开发方式。AI 不仅是辅助工具，更是核心开发伙伴。

**核心原则：**

- **AI 参与全流程**：需求分析、架构设计、代码实现、测试验证、文档编写均由 AI 深度参与
- **人机协作**：人类负责创意决策和需求定义，AI 负责实现和优化
- **持续学习**：AI 需理解项目上下文，遵循现有代码风格和架构约定

**AI 工作规范：**

- 修改代码前先理解上下文，阅读相关文件和文档
- 遵循项目现有的代码风格和命名约定
- 优先复用现有组件和工具函数
- 保持代码简洁，避免过度工程化
- 重要变更需说明原因和影响

**注释规范：**

- 函数使用 JSDOC 风格注释，包含功能描述、参数说明、返回值
- 函数内关键步骤使用行内注释 `//` 说明逻辑
- 字段属性使用行内注释 `//` 说明用途

**沟通方式：**

- 中文沟通，技术术语可使用英文
- 直接执行任务，减少不必要的确认
- 遇到歧义时主动提问澄清

## Commands

- `pnpm dev` — dev server on `localhost:4321`
- `pnpm run build` — runs `astro check` then `astro build` (typecheck is baked into build)
- `pnpm run preview` — preview production build locally
- `pnpm run start` — runs `node ./dist/server/entry.mjs` (production SSR entry)
- `pnpm run docker:nginx` — builds and runs via nginx (static deploy alternative)

Lint/format is ESLint only via `@antfu/eslint-config` with astro, vue, unocss, and formatters enabled. Prettier is disabled — do not use it. Run lint with `npx eslint --fix .`.

## Architecture

**SSR app** served by the Node adapter in standalone mode. Dockerfile exposes port 4000.

**Rendering stack:**

- Astro pages (`.astro`) in `src/pages/`
- Vue 3 components (`.vue`) integrated via `@astrojs/vue` with JSX enabled and `inheritAttrs: false` globally (set in `src/pages/_app.ts`)
- UnoCSS for utility classes with attributify mode (prefix `css:`), icon presets, and custom SVG icons from `src/assets/svg/`

**Layout hierarchy:** `BaseLayout` → `AuthLayout` (adds login redirect) → `MainLayout` (adds header/footer/content shell)

**State management:** Nanostores (`src/stores/`). `app.store.ts` persists theme via `@nanostores/persistent` (cookies on server, localStorage on client). Access stores via `useStore()` from `src/stores/index.ts`.

**Middleware** (`src/middleware/index.ts`) reads a `theme` cookie and sets `Astro.locals.theme`.

**Path alias:** `@/*` maps to `./src/*`

**Component organization:**

- `src/components/layouts/` — structural (header, footer, bootstrap, favicons)
- `src/components/pages/` — per-page components, grouped by route in subdirectories
- `src/components/widgets/` — interactive Vue widgets (e.g. theme toggle)
- `src/components/shared/` — reusable Astro components
- `src/components/themes/` — theme-specific wrappers
- `src/config/` — static site config (nav links, layout params)

**Icons:** UnoCSS `preset-icons` with `icon-` prefix. Collections: `park-outline`, `park-solid`, `park`, and custom `svg:` (loads from `src/assets/svg/`).

## Astro Islands

Astro pages ship zero JavaScript by default. Interactive Vue components are "islands" that hydrate independently with client directives.

**Client directives:**

- `client:load` — hydrate immediately on page load (for above-the-fold interactive elements)
- `client:idle` — hydrate when browser is idle
- `client:visible` — hydrate when element enters viewport
- `client:media` — hydrate when CSS media query matches
- `client:only="vue"` — skip SSR, render only on client (for components that depend on browser APIs like localStorage)

**Current islands:**

- `ThemeToggle` (`src/components/widgets/ThemeToggle.vue`) — `client:only="vue"`, depends on localStorage via Nanostores
- `Test` (`src/components/widgets/Test.vue`) — `client:load` in demo pages

**Adding a new island:**

```astro
---
import MyWidget from '@/components/widgets/MyWidget.vue'
---

<MyWidget client:visible />
```

Use `client:load` for critical interactive elements, `client:visible` for below-the-fold content.

## Deployment

Push to `master` triggers `.github/workflows/release.yaml`: builds Docker image, pushes to Docker Hub, then calls a panel webhook. Vercel adapter is present in dependencies but commented out in config.

## Style

- SCSS in `src/styles/`, imported in `BaseLayout`
- UnoCSS shortcuts: `flex-center` = `flex justify-center items-center`
- Custom breakpoints: `mobile` (320px), `desktop` (768px) defined in `package.json` and synced to UnoCSS
- `.npmrc` uses npmmirror registry (Chinese mirror)
