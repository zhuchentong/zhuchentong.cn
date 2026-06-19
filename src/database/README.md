# Database 模块

本模块使用 Drizzle ORM 管理 PostgreSQL 数据库。

## 文件结构

```
src/database/
├── index.ts          # 数据库连接配置
├── schema.ts         # 数据库 schema 定义
├── migrations/       # 迁移文件目录
└── README.md         # 本文档
```

## 使用方法

### 1. 生成迁移文件

```bash
pnpm db:generate
```

### 2. 运行迁移

```bash
pnpm db:migrate
```

### 3. 直接推送 schema 更改（开发用）

```bash
pnpm db:push
```

### 4. 启动 Drizzle Studio（数据库管理界面）

```bash
pnpm db:studio
```

## 在代码中使用数据库

### 导入数据库实例

```typescript
import { db } from '@/database'
import { users } from '@/database/schema'
```

### 查询示例

```typescript
// 查询所有用户
const allUsers = await db.select().from(users)

// 插入新用户
const newUser = await db.insert(users).values({
  name: '张三',
  email: 'zhangsan@example.com',
}).returning()

// 更新用户
await db.update(users)
  .set({ name: '李四' })
  .where(eq(users.email, 'zhangsan@example.com'))

// 删除用户
await db.delete(users)
  .where(eq(users.email, 'zhangsan@example.com'))
```

## 环境变量

确保 `.env` 文件包含以下变量：

```
DATABASE_HOST=39.107.90.188
DATABASE_PORT=5432
DATABASE_USER=zhuchentong
DATABASE_PASSWORD=zhuchentong
DATABASE_DB=zhuchentong
```

## 添加新表

1. 在 `schema.ts` 中定义新表
2. 运行 `pnpm db:generate` 生成迁移文件
3. 运行 `pnpm db:migrate` 应用迁移

## 注意事项

- 迁移文件保存在 `src/database/migrations/` 目录下
- 使用 `postgres` 驱动以获得更好的性能
- 数据库连接信息从环境变量读取
