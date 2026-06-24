FROM docker.1ms.run/library/node:24-alpine AS base
RUN apk add --no-cache python3 py3-setuptools make g++
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
RUN pnpm prune --prod

FROM docker.1ms.run/library/node:24-alpine AS runner
WORKDIR /app
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4000
EXPOSE 4000
CMD ["node", "./dist/server/entry.mjs"]
