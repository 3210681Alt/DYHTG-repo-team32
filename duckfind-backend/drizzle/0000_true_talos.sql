CREATE TYPE "public"."course_type" AS ENUM('undergraduate', 'postgraduate', 'phd', 'other');--> statement-breakpoint
CREATE TYPE "public"."graduation_status" AS ENUM('graduated', 'not_graduated', 'expected');--> statement-breakpoint
CREATE TABLE "user_universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"university" text NOT NULL,
	"course" text NOT NULL,
	"course_type" "course_type" NOT NULL,
	"status" "graduation_status" NOT NULL,
	"graduation_date" date
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"resume_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user_universities" ADD CONSTRAINT "user_universities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;