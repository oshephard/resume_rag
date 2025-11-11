CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"chunk_text" text NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"chunk_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "embeddings_document_id_idx" ON "embeddings" USING btree ("document_id");