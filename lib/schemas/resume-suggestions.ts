import { z } from "zod";

export const resumeSuggestionsInputSchema = z.object({
  query: z
    .string()
    .describe(
      "The user's question or request about resume improvements or incorporating experience"
    ),
});

export const diffOperationSchema = z.union([
  z.object({
    type: z.literal("insert"),
    section: z
      .string()
      .optional()
      .describe(
        "The section name where this change should be applied (e.g., 'Work Experience', 'Skills')"
      ),
    line: z
      .number()
      .optional()
      .describe(
        "The line number (0-indexed) where this insertion should occur"
      ),
    newText: z.string().describe("The text content to insert"),
  }),
  z.object({
    type: z.literal("delete"),
    section: z
      .string()
      .optional()
      .describe("The section name where this change should be applied"),
    line: z
      .number()
      .optional()
      .describe("The line number (0-indexed) of the content to delete"),
    oldText: z.string().describe("The text content to delete"),
  }),
  z.object({
    type: z.literal("replace"),
    section: z
      .string()
      .optional()
      .describe("The section name where this change should be applied"),
    line: z
      .number()
      .optional()
      .describe("The line number (0-indexed) of the content to replace"),
    oldText: z.string().describe("The current text content"),
    newText: z.string().describe("The replacement text content"),
  }),
]);

export const resumeSuggestionsWithDiffsSchema = z.object({
  suggestions: z
    .string()
    .describe(
      "Human-readable text suggestions explaining the improvements and how to incorporate experience into the resume. Be detailed and actionable."
    ),
  operations: z
    .array(diffOperationSchema)
    .describe(
      "Structured diff operations representing the precise changes needed. Only include operations for content that actually needs to change."
    ),
  summary: z
    .string()
    .optional()
    .describe("Brief summary of the changes being made"),
});
