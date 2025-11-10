import { query } from "./db";
import { generateEmbedding } from "./embeddings";

export async function findSimilarChunks(
  queryEmbedding: number[],
  limit: number = 5
): Promise<Array<{ chunk_text: string; document_id: number; name: string }>> {
  const embeddingString = `[${queryEmbedding.join(",")}]`;

  const result = await query(
    `SELECT 
      e.chunk_text,
      e.document_id,
      d.name,
      1 - (e.embedding <=> $1::vector) as similarity
    FROM embeddings e
    JOIN documents d ON e.document_id = d.id
    ORDER BY e.embedding <=> $1::vector
    LIMIT $2`,
    [embeddingString, limit]
  );

  return result.rows;
}

export async function getContextForQuery(
  userQuery: string,
  maxChunks: number = 5
): Promise<string> {
  const queryEmbedding = await generateEmbedding(userQuery);
  const similarChunks = await findSimilarChunks(queryEmbedding, maxChunks);

  if (similarChunks.length === 0) {
    return "";
  }

  // Format context with clear section markers and similarity scores for debugging
  return similarChunks
    .map((chunk, index) => {
      return `--- SECTION ${index + 1} FROM: ${chunk.name} ---\n${
        chunk.chunk_text
      }`;
    })
    .join("\n\n");
}
