# 单词数据库表结构设计

## 概述

为单词学习功能设计的数据库表结构，支持多课本、多单元、单词去重与例句管理。

**数据库**：PostgreSQL
**ORM**：Drizzle ORM (v0.45.2)
**表名前缀**：`wordbook_`

## 设计目标

| 需求场景         | 说明                                                 |
| ---------------- | ---------------------------------------------------- |
| 按课本单元查单词 | 查询「人教版 三年级下 Unit1」相关单词                |
| 按单词反查出处   | 查询「apple」出现在哪些书、哪些单元                  |
| 支持学段区分     | 区分小学 / 初中 / 高中                               |
| 支持无单元课本   | 如「小学重点1000词汇」直接是单词列表（unitNumber=0） |
| 单词去重         | 同一单词跨年级、跨课本重复学习时只存一份             |
| 多例句支持       | 一个单词可关联多个例句                               |
| 例句去重         | 同一单词下相同例句不重复存储                         |

## ER 关系图

```
wordbook_textbook (课本表)
    ├── stage: 小学 / 初中 / 高中
    ├── publisher: 人教版 / 外研版 ...
    └── N:N（通过 wordbook_textbook_word）
            wordbook_textbook_word (关联表，含单元号)
                ├── textbook_id (FK)
                ├── unit_number: 1 / 2 / 3 ...（0 = 无单元课本）
                ├── word_id (FK)
                └── N:1
                    wordbook_word (单词表, 去重)
                        ├── word (UNIQUE)
                        └── 1:N
                            wordbook_sentence (例句表)
```

**关系说明**：

- `wordbook_textbook` N:N `wordbook_word`（通过 `wordbook_textbook_word` 关联，关联表内联 `unitNumber` 表示该词在该课本的哪个单元）
- `wordbook_word` 1:N `wordbook_sentence`（一个单词有多个例句）

> **设计取舍**：单元（Unit 1/2/3…）没有独立元数据，因此不单独建表，而是把单元号内联到关联表，避免为纯数字冗余建表。单元显示名由 `unitNumber` 派生（`Unit {n}`）。

## 表结构详细设计

### 1. wordbook_textbook（课本表）

存储课本基本信息，区分学段、出版社、年级、学期。

| 字段         | 类型      | 约束                    | 说明                                             |
| ------------ | --------- | ----------------------- | ------------------------------------------------ |
| `id`         | serial    | PK                      | 主键                                             |
| `stage`      | text      | NOT NULL                | 学段：`小学` / `初中` / `高中`                   |
| `name`       | text      | NOT NULL                | 课本名称（如「三年级下册」「小学重点1000词汇」） |
| `publisher`  | text      | NOT NULL                | 出版社（如「人教版」「外研版」）                 |
| `grade`      | text      | NULL                    | 年级（如「三年级」「高一」）                     |
| `semester`   | text      | NULL                    | 学期：`上` / `下`                                |
| `created_at` | timestamp | NOT NULL, DEFAULT now() | 创建时间                                         |

**设计说明**：

- `grade` 和 `semester` 允许为空，用于「小学重点1000词汇」这类不区分年级学期的词汇书。

### 2. wordbook_word（单词表，去重）

存储单词基本信息，单词唯一去重。

| 字段         | 类型      | 约束                    | 说明                   |
| ------------ | --------- | ----------------------- | ---------------------- |
| `id`         | serial    | PK                      | 主键                   |
| `word`       | text      | NOT NULL, UNIQUE        | 单词（唯一，避免重复） |
| `phonetic`   | text      | NULL                    | 音标（如 `/ˈæpl/`）    |
| `meaning`    | text      | NOT NULL                | 中文释义               |
| `created_at` | timestamp | NOT NULL, DEFAULT now() | 创建时间               |

**设计说明**：

- `word` 字段设置 `UNIQUE` 约束，同一单词在表中只存一份。
- 当同一单词出现在不同课本、不同单元时，通过关联表 `wordbook_textbook_word` 建立关系，单词本体零冗余。
- 修改单词音标或释义时只需更新一处，所有课本同步生效。

### 3. wordbook_textbook_word（课本-单词关联表）

实现课本与单词的多对多关系，并内联单元号，联合主键。

| 字段          | 类型    | 约束                                | 说明                                     |
| ------------- | ------- | ----------------------------------- | ---------------------------------------- |
| `textbook_id` | integer | FK → wordbook_textbook.id, NOT NULL | 关联课本                                 |
| `word_id`     | integer | FK → wordbook_word.id, NOT NULL     | 关联单词                                 |
| `unit_number` | integer | NOT NULL                            | 单元号：`1`/`2`/`3`…，`0` 表示无单元课本 |

**约束**：

- 联合主键：`(textbook_id, word_id, unit_number)`，防止同一单词在同一课本的同一单元重复关联；允许同一单词出现在同课本不同单元（unit_number 不同）。

**设计说明**：

- 单元不单独建表：单元只是「某课本下的一个编号」，无标题/主题等独立属性，故把单元号内联到关联表。
- 单元显示名由 `unit_number` 派生：`Unit {n}`（`0` 时不显示单元）。

### 4. wordbook_sentence（例句表）

存储单词的例句，支持一个单词多个例句。

| 字段          | 类型      | 约束                            | 说明     |
| ------------- | --------- | ------------------------------- | -------- |
| `id`          | serial    | PK                              | 主键     |
| `word_id`     | integer   | FK → wordbook_word.id, NOT NULL | 关联单词 |
| `sentence`    | text      | NOT NULL                        | 英文例句 |
| `translation` | text      | NULL                            | 中文翻译 |
| `created_at`  | timestamp | NOT NULL, DEFAULT now()         | 创建时间 |

**约束**：

- 唯一约束：`(word_id, sentence)`，防止同一单词下重复添加相同例句。

**设计说明**：

- 一个单词可关联多条例句（1:N 关系）。
- `translation` 允许为空，部分例句可不提供翻译。

## Drizzle Schema 定义

文件位置：`src/database/schema.ts`

```typescript
import { integer, pgTable, primaryKey, serial, text, timestamp, unique } from 'drizzle-orm/pg-core'

// ===== 现有表（保留）=====
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ===== 单词数据库表 =====

// 1. 课本表
export const wordbookTextbook = pgTable('wordbook_textbook', {
  id: serial('id').primaryKey(),
  stage: text('stage').notNull(),
  name: text('name').notNull(),
  publisher: text('publisher').notNull(),
  grade: text('grade'),
  semester: text('semester'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 2. 单词表（去重）
export const wordbookWord = pgTable('wordbook_word', {
  id: serial('id').primaryKey(),
  word: text('word').unique().notNull(),
  phonetic: text('phonetic'),
  meaning: text('meaning').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 3. 课本-单词关联表（含单元号，合并原 unit 表）
export const wordbookTextbookWord = pgTable('wordbook_textbook_word', {
  textbookId: integer('textbook_id').references(() => wordbookTextbook.id).notNull(),
  wordId: integer('word_id').references(() => wordbookWord.id).notNull(),
  unitNumber: integer('unit_number').notNull(),
}, table => [
  primaryKey({ columns: [table.textbookId, table.wordId, table.unitNumber] }),
])

// 4. 例句表
export const wordbookSentence = pgTable('wordbook_sentence', {
  id: serial('id').primaryKey(),
  wordId: integer('word_id').references(() => wordbookWord.id).notNull(),
  sentence: text('sentence').notNull(),
  translation: text('translation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [
  unique('wordbook_sentence_word_id_sentence_unique').on(table.wordId, table.sentence),
])
```

## 查询场景示例

### 场景 1：查询「人教版 三年级下 Unit1」的单词

```typescript
import { and, eq } from 'drizzle-orm'
import { db } from '@/database'
import { wordbookTextbook, wordbookTextbookWord, wordbookWord } from '@/database/schema'

const words = await db
  .select({
    word: wordbookWord.word,
    phonetic: wordbookWord.phonetic,
    meaning: wordbookWord.meaning,
  })
  .from(wordbookTextbookWord)
  .innerJoin(wordbookWord, eq(wordbookTextbookWord.wordId, wordbookWord.id))
  .innerJoin(wordbookTextbook, eq(wordbookTextbookWord.textbookId, wordbookTextbook.id))
  .where(and(
    eq(wordbookTextbook.publisher, '人教版'),
    eq(wordbookTextbook.grade, '三年级'),
    eq(wordbookTextbook.semester, '下'),
    eq(wordbookTextbookWord.unitNumber, 1),
  ))
```

### 场景 2：查询「apple」出现在哪些书、哪些单元

```typescript
const locations = await db
  .select({
    stage: wordbookTextbook.stage,
    textbookName: wordbookTextbook.name,
    publisher: wordbookTextbook.publisher,
    grade: wordbookTextbook.grade,
    semester: wordbookTextbook.semester,
    unitNumber: wordbookTextbookWord.unitNumber,
  })
  .from(wordbookWord)
  .innerJoin(wordbookTextbookWord, eq(wordbookWord.id, wordbookTextbookWord.wordId))
  .innerJoin(wordbookTextbook, eq(wordbookTextbookWord.textbookId, wordbookTextbook.id))
  .where(eq(wordbookWord.word, 'apple'))
```

### 场景 3：查询小学所有课本

```typescript
const textbooks = await db
  .select()
  .from(wordbookTextbook)
  .where(eq(wordbookTextbook.stage, '小学'))
```

### 场景 4：查询某课本已有的单元号

```typescript
const rows = await db
  .selectDistinct({ n: wordbookTextbookWord.unitNumber })
  .from(wordbookTextbookWord)
  .where(eq(wordbookTextbookWord.textbookId, textbookId))
  .orderBy(asc(wordbookTextbookWord.unitNumber))
const unitNumbers = rows.map(r => r.n)
```

### 场景 5：查询单词的例句

```typescript
const sentences = await db
  .select({
    sentence: wordbookSentence.sentence,
    translation: wordbookSentence.translation,
  })
  .from(wordbookSentence)
  .where(eq(wordbookSentence.wordId, wordId))
```

## 数据示例

### 课本数据

| id  | stage | name             | publisher | grade  | semester |
| --- | ----- | ---------------- | --------- | ------ | -------- |
| 1   | 小学  | 三年级下册       | 人教版    | 三年级 | 下       |
| 2   | 小学  | 小学重点1000词汇 | 人教版    | NULL   | NULL     |

### 单词数据（去重）

| id  | word   | phonetic   | meaning |
| --- | ------ | ---------- | ------- |
| 1   | apple  | /ˈæpl/     | 苹果    |
| 2   | banana | /bəˈnɑːnə/ | 香蕉    |

### 关联数据（含单元号）

| textbook_id | word_id | unit_number | 含义                           |
| ----------- | ------- | ----------- | ------------------------------ |
| 1           | 1       | 1           | 三年级下册 Unit1 有 apple      |
| 1           | 2       | 1           | 三年级下册 Unit1 有 banana     |
| 1           | 1       | 3           | 三年级下册 Unit3 也有 apple    |
| 2           | 1       | 0           | 重点1000词汇（无单元）有 apple |

### 例句数据

| id  | word_id | sentence                              | translation              |
| --- | ------- | ------------------------------------- | ------------------------ |
| 1   | 1       | I like apples.                        | 我喜欢苹果。             |
| 2   | 1       | An apple a day keeps the doctor away. | 一天一苹果，医生远离我。 |

## 实施步骤

1. **更新 Schema**：将表定义写入 `src/database/schema.ts`
2. **生成迁移文件**：`pnpm db:generate`
3. **执行迁移**：`pnpm db:migrate`
4. **验证表结构**：`pnpm db:studio` 可视化检查

## 技术依据

- Drizzle ORM 联合主键 API：`primaryKey({ columns: [...] })`
- Drizzle ORM 唯一约束 API：`unique('name').on(table.col1, table.col2)`
- Drizzle ORM 外键 API：`integer().references(() => table.column)`
- PostgreSQL 原生支持 serial、text、integer、timestamp、联合主键、唯一约束
- 单元作为纯数字属性内联到关联表，避免为无独立元数据的实体冗余建表
