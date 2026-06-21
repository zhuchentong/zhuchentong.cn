-- 重命名表：wordbook_ 前缀 → english_ 前缀
ALTER TABLE "wordbook_textbook" RENAME TO "english_textbook";--> statement-breakpoint
ALTER TABLE "wordbook_word" RENAME TO "english_word";--> statement-breakpoint
ALTER TABLE "wordbook_textbook_word" RENAME TO "english_textbook_word";--> statement-breakpoint
ALTER TABLE "wordbook_sentence" RENAME TO "english_sentence";--> statement-breakpoint
-- 重命名外键约束
ALTER TABLE "english_textbook_word" RENAME CONSTRAINT "wordbook_textbook_word_textbook_id_wordbook_textbook_id_fk" TO "english_textbook_word_textbook_id_english_textbook_id_fk";--> statement-breakpoint
ALTER TABLE "english_textbook_word" RENAME CONSTRAINT "wordbook_textbook_word_word_id_wordbook_word_id_fk" TO "english_textbook_word_word_id_english_word_id_fk";--> statement-breakpoint
ALTER TABLE "english_sentence" RENAME CONSTRAINT "wordbook_sentence_word_id_wordbook_word_id_fk" TO "english_sentence_word_id_english_word_id_fk";--> statement-breakpoint
-- 重命名联合主键约束
ALTER TABLE "english_textbook_word" RENAME CONSTRAINT "wordbook_textbook_word_textbook_id_word_id_unit_number_pk" TO "english_textbook_word_textbook_id_word_id_unit_number_pk";--> statement-breakpoint
-- 重命名唯一约束
ALTER TABLE "english_word" RENAME CONSTRAINT "wordbook_word_word_unique" TO "english_word_word_unique";--> statement-breakpoint
ALTER TABLE "english_sentence" RENAME CONSTRAINT "wordbook_sentence_word_id_sentence_unique" TO "english_sentence_word_id_sentence_unique";
