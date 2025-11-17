import { tool } from "ai";
import { z } from "zod";
import { createResource } from "../actions/resources";

export const addJobPosting = tool({
  description:
    "Save a job posting to the user's document collection. The user will provide the job posting text and optionally a link to the posting.",
  inputSchema: z.object({
    jobPosting: z
      .string()
      .describe("The full text content of the job posting"),
    link: z
      .string()
      .describe("Optional URL/link to the job posting")
      .optional(),
  }),
  execute: async ({ jobPosting, link }) => {
    const timestamp = new Date().toISOString();
    const documentName = `Job Posting - ${timestamp}`;

    const jobPostingParts = [
      jobPosting,
      link && `\nLink: ${link}`,
    ].filter(Boolean);

    const content = jobPostingParts.join("\n");

    const result = await createResource({
      content: content.trim(),
      name: documentName,
      type: "other",
      tags: ["job"],
    });

    return {
      success: true,
      documentId: result.documentId,
      chunksProcessed: result.chunksProcessed,
      message:
        "Job posting saved successfully and is now available for RAG queries.",
    };
  },
});

