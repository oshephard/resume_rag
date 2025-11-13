import { tool } from "ai";
import z from "zod";
import { getContextForQuery } from "../rag";

export const getInformation = (contextIds?: number[] | null) =>
  tool({
    description: "Get information from the database",
    inputSchema: z.object({
      query: z
        .string()
        .describe("The query to get information from the database"),
    }),
    execute: async ({ query }) => {
      const context = await getContextForQuery(query, 10, contextIds);
      return context;
    },
  });
