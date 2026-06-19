import { integer, pgTable, primaryKey, serial, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

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

// ===== 类型导出 =====

// 课本表
export type WordbookTextbook = typeof wordbookTextbook.$inferSelect
export type NewWordbookTextbook = typeof wordbookTextbook.$inferInsert

// 单词表
export type WordbookWord = typeof wordbookWord.$inferSelect
export type NewWordbookWord = typeof wordbookWord.$inferInsert

// 课本-单词关联表
export type WordbookTextbookWord = typeof wordbookTextbookWord.$inferSelect
export type NewWordbookTextbookWord = typeof wordbookTextbookWord.$inferInsert

// 例句表
export type WordbookSentence = typeof wordbookSentence.$inferSelect
export type NewWordbookSentence = typeof wordbookSentence.$inferInsert
