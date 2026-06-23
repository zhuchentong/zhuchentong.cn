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
