import { integer, pgTable, primaryKey, serial, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// ===== 英语单词数据库表 =====

// 1. 课本表
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

// 2. 单词表（去重）
export const englishWord = pgTable('english_word', {
  id: serial('id').primaryKey(),
  word: text('word').unique().notNull(),
  phonetic: text('phonetic'),
  meaning: text('meaning').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 3. 课本-单词关联表（含单元号，合并原 unit 表）
export const englishTextbookWord = pgTable('english_textbook_word', {
  textbookId: integer('textbook_id').references(() => englishTextbook.id).notNull(),
  wordId: integer('word_id').references(() => englishWord.id).notNull(),
  unitNumber: integer('unit_number').notNull(),
  position: integer('position').notNull().default(0),
}, table => [
  primaryKey({ columns: [table.textbookId, table.wordId, table.unitNumber] }),
])

// 4. 单词例句表
export const englishWordSentence = pgTable('english_word_sentence', {
  id: serial('id').primaryKey(),
  wordId: integer('word_id').references(() => englishWord.id).notNull(),
  sentence: text('sentence').notNull(),
  translation: text('translation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [
  unique('english_word_sentence_word_id_sentence_unique').on(table.wordId, table.sentence),
])

// 5. 课文句子表（与课本单元直接关联）
export const englishSentence = pgTable('english_sentence', {
  id: serial('id').primaryKey(),
  textbookId: integer('textbook_id').references(() => englishTextbook.id).notNull(),
  unitNumber: integer('unit_number').notNull(),
  sentence: text('sentence').notNull(),
  translation: text('translation'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [
  unique('english_sentence_textbook_unit_position_unique').on(table.textbookId, table.unitNumber, table.position),
])

// 6. 单元元数据表（标题/排序，可选；无记录的课本回退到由句子/单词派生单元）
export const englishUnit = pgTable('english_unit', {
  textbookId: integer('textbook_id').references(() => englishTextbook.id).notNull(),
  unitNumber: integer('unit_number').notNull(),
  title: text('title'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [
  primaryKey({ columns: [table.textbookId, table.unitNumber] }),
])

// ===== 类型导出 =====

// 课本表
export type EnglishTextbook = typeof englishTextbook.$inferSelect
export type NewEnglishTextbook = typeof englishTextbook.$inferInsert

// 单词表
export type EnglishWord = typeof englishWord.$inferSelect
export type NewEnglishWord = typeof englishWord.$inferInsert

// 课本-单词关联表
export type EnglishTextbookWord = typeof englishTextbookWord.$inferSelect
export type NewEnglishTextbookWord = typeof englishTextbookWord.$inferInsert

// 单词例句表
export type EnglishWordSentence = typeof englishWordSentence.$inferSelect
export type NewEnglishWordSentence = typeof englishWordSentence.$inferInsert

// 课文句子表
export type EnglishSentence = typeof englishSentence.$inferSelect
export type NewEnglishSentence = typeof englishSentence.$inferInsert

// 单元元数据表
export type EnglishUnit = typeof englishUnit.$inferSelect
export type NewEnglishUnit = typeof englishUnit.$inferInsert

// ===== 语文数据库表 =====

// 1. 语文教材表
export const chineseTextbook = pgTable('chinese_textbook', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  publisher: text('publisher').notNull(),
  grade: text('grade'),
  semester: text('semester'),
  coverUrl: text('cover_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 2. 单元表
export const chineseUnit = pgTable('chinese_unit', {
  id: serial('id').primaryKey(),
  textbookId: integer('textbook_id').references(() => chineseTextbook.id).notNull(),
  unitNumber: integer('unit_number').notNull(),
  title: text('title'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [
  unique('chinese_unit_textbook_unit_unique').on(table.textbookId, table.unitNumber),
])

// 3. 篇目表（课文 + 语文园地统一表，靠 type 区分）
export const chineseLesson = pgTable('chinese_lesson', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id').references(() => chineseUnit.id).notNull(),
  lessonNumber: integer('lesson_number'), // 全书店号（1-27），语文园地为 null
  title: text('title'),
  type: text('type').notNull(), // 'text' 课文 | 'garden' 语文园地
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [
  unique('chinese_lesson_unit_position_unique').on(table.unitId, table.position),
])

// 4. 全局字库表（去重）
export const chineseCharacter = pgTable('chinese_character', {
  id: serial('id').primaryKey(),
  character: text('character').unique().notNull(),
  pinyin: text('pinyin'), // 主音
  radical: text('radical'), // 部首
  strokes: integer('strokes'), // 笔画数
  structure: text('structure'), // 间架结构
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 5. 字↔篇目关联表（区分一类/二类，关联表可覆盖多音字读音）
export const chineseLessonCharacter = pgTable('chinese_lesson_character', {
  lessonId: integer('lesson_id').references(() => chineseLesson.id).notNull(),
  characterId: integer('character_id').references(() => chineseCharacter.id).notNull(),
  category: text('category').notNull(), // 'one' 一类字 | 'two' 二类字
  pinyin: text('pinyin'), // 可选，覆盖多音字本课读音
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [
  primaryKey({ columns: [table.lessonId, table.characterId, table.category] }),
])

// 6. 词语库表（去重）
export const chineseWord = pgTable('chinese_word', {
  id: serial('id').primaryKey(),
  word: text('word').unique().notNull(),
  pinyin: text('pinyin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 7. 词语↔篇目关联表
export const chineseLessonWord = pgTable('chinese_lesson_word', {
  lessonId: integer('lesson_id').references(() => chineseLesson.id).notNull(),
  wordId: integer('word_id').references(() => chineseWord.id).notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, table => [
  primaryKey({ columns: [table.lessonId, table.wordId] }),
])

// ===== 类型导出 =====

// 教材表
export type ChineseTextbook = typeof chineseTextbook.$inferSelect
export type NewChineseTextbook = typeof chineseTextbook.$inferInsert

// 单元表
export type ChineseUnit = typeof chineseUnit.$inferSelect
export type NewChineseUnit = typeof chineseUnit.$inferInsert

// 篇目表
export type ChineseLesson = typeof chineseLesson.$inferSelect
export type NewChineseLesson = typeof chineseLesson.$inferInsert

// 字库表
export type ChineseCharacter = typeof chineseCharacter.$inferSelect
export type NewChineseCharacter = typeof chineseCharacter.$inferInsert

// 字↔篇目关联表
export type ChineseLessonCharacter = typeof chineseLessonCharacter.$inferSelect
export type NewChineseLessonCharacter = typeof chineseLessonCharacter.$inferInsert

// 词语库表
export type ChineseWord = typeof chineseWord.$inferSelect
export type NewChineseWord = typeof chineseWord.$inferInsert

// 词语↔篇目关联表
export type ChineseLessonWord = typeof chineseLessonWord.$inferSelect
export type NewChineseLessonWord = typeof chineseLessonWord.$inferInsert
