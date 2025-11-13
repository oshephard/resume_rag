CREATE TYPE "public"."document_type" AS ENUM('resume', 'other');--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "type" "document_type" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;