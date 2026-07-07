CREATE TABLE "chinese_lesson_text" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"category" text NOT NULL,
	"title" text,
	"author" text,
	"dynasty" text,
	"content" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chinese_lesson_text_lesson_position_unique" UNIQUE("lesson_id","position")
);
--> statement-breakpoint
ALTER TABLE "chinese_lesson_text" ADD CONSTRAINT "chinese_lesson_text_lesson_id_chinese_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."chinese_lesson"("id") ON DELETE no action ON UPDATE no action;