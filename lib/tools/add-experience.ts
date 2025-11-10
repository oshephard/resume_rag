import { tool } from "ai";
import { z } from "zod";
import { createResource } from "../actions/resources";

export const addExperience = tool({
  description: "Add a new experience",
  inputSchema: z.object({
    experience: z.string().describe("The experience to add to your history"),
  }),
  execute: async ({ experience }) => {
    const timestamp = new Date().toISOString();
    const documentName = `Experience - ${timestamp}`;

    const result = await createResource({
      content: experience.trim(),
      name: documentName,
    });

    return {
      success: true,
      documentId: result.documentId,
      chunksProcessed: result.chunksProcessed,
      message:
        "Experience stored successfully and is now available for RAG queries.",
    };
  },
});
