# AGENTS.md

## Project

Personal website (zhuchentong.cn) built with Astro 6 in SSR mode (`output: 'server'`), using the Node.js standalone adapter. pnpm package manager.

## Commands

- `pnpm dev` — dev server on `localhost:4321`
- `pnpm run build` — `astro check` + `astro build` + `node scripts/copy-fonts.mjs` (typecheck baked in)
- `pnpm run preview` — preview production build locally
- `pnpm run start` — `node ./dist/server/entry.mjs` (production SSR entry, port 4000)
- `pnpm run docker:nginx` — `astro check` + `astro build` + runs nginx container on port 8080

Lint: `npx eslint --fix .` (via `@antfu/eslint-config` with astro, react, formatters). **No Prettier** — do not use it.

## Architecture

**SSR app** served by Node adapter in standalone mode. Dockerfile exposes port 4000.

**Rendering stack:**

- Astro pages (`.astro`) in `src/pages/`
- React components (`.tsx`) via `@astrojs/react`
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin) — **not UnoCSS**
- shadcn (Radix UI) for UI primitives in `src/components/ui/`
- `cn()` utility at `src/lib/utils.ts` (clsx + tailwind-merge)

**Layout hierarchy:** `BaseLayout` → `AuthLayout` (login redirect) → `MainLayout` (header/footer/content shell).

**State management:** Nanostores (`src/stores/`). `app.store.ts` persists theme via `@nanostores/persistent` (cookies on server, localStorage on client). Access stores via `useStore()` from `src/stores/index.ts`.

**Middleware** (`src/middleware/index.ts`) reads a `theme` cookie and sets `Astro.locals.theme`.

**Path aliases:**

- `@/*` maps to `./src/*`
- `@copybook/*` maps to `./src/apps/copybook/*`

**Custom routing:** `@inox-tools/custom-routing` registers app routes in `astro.config.ts`, enabling pages outside `src/pages/`.

**Icons:** `@iconify/react` with `icon-park` / `icon-park-outline` / `icon-park-solid` collections. Also Lucide via `lucide-react`.

**Theming:** CSS variables in `src/styles/globals.css` with `:root` (light) and `.dark` (dark) blocks. Uses oklch color space. Theme applied via class on `<html>` element.

## Apps (独立功能模块)

Each app in `src/apps/<name>/` is self-contained with its own pages, components, composables, hooks, store, config, server services, and assets. Routes are registered via `customRouting` in `astro.config.ts`.

### copybook (字帖功能, route: `/copybook/hanzi`)

Uses **leafer-draw** for canvas rendering (not raw Canvas 2D). Leafer 文档: https://context7.com/leaferjs/ai-docs

Key gotcha:

- `createGridElements(params, scale)` generates leafer elements with coordinates already scaled from mm → px
- **Do not use `el.scale`** to apply coordinate transforms — leafer's `scale` only scales internal geometry (width/height, points), NOT x/y position. This causes Rect/Text positions to break while Line points scale correctly, misaligning the grid.
- Always pass the `scale` parameter so all values (x, y, width, height, fontSize, strokeWidth, dashPattern, Line points) are multiplied at creation time.

Adding a new app:

1. Create `src/apps/<name>/` with the same structure
2. Add a `@<name>/*` path alias in `tsconfig.json`
3. Register routes via `customRouting` in `astro.config.ts`

## Astro Islands

Astro pages ship zero JS by default. React components hydrate independently with client directives (`client:load`, `client:idle`, `client:visible`, `client:only="react"`).

## Deployment

Push to `master` triggers `.github/workflows/release.yaml`: builds Docker image, pushes to Docker Hub, then calls a panel webhook. Node 24 in both local and Docker.

## Conventions

- 中文沟通，技术术语可使用英文
- 函数使用 JSDoc 风格注释，关键步骤使用行内注释 `//`
- 遵循项目现有代码风格，优先复用现有组件和工具函数
- `.npmrc` uses npmmirror registry
