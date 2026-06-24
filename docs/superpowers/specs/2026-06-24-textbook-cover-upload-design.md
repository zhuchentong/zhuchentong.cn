# 教材封面上传功能设计

## 目标

为英语学习模块的教材（textbook）添加封面图片上传功能，使用七牛云 S3 兼容对象存储。

## 决策

| 项 | 决策 |
|---|---|
| 上传机制 | 服务端中转（客户端 → Astro API → 七牛 S3） |
| 存储键命名 | 直接 `img_textbook_<id>.<ext>`，不引入 `tmp_` |
| SDK | `@aws-sdk/client-s3` 指向七牛 S3 端点 |
| DB 存储 | `english_textbook.cover_url` 存完整公开 URL |
| 展示位置 | TextbookGallery 卡片 + AdminPanel 管理 |

## 架构

```
客户端 (AdminPanel)
    │ FormData { textbookId, cover: File }
    ▼
POST /english/api/textbooks/cover
    │ multipart/form-data
    │ 1. 解析 FormData，校验类型/大小
    │ 2. 如有旧 coverUrl，删除旧对象
    │ 3. PutObjectCommand 上传到七牛 S3
    │ 4. UPDATE english_textbook SET cover_url = 公开URL
    ▼
七牛云 S3 (img_textbook_<id>.<ext>)
    │ 公开访问
    ▼
客户端 (TextbookGallery)
    │ GET /english/api/textbooks?stage=xxx
    │ 直接渲染 <img src={tb.coverUrl} />
```

## 环境变量

```
QINIU_ACCESS_KEY=<七牛 AccessKey>
QINIU_SECRET_KEY=<七牛 SecretKey>
QINIU_BUCKET=<bucket 名>
QINIU_REGION=cn-east-1
QINIU_ENDPOINT=https://s3-cn-east-1.qiniucs.com
QINIU_PUBLIC_DOMAIN=https://img.zhuchentong.cn
```

## 文件变更

| 文件 | 操作 |
|---|---|
| `package.json` | 新增 `@aws-sdk/client-s3` 依赖 |
| `.env` | 新增 `QINIU_*` 环境变量 |
| `src/services/qiniu-storage.ts` | 新建：S3 客户端单例、上传、删除、公开 URL |
| `src/database/schema.ts` | 修改：`englishTextbook` 表加 `cover_url` 列 |
| `src/database/migrations/0004_*.sql` | 自动生成：添加列迁移 |
| `src/apps/english/services/textbook.service.ts` | 修改：新增 `updateTextbookCover()` |
| `src/apps/english/pages/api/textbooks/cover.ts` | 新建：封面上传 API |
| `src/apps/english/components/TextbookCoverManager.tsx` | 新建：封面管理 UI 组件 |
| `src/apps/english/components/AdminPanel.tsx` | 修改：集成 TextbookCoverManager |
| `src/apps/english/components/TextbookGallery.tsx` | 修改：卡片展示封面图 |
| `astro.config.ts` | 修改：注册 `/english/api/textbooks/cover` 路由 |

## 校验规则

- 文件类型：`image/jpeg`、`image/png`、`image/webp`
- 文件大小：≤ 5MB
- textbookId 必填且教材存在

## 错误处理

- 上传七牛失败 → 500，不动 DB
- 删旧封面失败 → `console.warn`，不阻断主流程
- 校验失败 → 400 中文提示
