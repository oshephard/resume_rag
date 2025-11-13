import { generateEmbedding } from "./embeddings";
import { db } from "./db";
import { embeddings, documents } from "./db/schema";
import { cosineDistance, sql, desc } from "drizzle-orm";
import { eq } from "drizzle-orm";

export async function findSimilarChunks(
  queryEmbedding: number[],
  limit: number = 5,
  resumeId?: number | null
): Promise<Array<{ chunk_text: string; document_id: number; name: string }>> {
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    queryEmbedding
  )})`;

  let query = db
    .select({
      chunk_text: embeddings.chunkText,
      document_id: embeddings.documentId,
      name: documents.name,
      similarity: similarity,
    })
    .from(embeddings)
    .innerJoin(documents, eq(embeddings.documentId, documents.id));

  if (resumeId) {
    query = query.where(eq(documents.id, resumeId)) as typeof query;
  }

  const result = await query.orderBy(desc(similarity)).limit(limit);

  return result.map((row) => ({
    chunk_text: row.chunk_text,
    document_id: row.document_id,
    name: row.name,
  }));
}

export async function getContextForQuery(
  userQuery: string,
  maxChunks: number = 5,
  resumeId?: number | null
): Promise<string> {
  const queryEmbedding = await generateEmbedding(userQuery);
  const similarChunks = await findSimilarChunks(
    queryEmbedding,
    maxChunks,
    resumeId
  );

  if (similarChunks.length === 0) {
    return "";
  }

  return similarChunks
    .map((chunk, index) => {
      return `--- SECTION ${index + 1} FROM: ${chunk.name} ---\n${
        chunk.chunk_text
      }`;
    })
    .join("\n\n");
}
