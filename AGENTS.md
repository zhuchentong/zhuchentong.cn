# AGENTS.md

## Project

Personal website (zhuchentong.cn) built with Astro 6 in SSR mode (`output: 'server'`), using the Node.js standalone adapter. pnpm package manager.

## Commands

- `pnpm dev` — dev server on `localhost:4321`
- `pnpm run build` — `astro check` + `astro build` + `node scripts/copy-fonts.mjs` (typecheck baked in)
- `pnpm run preview` — preview production build locally
- `pnpm run start` — `node ./dist/server/entry.mjs` (production SSR entry)
- `pnpm run docker:nginx` — builds and runs via nginx

Lint: `npx eslint --fix .` (via `@antfu/eslint-config` with astro, react, formatters). **No Prettier** — do not use it.

## Architecture

**SSR app** served by Node adapter in standalone mode. Dockerfile exposes port 4000.

**Rendering stack:**

- Astro pages (`.astro`) in `src/pages/`
- React components (`.tsx`) via `@astrojs/react`
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin) — **not UnoCSS**
- shadcn (`radix-nova` style) for UI primitives in `src/components/ui/`; uses Radix UI under the hood
- `cn()` utility at `src/lib/utils.ts` (clsx + tailwind-merge)

**Layout hierarchy:** `BaseLayout` → `AuthLayout` (login redirect) → `MainLayout` (header/footer/content shell).

**State management:** Nanostores (`src/stores/`). `app.store.ts` persists theme via `@nanostores/persistent` (cookies on server, localStorage on client). Access stores via `useStore()` from `src/stores/index.ts`.

**Middleware** (`src/middleware/index.ts`) reads a `theme` cookie and sets `Astro.locals.theme`.

**Path aliases:**
- `@/*` maps to `./src/*`
- `@copybook/*` maps to `./src/apps/copybook/*` (copybook feature)

**Custom routing:** `@inox-tools/custom-routing` registers app routes in `astro.config.ts`, enabling pages outside `src/pages/`.

**Component organization:**

- `src/components/ui/` — shadcn-vue primitives (button, dialog, dropdown-menu, label, navigation-menu, select, sheet, slider, switch)
- `src/components/layouts/` — structural (header, footer, favicons, theme)
- `src/components/pages/` — per-page components, grouped by route
- `src/components/widgets/` — interactive React widgets (e.g. theme toggle)
- `src/components/shared/` — reusable Astro components
- `src/config/` — static site config (nav links, layout params)

**Apps (独立功能模块):**

Each app in `src/apps/<name>/` is self-contained with its own pages, components, composables, hooks, store, config, server services, and assets. Routes are registered via `customRouting` in `astro.config.ts`.

- `src/apps/copybook/` — 字帖功能 (route: `/copybook/hanzi`)
  - `pages/` — Astro pages and API routes
  - `components/` — React UI components
  - `composables/` — business logic (rendering, export)
  - `hooks/` — React hooks (font loading)
  - `server/` — server-side services (font subsetting)
  - `store.ts` — Nanostore atoms
  - `config.ts` — feature configuration
  - `fonts.config.ts` — font registry
  - `constants.ts` — physical constants
  - `interfaces.ts` — TypeScript types
  - `layout.astro` — dedicated layout
  - `assets/fonts/` — TTF source fonts

**Adding a new app:**

1. Create `src/apps/<name>/` with the same structure
2. Add a `@<name>/*` path alias in `tsconfig.json`
3. Register routes via `customRouting` in `astro.config.ts`

**Icons:** `@iconify/react` with `icon-park` / `icon-park-outline` / `icon-park-solid` collections. Also Lucide via `lucide-react`.

**Theming:** CSS variables defined in `src/styles/globals.css` with `:root` (light) and `.dark` (dark) blocks. Uses oklch color space. Theme applied via class on `<html>` element.

**Fonts:** TTF fonts in `src/apps/copybook/assets/fonts/` are copied to `dist/fonts/` by `scripts/copy-fonts.mjs` during build. Font subsetting service at `src/apps/copybook/server/font-subset-service.ts`.

## Astro Islands

Astro pages ship zero JS by default. React components hydrate independently with client directives.

- `client:load` — hydrate immediately (above-the-fold interactive elements)
- `client:idle` — hydrate when browser is idle
- `client:visible` — hydrate when element enters viewport
- `client:only="react"` — skip SSR, client-only (for browser API dependencies like localStorage)

**Adding a new island:**

```astro
---
import MyWidget from '@/components/widgets/MyWidget.tsx'
---

<MyWidget client:visible />
```

## Deployment

Push to `master` triggers `.github/workflows/release.yaml`: builds Docker image, pushes to Docker Hub, then calls a panel webhook.

## Style

- Tailwind CSS v4 — use utility classes, not custom CSS where possible
- shadcn components follow `new-york` style with CSS variables
- Custom breakpoints: `mobile` (320px), `desktop` (768px) defined in `package.json`
- `.npmrc` uses npmmirror registry (Chinese mirror)
- Node version: 24.11.1 (local), 20.13.0 (Docker)

## Conventions

- 中文沟通，技术术语可使用英文
- 函数使用 JSDOC 风格注释，关键步骤使用行内注释 `//`
- 遵循项目现有代码风格，优先复用现有组件和工具函数
