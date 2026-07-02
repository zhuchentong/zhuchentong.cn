CREATE TABLE "chinese_character" (
	"id" serial PRIMARY KEY NOT NULL,
	"character" text NOT NULL,
	"pinyin" text,
	"radical" text,
	"strokes" integer,
	"structure" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chinese_character_character_unique" UNIQUE("character")
);
--> statement-breakpoint
CREATE TABLE "chinese_lesson" (
	"id" serial PRIMARY KEY NOT NULL,
	"unit_id" integer NOT NULL,
	"lesson_number" integer,
	"title" text,
	"type" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chinese_lesson_unit_position_unique" UNIQUE("unit_id","position")
);
--> statement-breakpoint
CREATE TABLE "chinese_lesson_character" (
	"lesson_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"category" text NOT NULL,
	"pinyin" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chinese_lesson_character_lesson_id_character_id_category_pk" PRIMARY KEY("lesson_id","character_id","category")
);
--> statement-breakpoint
CREATE TABLE "chinese_lesson_word" (
	"lesson_id" integer NOT NULL,
	"word_id" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chinese_lesson_word_lesson_id_word_id_pk" PRIMARY KEY("lesson_id","word_id")
);
--> statement-breakpoint
CREATE TABLE "chinese_textbook" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"publisher" text NOT NULL,
	"grade" text,
	"semester" text,
	"cover_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chinese_unit" (
	"id" serial PRIMARY KEY NOT NULL,
	"textbook_id" integer NOT NULL,
	"unit_number" integer NOT NULL,
	"title" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chinese_unit_textbook_unit_unique" UNIQUE("textbook_id","unit_number")
);
--> statement-breakpoint
CREATE TABLE "chinese_word" (
	"id" serial PRIMARY KEY NOT NULL,
	"word" text NOT NULL,
	"pinyin" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chinese_word_word_unique" UNIQUE("word")
);
--> statement-breakpoint
ALTER TABLE "chinese_lesson" ADD CONSTRAINT "chinese_lesson_unit_id_chinese_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."chinese_unit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chinese_lesson_character" ADD CONSTRAINT "chinese_lesson_character_lesson_id_chinese_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."chinese_lesson"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chinese_lesson_character" ADD CONSTRAINT "chinese_lesson_character_character_id_chinese_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."chinese_character"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chinese_lesson_word" ADD CONSTRAINT "chinese_lesson_word_lesson_id_chinese_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."chinese_lesson"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chinese_lesson_word" ADD CONSTRAINT "chinese_lesson_word_word_id_chinese_word_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."chinese_word"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chinese_unit" ADD CONSTRAINT "chinese_unit_textbook_id_chinese_textbook_id_fk" FOREIGN KEY ("textbook_id") REFERENCES "public"."chinese_textbook"("id") ON DELETE no action ON UPDATE no action;