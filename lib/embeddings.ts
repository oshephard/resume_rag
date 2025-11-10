import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export function chunkText(text: string): string[] {
  const chunks: string[] = [];

  if (!text || text.length === 0) {
    return chunks;
  }

  let start = 0;

  while (start < text.length) {
    // Calculate the end of this chunk
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end);

    // Only add non-empty chunks
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // If we've reached the end of the text, we're done
    if (end >= text.length) {
      break;
    }

    // Calculate next start position with overlap
    const nextStart = end - CHUNK_OVERLAP;

    // Ensure we always make progress (next start must be > current start)
    if (nextStart > start) {
      start = nextStart;
    } else {
      // If overlap would prevent progress, move forward by CHUNK_SIZE
      // This should only happen if CHUNK_SIZE <= CHUNK_OVERLAP (which shouldn't happen)
      start = end;
    }

    // Safety check to prevent infinite loops
    if (chunks.length > 10000) {
      throw new Error(
        "Too many chunks generated. Text may be too large or chunking logic has an issue."
      );
    }
  }

  return chunks;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: [text],
  });

  if (!embeddings || embeddings.length === 0 || !embeddings[0]) {
    throw new Error("Failed to generate embedding");
  }

  return embeddings[0];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: texts,
  });

  if (!embeddings || embeddings.length !== texts.length) {
    throw new Error(
      `Expected ${texts.length} embeddings, got ${embeddings?.length || 0}`
    );
  }

  return embeddings;
}
