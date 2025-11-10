"use server";

import { query } from "@/lib/db";
import { chunkText, generateEmbeddings } from "@/lib/embeddings";

export async function createResource({
  content,
  name,
}: {
  content: string;
  name?: string;
}) {
  try {
    const documentName = name || `Document ${Date.now()}`;

    // Insert document
    const result = await query(
      "INSERT INTO documents (name, content) VALUES ($1, $2) RETURNING id",
      [documentName, content]
    );

    const documentId = result.rows[0].id;

    // Chunk the content
    console.info("Chunking content, length:", content.length);
    const chunks = chunkText(content);
    console.info("Chunks created:", chunks.length);

    if (chunks.length === 0) {
      throw new Error("No chunks created from content");
    }

    // Generate embeddings for all chunks
    console.info("Generating embeddings for", chunks.length, "chunks");
    const embeddings = await generateEmbeddings(chunks);

    console.info("Embeddings generated");
    console.debug(embeddings);

    // Store chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      if (!embeddings[i] || !Array.isArray(embeddings[i])) {
        console.error(`Invalid embedding at index ${i}:`, embeddings[i]);
        throw new Error(`Invalid embedding at index ${i}`);
      }

      const embeddingArray = embeddings[i];
      if (embeddingArray.length === 0) {
        throw new Error(`Empty embedding at index ${i}`);
      }

      // Validate embedding array contains only numbers
      if (
        !embeddingArray.every((val) => typeof val === "number" && isFinite(val))
      ) {
        console.error(
          `Invalid embedding values at index ${i}:`,
          embeddingArray.slice(0, 10)
        );
        throw new Error(`Embedding at index ${i} contains non-numeric values`);
      }

      // Check embedding dimension (should be 1536 for text-embedding-3-small)
      if (embeddingArray.length !== 1536) {
        console.warn(
          `Unexpected embedding dimension at index ${i}: expected 1536, got ${embeddingArray.length}`
        );
      }

      // Build embedding string more safely
      try {
        const embeddingString = `[${embeddingArray.join(",")}]`;
        await query(
          `INSERT INTO embeddings (document_id, chunk_text, embedding, chunk_index)
           VALUES ($1, $2, $3::vector, $4)`,
          [documentId, chunks[i], embeddingString, i]
        );
      } catch (dbError: any) {
        console.error(`Error inserting embedding at index ${i}:`, dbError);
        throw new Error(
          `Failed to insert embedding at index ${i}: ${dbError.message}`
        );
      }
    }

    return {
      success: true,
      documentId,
      chunksProcessed: chunks.length,
    };
  } catch (error: any) {
    console.error("Error creating resource:", error);
    throw new Error(`Failed to create resource: ${error.message}`);
  }
}
