-- 重命名单词相关表：workbook_ 前缀 → wordbook_ 前缀
ALTER TABLE "workbook_textbook" RENAME TO "wordbook_textbook";--> statement-breakpoint
ALTER TABLE "workbook_unit" RENAME TO "wordbook_unit";--> statement-breakpoint
ALTER TABLE "workbook_word" RENAME TO "wordbook_word";--> statement-breakpoint
ALTER TABLE "workbook_unit_word" RENAME TO "wordbook_unit_word";--> statement-breakpoint
ALTER TABLE "workbook_sentence" RENAME TO "wordbook_sentence";--> statement-breakpoint
-- 重命名外键约束以匹配新表名（drizzle 命名约定）
ALTER TABLE "wordbook_sentence" RENAME CONSTRAINT "workbook_sentence_word_id_workbook_word_id_fk" TO "wordbook_sentence_word_id_wordbook_word_id_fk";--> statement-breakpoint
ALTER TABLE "wordbook_unit" RENAME CONSTRAINT "workbook_unit_textbook_id_workbook_textbook_id_fk" TO "wordbook_unit_textbook_id_wordbook_textbook_id_fk";--> statement-breakpoint
ALTER TABLE "wordbook_unit_word" RENAME CONSTRAINT "workbook_unit_word_unit_id_workbook_unit_id_fk" TO "wordbook_unit_word_unit_id_wordbook_unit_id_fk";--> statement-breakpoint
ALTER TABLE "wordbook_unit_word" RENAME CONSTRAINT "workbook_unit_word_word_id_workbook_word_id_fk" TO "wordbook_unit_word_word_id_wordbook_word_id_fk";--> statement-breakpoint
-- 重命名联合主键约束
ALTER TABLE "wordbook_unit_word" RENAME CONSTRAINT "workbook_unit_word_unit_id_word_id_pk" TO "wordbook_unit_word_unit_id_word_id_pk";--> statement-breakpoint
-- 重命名单词唯一约束
ALTER TABLE "wordbook_word" RENAME CONSTRAINT "workbook_word_word_unique" TO "wordbook_word_word_unique";--> statement-breakpoint
-- 新增例句去重唯一约束：(word_id, sentence)
ALTER TABLE "wordbook_sentence" ADD CONSTRAINT "wordbook_sentence_word_id_sentence_unique" UNIQUE ("word_id", "sentence");
