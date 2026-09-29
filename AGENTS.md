# AGENTS.md

## Project

Personal website (zhuchentong.cn) built with **Astro 7** in SSR mode (`output: 'server'`), Node.js standalone adapter, React 19 islands. **pnpm 10** (`packageManager` field), **Node 24** (`.node-version`, `node:24-alpine` in Docker). Single package — `pnpm-workspace.yaml` only holds pnpm settings, not a monorepo.

## Commands

- `pnpm dev` — dev server on `localhost:4321`
- `pnpm run build` — `astro check` + `astro build` + `node scripts/copy-fonts.mjs` (typecheck baked in; the last step copies `src/assets/fonts` → `dist/fonts` because fonts bypass the Vite pipeline)
- `pnpm run preview` — preview production build locally
- `pnpm run start` — `node ./dist/server/entry.mjs` (production SSR entry, port 4000)

Lint: `npx eslint --fix .` (via `@antfu/eslint-config` with astro, react, formatters). **No Prettier** — do not use it.

Database (Drizzle + PostgreSQL, config in `drizzle.config.ts`):

- `pnpm db:generate` — generate migration from `src/database/schema.ts`
- `pnpm db:migrate` — apply migrations in `src/database/migrations/`
- `pnpm db:push` — push schema directly (dev only)
- `pnpm db:studio` — Drizzle Studio

Schema change workflow: edit `src/database/schema.ts` → `pnpm db:generate` → `pnpm db:migrate`. Query via `import { db } from '@/database'`.

## Environment

`.env` (not committed) provides:

- `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_USER` / `DATABASE_PASSWORD` / `DATABASE_DB` — required by Drizzle
- `QINIU_REGION` / `QINIU_ENDPOINT` / `QINIU_ACCESS_KEY` / `QINIU_SECRET_KEY` / `QINIU_BUCKET` / `QINIU_PUBLIC_DOMAIN` — 七牛 S3-compatible storage (`src/services/qiniu-storage.ts`)

`.npmrc` uses npmmirror registry.

## Architecture

**Rendering stack:**

- Astro pages (`.astro`) in `src/pages/` and `src/apps/<name>/pages/`
- React components (`.tsx`) via `@astrojs/react`
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin) — **not UnoCSS**
- shadcn (Radix UI) for UI primitives in `src/components/ui/`
- `cn()` utility at `src/lib/utils.ts` (clsx + tailwind-merge)

**Layout hierarchy:** `BaseLayout` → `AuthLayout` (redirects to `/login` when `isNeedLogin` and no user) → `MainLayout` (header/footer/content shell). Middleware (`src/middleware/index.ts`) only sets `Astro.locals.theme` from the `theme` cookie; `Astro.locals.user`/`userToken` are declared in `src/env.d.ts` but not currently populated server-side.

**State management:** Nanostores (`src/stores/`). `app.store.ts` uses `persistentAtom` (localStorage on client); `src/shared/common/store.ts` syncs store values to cookies so the server can read them. Access stores via `useStore()` from `src/stores/index.ts`.

**Theming:** CSS variables in `src/styles/globals.css` with `:root` (light) and `.dark` (dark) blocks, oklch color space. Theme applied via class on `<html>` element.

**Icons:** `@iconify/react` with `icon-park` / `icon-park-outline` / `icon-park-solid` collections. Also Lucide via `lucide-react`.

## Apps (独立功能模块)

Each app in `src/apps/<name>/` is self-contained (pages, components, hooks/composables, stores, config, `pages/api/` services, assets). Current apps:

| App | Routes | 内容 |
|---|---|---|
| `copybook` | `/copybook/hanzi` | 硬笔字帖 |
| `workbook` | `/workbook/pinyin` | 拼音练习 |
| `english` | `/english/*` | 英语单词/句子学习 + admin |
| `chinese` | `/chinese/*` | 语文打字/识字（四年级上数据在 `data/`） |
| `history` | `/history/dynasty` | 英国&美国历史 |

**Routing** uses `@inox-tools/custom-routing`: each app exports a `route.ts` (`Record<string, string>` mapping URL path → page file, including its API endpoints), merged in `astro.config.ts`. Pages may live outside `src/pages/`; adding an API endpoint means adding the `.ts` file under the app's `pages/api/` **and** a route entry in the app's `route.ts`.

**Path aliases** (`tsconfig.json`): `@/*` → `./src/*`, plus `@copybook/*`, `@workbook/*`, `@english/*`, `@chinese/*`, `@history/*`, `@database/*`.

Adding a new app:

1. Create `src/apps/<name>/` with the same structure
2. Add a `@<name>/*` path alias in `tsconfig.json`
3. Export routes from `src/apps/<name>/route.ts` and register them via `customRouting` in `astro.config.ts`

### copybook 字帖 gotcha

Uses **leafer-draw** for canvas rendering (not raw Canvas 2D). Leafer 文档: https://context7.com/leaferjs/ai-docs

- `createGridElements(params, scale)` generates leafer elements with coordinates already scaled from mm → px
- **Do not use `el.scale`** to apply coordinate transforms — leafer's `scale` only scales internal geometry (width/height, points), NOT x/y position. This causes Rect/Text positions to break while Line points scale correctly, misaligning the grid.
- Always pass the `scale` parameter so all values (x, y, width, height, fontSize, strokeWidth, dashPattern, Line points) are multiplied at creation time.

Design docs live in `docs/` (copybook feature/font-subset plans, wordbook DB schema).

## Data import (seed scripts)

`scripts/seed-*.mjs` import textbook data (English words/sentences, Chinese 课文/词语) by calling the **running dev server's HTTP API** — start `pnpm dev` first, then `node scripts/seed-grade4a-words.mjs [baseURL]` (default `http://localhost:4321`). Scripts are idempotent. `scripts/convert-*.mjs` / `gen-*.mjs` prepare source data; raw textbook data lives in `data/`.

## Astro Islands

Astro pages ship zero JS by default. React components hydrate independently with client directives (`client:load`, `client:idle`, `client:visible`, `client:only="react"`).

## Deployment

**No CI** — the old `.github/workflows/release.yaml` was removed. Deployment is manual: build the Docker image from `Dockerfile` (multi-stage `node:24-alpine`, standalone SSR on port 4000, `HOST=0.0.0.0`).

## Conventions

- 中文沟通，技术术语可使用英文
- 函数使用 JSDoc 风格注释，关键步骤使用行内注释 `//`
- 遵循项目现有代码风格，优先复用现有组件和工具函数
