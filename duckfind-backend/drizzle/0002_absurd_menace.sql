ALTER TABLE "users" ADD COLUMN "resume_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "resume_keywords" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "resume_uploaded_at" timestamp;