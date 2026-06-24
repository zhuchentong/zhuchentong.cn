# 教材封面上传功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为英语模块教材添加封面图片上传功能，使用七牛云 S3 兼容对象存储，服务端中转上传。

**Architecture:** 客户端通过 multipart FormData 将图片发送到 Astro API 端点，服务端用 `@aws-sdk/client-s3` 上传到七牛 S3（key = `img_textbook_<id>.<ext>`），DB 存完整公开 URL。前端在 AdminPanel 管理封面、TextbookGallery 展示封面。

**Tech Stack:** `@aws-sdk/client-s3`、Astro SSR API Routes（`request.formData()`）、Drizzle ORM、React（shadcn/ui）

---

## 文件变更总览

| 文件 | 操作 |
|---|---|
| `package.json` | 修改：新增 `@aws-sdk/client-s3` |
| `.env` | 修改：新增 `QINIU_*` 环境变量 |
| `src/services/qiniu-storage.ts` | **新建**：S3 客户端单例、上传/删除/公开 URL |
| `src/database/schema.ts` | 修改：`englishTextbook` 加 `coverUrl` 列 |
| `src/database/migrations/0004_*.sql` | **自动生成** |
| `src/apps/english/services/textbook.service.ts` | 修改：新增 `updateTextbookCover()` |
| `src/apps/english/pages/api/textbooks/cover.ts` | **新建**：封面上传 API |
| `src/apps/english/components/TextbookCoverManager.tsx` | **新建**：封面管理 UI |
| `src/apps/english/components/AdminPanel.tsx` | 修改：集成 TextbookCoverManager |
| `src/apps/english/components/TextbookGallery.tsx` | 修改：卡片展示封面 |
| `astro.config.ts` | 修改：注册封面 API 路由 |

---

### Task 1: 依赖与环境配置

**Files:**
- Modify: `package.json`
- Modify: `.env`

- [ ] **Step 1: 安装 `@aws-sdk/client-s3`**

```bash
pnpm add @aws-sdk/client-s3
```

- [ ] **Step 2: 在 `.env` 中添加七牛云环境变量**

在 `.env` 末尾追加：

```
QINIU_ACCESS_KEY=<你的七牛 AccessKey>
QINIU_SECRET_KEY=<你的七牛 SecretKey>
QINIU_BUCKET=<bucket 名称>
QINIU_REGION=cn-east-1
QINIU_ENDPOINT=https://s3-cn-east-1.qiniucs.com
QINIU_PUBLIC_DOMAIN=https://img.zhuchentong.cn
```

> 注意：实际值需用户根据自己的七牛云账号填写。

- [ ] **Step 3: 验证依赖安装**

```bash
pnpm ls @aws-sdk/client-s3
```

Expected: 显示已安装的版本号。

---

### Task 2: Qiniu 存储服务

**Files:**
- Create: `src/services/qiniu-storage.ts`

- [ ] **Step 1: 创建存储服务**

仿照 `src/database/index.ts` 的惰性单例模式，创建 `src/services/qiniu-storage.ts`：

```typescript
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import process from 'node:process'

const REGION = process.env.QINIU_REGION ?? import.meta.env.QINIU_REGION
const ENDPOINT = process.env.QINIU_ENDPOINT ?? import.meta.env.QINIU_ENDPOINT
const ACCESS_KEY = process.env.QINIU_ACCESS_KEY ?? import.meta.env.QINIU_ACCESS_KEY
const SECRET_KEY = process.env.QINIU_SECRET_KEY ?? import.meta.env.QINIU_SECRET_KEY
const BUCKET = process.env.QINIU_BUCKET ?? import.meta.env.QINIU_BUCKET
const PUBLIC_DOMAIN = process.env.QINIU_PUBLIC_DOMAIN ?? import.meta.env.QINIU_PUBLIC_DOMAIN

let _client: S3Client | null = null

function getS3(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      credentials: { accessKeyId: ACCESS_KEY!, secretAccessKey: SECRET_KEY! },
      forcePathStyle: true,
    })
  }
  return _client
}

/** 上传对象到七牛 S3 */
export async function uploadObject(key: string, body: Buffer, contentType: string): Promise<void> {
  await getS3().send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: 'public-read',
  }))
}

/** 删除对象（容错：不存在时仅 warn） */
export async function deleteObject(key: string): Promise<void> {
  try {
    await getS3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
  }
  catch (err) {
    console.warn(`[qiniu] 删除对象失败 (${key}):`, err)
  }
}

/** 根据 key 构建公开访问 URL */
export function publicUrl(key: string): string {
  return `${PUBLIC_DOMAIN}/${key}`
}

/** 从完整公开 URL 反推对象 key */
export function keyFromUrl(url: string): string | null {
  const prefix = `${PUBLIC_DOMAIN}/`
  if (!url.startsWith(prefix))
    return null
  return url.slice(prefix.length)
}
```

- [ ] **Step 2: 运行 typecheck 确认无报错**

```bash
pnpm run build 2>&1 | head -30
```

Expected: 无 `qiniu-storage.ts` 相关报错（其他文件可能因后续任务的引用暂时报错，忽略）。

---

### Task 3: 数据库迁移

**Files:**
- Modify: `src/database/schema.ts`

- [ ] **Step 1: 在 `englishTextbook` 表定义中添加 `coverUrl` 列**

在 `src/database/schema.ts` 的 `englishTextbook` 定义中，`createdAt` 之前添加一行：

```typescript
  coverUrl: text('cover_url'),
```

完整表定义变为：

```typescript
export const englishTextbook = pgTable('english_textbook', {
  id: serial('id').primaryKey(),
  stage: text('stage').notNull(),
  name: text('name').notNull(),
  publisher: text('publisher').notNull(),
  grade: text('grade'),
  semester: text('semester'),
  coverUrl: text('cover_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

- [ ] **Step 2: 生成迁移文件**

```bash
pnpm db:generate
```

Expected: 在 `src/database/migrations/` 下生成 `0004_*.sql`，内容为：

```sql
ALTER TABLE "english_textbook" ADD COLUMN "cover_url" text;
```

- [ ] **Step 3: 执行迁移**

```bash
pnpm db:push
```

Expected: 成功，`english_textbook` 表新增 `cover_url` 列。

---

### Task 4: Textbook 服务扩展

**Files:**
- Modify: `src/apps/english/services/textbook.service.ts`

- [ ] **Step 1: 添加 `updateTextbookCover` 函数**

在 `src/apps/english/services/textbook.service.ts` 末尾追加：

```typescript
/**
 * 更新课本封面 URL
 */
export async function updateTextbookCover(textbookId: number, coverUrl: string) {
  const [row] = await db.update(englishTextbook)
    .set({ coverUrl })
    .where(eq(englishTextbook.id, textbookId))
    .returning()
  return row
}
```

- [ ] **Step 2: 确认 import 已包含所需符号**

文件顶部已 import `englishTextbook` 和 `eq`（现有函数使用中），无需额外 import。

- [ ] **Step 3: 运行 typecheck**

```bash
pnpm run build 2>&1 | grep -i "textbook.service" || echo "NO_ERRORS"
```

Expected: 无报错。

---

### Task 5: 封面上传 API 端点

**Files:**
- Create: `src/apps/english/pages/api/textbooks/cover.ts`
- Modify: `astro.config.ts`

- [ ] **Step 1: 创建封面上传 API**

创建 `src/apps/english/pages/api/textbooks/cover.ts`：

```typescript
import type { APIRoute } from 'astro'

import { eq } from 'drizzle-orm'
import { db } from '@/database'
import { englishTextbook } from '@/database/schema'
import { fail, ok } from '@english/services/response'
import { updateTextbookCover } from '@english/services/textbook.service'
import { deleteObject, keyFromUrl, publicUrl, uploadObject } from '@/services/qiniu-storage'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData()
  const file = formData.get('cover')
  const textbookIdRaw = formData.get('textbookId')

  if (!file || !(file instanceof File)) {
    return fail('缺少封面文件')
  }
  if (!textbookIdRaw) {
    return fail('缺少 textbookId')
  }

  const textbookId = Number(textbookIdRaw)
  if (Number.isNaN(textbookId)) {
    return fail('textbookId 无效')
  }

  // 校验类型
  if (!ALLOWED_TYPES.has(file.type)) {
    return fail('仅支持 JPG、PNG、WebP 格式')
  }

  // 校验大小
  if (file.size > MAX_SIZE) {
    return fail('文件大小不能超过 5MB')
  }

  try {
    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = EXT_MAP[file.type]!
    const key = `img_textbook_${textbookId}.${ext}`

    // 查询旧封面（用于后续删除）
    const [textbook] = await db.select({ coverUrl: englishTextbook.coverUrl })
      .from(englishTextbook)
      .where(eq(englishTextbook.id, textbookId))

    if (!textbook) {
      return fail('教材不存在', 404)
    }

    // 上传新封面到七牛
    await uploadObject(key, buffer, file.type)

    // 更新 DB（先写 DB，保证一致性）
    const url = publicUrl(key)
    await updateTextbookCover(textbookId, url)

    // 删除旧封面（best-effort）
    if (textbook.coverUrl) {
      const oldKey = keyFromUrl(textbook.coverUrl)
      if (oldKey && oldKey !== key) {
        await deleteObject(oldKey)
      }
    }

    return ok({ coverUrl: url })
  }
  catch (err) {
    console.error('上传封面失败:', err)
    return fail('上传封面失败', 500)
  }
}
```

- [ ] **Step 2: 注册路由到 `astro.config.ts`**

在 `astro.config.ts` 的 `customRouting` 中，在 `/english/api/textbooks` 之后添加：

```typescript
      '/english/api/textbooks/cover': './src/apps/english/pages/api/textbooks/cover.ts',
```

- [ ] **Step 3: 运行 typecheck**

```bash
pnpm run build 2>&1 | head -30
```

Expected: 无报错。

---

### Task 6: AdminPanel 封面管理 UI

**Files:**
- Create: `src/apps/english/components/TextbookCoverManager.tsx`
- Modify: `src/apps/english/components/AdminPanel.tsx`

- [ ] **Step 1: 创建 TextbookCoverManager 组件**

创建 `src/apps/english/components/TextbookCoverManager.tsx`。
组件接收 `initialCoverUrl` prop（由 AdminPanel 从已获取的课本列表中派生），上传成功后通过 `onCoverUpdated` 回调通知父组件刷新列表，自身用 `localCoverUrl` 追踪最新状态：

```tsx
import { Icon } from '@iconify/react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TextbookCoverManagerProps {
  textbookId: number
  initialCoverUrl: string | null
  onCoverUpdated: (newUrl: string) => void
}

export function TextbookCoverManager({ textbookId, initialCoverUrl, onCoverUpdated }: TextbookCoverManagerProps) {
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(initialCoverUrl)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('cover', file)
    formData.append('textbookId', String(textbookId))

    setUploading(true)
    try {
      const res = await fetch('/english/api/textbooks/cover', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error ?? '上传失败')
        return
      }
      const newUrl = json.data.coverUrl as string
      setLocalCoverUrl(newUrl)
      onCoverUpdated(newUrl)
    }
    catch {
      alert('上传失败')
    }
    finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>教材封面</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {localCoverUrl
              ? (
                  <img
                    src={localCoverUrl}
                    alt="教材封面"
                    className="size-full object-cover"
                  />
                )
              : (
                  <Icon icon="icon-park-outline:book-one" className="size-10 text-muted-foreground" />
                )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {localCoverUrl ? '点击替换封面图片' : '点击上传封面图片'}
            </p>
            <p className="text-xs text-muted-foreground">
              支持 JPG、PNG、WebP，最大 5MB
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? '上传中...' : localCoverUrl ? '替换封面' : '上传封面'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: 在 AdminPanel 中集成 TextbookCoverManager**

重写 `src/apps/english/components/AdminPanel.tsx`。
AdminPanel 新增 `textbooks` 状态，在选中课本变化时获取课本列表，将当前课本的 `coverUrl` 作为 prop 传给 `TextbookCoverManager`：

```tsx
import type { EnglishTextbook } from '@/database/schema'

import { selectedTextbookId, selectedUnitNumber } from '@english/store'
import { apiRequest } from '@english/lib/request'
import { useStore } from '@nanostores/react'
import { useEffect, useState } from 'react'

import { SentenceList } from './SentenceList'
import { TextbookCoverManager } from './TextbookCoverManager'
import { TextbookUnitSelector } from './TextbookUnitSelector'
import { WordList, WordSearchPanel } from './WordList'

export function AdminPanel() {
  const textbookId = useStore(selectedTextbookId)
  const unitNumber = useStore(selectedUnitNumber)
  const [textbooks, setTextbooks] = useState<EnglishTextbook[]>([])

  useEffect(() => {
    apiRequest<EnglishTextbook[]>('/english/api/textbooks').then(setTextbooks)
  }, [])

  const currentTextbook = textbooks.find(tb => tb.id === textbookId)

  const handleCoverUpdated = (newUrl: string) => {
    setTextbooks(prev => prev.map(tb =>
      tb.id === textbookId ? { ...tb, coverUrl: newUrl } : tb,
    ))
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-xl font-semibold">数据管理</h1>
        <TextbookUnitSelector />
        {textbookId && currentTextbook && (
          <TextbookCoverManager
            key={textbookId}
            textbookId={textbookId}
            initialCoverUrl={currentTextbook.coverUrl ?? null}
            onCoverUpdated={handleCoverUpdated}
          />
        )}
        <WordSearchPanel />
        {textbookId && unitNumber !== null && (
          <>
            <WordList />

            <div className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold">课文句子管理</h2>
            </div>
            <SentenceList />
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 运行 typecheck**

```bash
pnpm run build 2>&1 | head -30
```

Expected: 无报错。

---

### Task 7: TextbookGallery 封面展示

**Files:**
- Modify: `src/apps/english/components/TextbookGallery.tsx`

- [ ] **Step 1: 在卡片中展示封面图片**

在 `TextbookGallery.tsx` 的卡片头部，将固定的 `book-one` 图标替换为条件渲染：

将：

```tsx
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon icon="icon-park-outline:book-one" className="size-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="truncate text-base">{tb.name}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
```

替换为：

```tsx
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                            {tb.coverUrl
                              ? (
                                  <img
                                    src={tb.coverUrl}
                                    alt={tb.name}
                                    className="size-full object-cover"
                                  />
                                )
                              : (
                                  <Icon icon="icon-park-outline:book-one" className="size-5 text-primary" />
                                )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="truncate text-base">{tb.name}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
```

- [ ] **Step 2: 确认 `EnglishTextbook` 类型包含 `coverUrl`**

`EnglishTextbook` 类型从 `englishTextbook` schema 推导（Task 3 已加列），`tb.coverUrl` 会自动出现在类型中，无需手动修改类型。

- [ ] **Step 3: 运行 typecheck**

```bash
pnpm run build 2>&1 | head -30
```

Expected: 无报错。

---

### Task 8: 整体验证

**Files:** 无新文件

- [ ] **Step 1: 运行 lint**

```bash
npx eslint --fix .
```

Expected: 自动修复格式问题，无 error。

- [ ] **Step 2: 运行完整构建**

```bash
pnpm run build
```

Expected: `astro check` + `astro build` + `copy-fonts` 全部成功。

- [ ] **Step 3: 手动验证**

1. 启动 dev server：`pnpm dev`
2. 访问 `/english/admin`
3. 选择一本教材 → 确认「教材封面」卡片出现，显示占位图标
4. 点击「上传封面」→ 选择一张图片 → 确认上传成功，缩略图更新
5. 刷新页面 → 确认封面持久化
6. 访问 `/english/gallery` → 确认对应教材卡片展示了封面图
7. 回到管理页面，再次上传替换 → 确认旧图被替换
