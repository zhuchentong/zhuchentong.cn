FROM node:24-alpine AS base
ENV HOST=0.0.0.0
ENV PORT=4000
WORKDIR /app
COPY . .
RUN corepack enable \
    && node --version \
    && pnpm --version

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:24-alpine AS runner
WORKDIR /app
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "./dist/server/entry.mjs"]


