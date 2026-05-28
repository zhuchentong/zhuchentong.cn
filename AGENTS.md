# AGENTS.md

## Project

Personal website (zhuchentong.cn) built with Astro 4 in SSR mode (`output: 'server'`), using the Node.js standalone adapter. Uses pnpm as the package manager.

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
- Vue 3 components (`.vue`) integrated via `@astrojs/vue` with JSX enabled and `inheritAttrs: false` globally
- UnoCSS for utility classes with attributify mode (prefix `css:`), icon presets, and custom SVG icons from `src/assets/svg/`

**Layout hierarchy:** `BaseLayout` → `AuthLayout` (adds login redirect) → `MainLayout` (adds header/footer/content shell)

**State management:** Nanostores (`src/stores/`). `app.store.ts` persists theme in localStorage. Access stores via `useStore()` from `src/stores/index.ts`.

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

## Deployment

Push to `master` triggers `.github/workflows/release.yaml`: builds Docker image, pushes to Docker Hub, then calls a panel webhook. Vercel adapter is present in dependencies but commented out in config.

## Style

- SCSS in `src/styles/`, imported in `BaseLayout`
- UnoCSS shortcuts: `flex-center` = `flex justify-center items-center`
- Custom breakpoints: `mobile` (320px), `desktop` (768px) defined in `package.json` and synced to UnoCSS
- `.npmrc` uses npmmirror registry (Chinese mirror)
