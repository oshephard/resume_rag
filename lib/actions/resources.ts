"use server";

import { db } from "../db";
import { documents, embeddings } from "@/lib/db/schema";
import { chunkText, generateEmbeddings } from "@/lib/embeddings";
import { eq } from "drizzle-orm";

export async function createResource({
  content,
  name,
}: {
  content: string;
  name?: string;
}) {
  try {
    const documentName = name || `Document ${Date.now()}`;

    const [document] = await db
      .insert(documents)
      .values({
        name: documentName,
        content: content,
      })
      .returning();

    const documentId = document.id;

    const chunks = chunkText(content);

    if (chunks.length === 0) {
      throw new Error("No chunks created from content");
    }

    const embeddingArrays = await generateEmbeddings(chunks);

    for (let i = 0; i < chunks.length; i++) {
      if (!embeddingArrays[i] || !Array.isArray(embeddingArrays[i])) {
        console.error(`Invalid embedding at index ${i}:`, embeddingArrays[i]);
        throw new Error(`Invalid embedding at index ${i}`);
      }

      const embeddingArray = embeddingArrays[i];
      if (embeddingArray.length === 0) {
        throw new Error(`Empty embedding at index ${i}`);
      }

      if (
        !embeddingArray.every((val) => typeof val === "number" && isFinite(val))
      ) {
        console.error(
          `Invalid embedding values at index ${i}:`,
          embeddingArray.slice(0, 10)
        );
        throw new Error(`Embedding at index ${i} contains non-numeric values`);
      }

      if (embeddingArray.length !== 1536) {
        // Dimension mismatch - continue but note it may affect search quality
      }

      try {
        await db.insert(embeddings).values({
          documentId: documentId,
          chunkText: chunks[i],
          embedding: embeddingArray,
          chunkIndex: i,
        });
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

export async function updateResource({
  documentId,
  content,
  name,
}: {
  documentId: number;
  content: string;
  name?: string;
}) {
  try {
    await db
      .update(documents)
      .set({
        content: content,
        ...(name && { name }),
      })
      .where(eq(documents.id, documentId));

    await db.delete(embeddings).where(eq(embeddings.documentId, documentId));

    const chunks = chunkText(content);

    if (chunks.length === 0) {
      throw new Error("No chunks created from content");
    }

    const embeddingArrays = await generateEmbeddings(chunks);

    for (let i = 0; i < chunks.length; i++) {
      if (!embeddingArrays[i] || !Array.isArray(embeddingArrays[i])) {
        console.error(`Invalid embedding at index ${i}:`, embeddingArrays[i]);
        throw new Error(`Invalid embedding at index ${i}`);
      }

      const embeddingArray = embeddingArrays[i];
      if (embeddingArray.length === 0) {
        throw new Error(`Empty embedding at index ${i}`);
      }

      if (
        !embeddingArray.every((val) => typeof val === "number" && isFinite(val))
      ) {
        console.error(
          `Invalid embedding values at index ${i}:`,
          embeddingArray.slice(0, 10)
        );
        throw new Error(`Embedding at index ${i} contains non-numeric values`);
      }

      try {
        await db.insert(embeddings).values({
          documentId: documentId,
          chunkText: chunks[i],
          embedding: embeddingArray,
          chunkIndex: i,
        });
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
    console.error("Error updating resource:", error);
    throw new Error(`Failed to update resource: ${error.message}`);
  }
}

export async function deleteResource(documentId: number) {
  try {
    await db.delete(documents).where(eq(documents.id, documentId));

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error deleting resource:", error);
    throw new Error(`Failed to delete resource: ${error.message}`);
  }
}
