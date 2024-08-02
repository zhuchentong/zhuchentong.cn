# STEP1: 构建基础镜像
FROM alpine:3.20 as base
# -设置环境变量
ENV NODE_VERSION=20.13.0
ENV PNPM_VERSION=9.5.0
ENV HOST=0.0.0.0
ENV PORT=4000
# -设置工作目录
WORKDIR /app
# -复制依赖相关目录
COPY . .
# 安装基础包
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories \
    && apk add --no-cache nodejs npm python3 curl gcc g++ make linux-headers \
    && npm install -g pnpm@$PNPM_VERSION --registry=https://registry.npmmirror.com \
    && node --version \
    && pnpm --version

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# STEP2: 构建依赖镜像
FROM base as build
# -安装依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
# -开始构建
RUN pnpm run build

# STEP4: 运行
FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist

ENV NODE_ENV=production
EXPOSE 4000
CMD [ "npm", "run", "start" ]


