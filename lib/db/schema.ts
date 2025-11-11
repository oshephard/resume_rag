import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  vector,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const embeddings = pgTable(
  "embeddings",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id")
      .references(() => documents.id, { onDelete: "cascade" })
      .notNull(),
    chunkText: text("chunk_text").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("embeddings_document_id_idx").on(table.documentId)]
);

export const documentsRelations = relations(documents, ({ many }) => ({
  embeddings: many(embeddings),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  document: one(documents, {
    fields: [embeddings.documentId],
    references: [documents.id],
  }),
}));
