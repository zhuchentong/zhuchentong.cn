CREATE TABLE "workbook_sentence" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_id" integer NOT NULL,
	"sentence" text NOT NULL,
	"translation" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbook_textbook" (
	"id" serial PRIMARY KEY NOT NULL,
	"stage" text NOT NULL,
	"name" text NOT NULL,
	"publisher" text NOT NULL,
	"grade" text,
	"semester" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbook_unit" (
	"id" serial PRIMARY KEY NOT NULL,
	"textbook_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit_number" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbook_unit_word" (
	"unit_id" integer NOT NULL,
	"word_id" integer NOT NULL,
	CONSTRAINT "workbook_unit_word_unit_id_word_id_pk" PRIMARY KEY("unit_id","word_id")
);
--> statement-breakpoint
CREATE TABLE "workbook_word" (
	"id" serial PRIMARY KEY NOT NULL,
	"word" text NOT NULL,
	"phonetic" text,
	"meaning" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workbook_word_word_unique" UNIQUE("word")
);
--> statement-breakpoint
ALTER TABLE "workbook_sentence" ADD CONSTRAINT "workbook_sentence_word_id_workbook_word_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."workbook_word"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbook_unit" ADD CONSTRAINT "workbook_unit_textbook_id_workbook_textbook_id_fk" FOREIGN KEY ("textbook_id") REFERENCES "public"."workbook_textbook"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbook_unit_word" ADD CONSTRAINT "workbook_unit_word_unit_id_workbook_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."workbook_unit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbook_unit_word" ADD CONSTRAINT "workbook_unit_word_word_id_workbook_word_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."workbook_word"("id") ON DELETE no action ON UPDATE no action;