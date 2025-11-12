import { tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { getContextForQuery } from "@/lib/rag";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  resumeSuggestionsInputSchema,
  resumeSuggestionsWithDiffsSchema,
} from "@/lib/schemas/resume-suggestions";

export function provideResumeSuggestions(documentId?: number | null) {
  return tool({
    description:
      "Provide suggestions on how to improve a resume or incorporate experience into a resume. Use this tool when the user asks for resume advice, suggestions on how to add experience, or how to improve their resume.",
    inputSchema: resumeSuggestionsInputSchema,
    execute: async ({ query }) => {
      const context = await getContextForQuery(query, 10);

      if (!context) {
        return {
          suggestions:
            "I don't have any documents in the database yet. Please upload a document or add an experience first.",
        };
      }

      let currentDocumentContent = "";
      if (documentId) {
        try {
          const doc = await db
            .select()
            .from(documents)
            .where(eq(documents.id, documentId))
            .limit(1);
          if (doc.length > 0) {
            currentDocumentContent = doc[0].content;
          }
        } catch (error) {
          console.error(
            "Failed to fetch document for diff generation: ",
            error
          );
        }
      }

      if (currentDocumentContent && documentId) {
        try {
          const lines = currentDocumentContent.split("\n");
          const { object } = await generateObject({
            model: openai("gpt-4o-mini"),
            schema: resumeSuggestionsWithDiffsSchema,
            system: `You are an expert resume advisor and editor helping users improve their resume.

Your task has two parts:
1. Provide human-readable text suggestions explaining how to improve the resume and incorporate experience
2. Generate structured diff operations that represent the precise changes needed

Guidelines for suggestions:
- Review ALL the provided context from their documents and experiences
- Provide specific suggestions on how to format, structure, and present their experience
- Suggest which sections to add experiences to (e.g., Work Experience, Projects, Skills, etc.)
- Recommend action verbs and quantifiable achievements where appropriate
- Suggest how to highlight relevant skills and accomplishments
- Be practical and actionable - focus on what they should add, how to phrase it, and where to place it

Guidelines for diff operations:
- Only include operations for content that actually needs to change
- Use "insert" to add new content at a specific location
- Use "delete" to remove existing content
- Use "replace" to modify existing content
- Include line numbers (0-indexed) when possible for precise placement
- Include section names when applicable (e.g., "Work Experience", "Skills", "Education")
- Be conservative - only suggest changes that directly address the user's request
- Maintain the existing structure and format of the resume
- For multi-line changes, use multiple operations
- Ensure oldText in replace/delete operations exactly matches the content in the current resume`,
            prompt: `CURRENT RESUME (${lines.length} lines):
${currentDocumentContent}

USER'S DOCUMENTATION AND EXPERIENCE:
${context}

USER REQUEST: ${query}

IMPORTANT: You must generate BOTH:
1. Detailed, actionable text suggestions on how to improve the resume
2. Structured diff operations (insert/delete/replace) that represent the precise changes needed

The operations array MUST contain at least one operation representing a concrete change to make. Do not return an empty operations array.`,
            temperature: 0.7,
          });

          console.log("Generated object:", JSON.stringify(object, null, 2));
          console.log("Operations count:", object.operations?.length || 0);

          return {
            suggestions: object.suggestions,
            structuredChanges: object.operations || [], // Always return array, never undefined
            documentId: documentId,
          };
        } catch (error) {
          console.error("Failed to generate suggestions and changes: ", error);
          throw error;
        }
      } else {
        const { text: suggestions } = await generateText({
          model: openai("gpt-4o-mini"),
          system: `You are an expert resume advisor helping users improve their resume. 
Your task is to analyze their experience and documentation, then provide specific, actionable suggestions on how to incorporate it into their resume.

Guidelines:
- Review ALL the provided context from their documents and experiences
- Provide specific suggestions on how to format, structure, and present their experience
- Suggest which sections to add experiences to (e.g., Work Experience, Projects, Skills, etc.)
- Recommend action verbs and quantifiable achievements where appropriate
- Suggest how to highlight relevant skills and accomplishments
- Consider the user's specific question or request when providing suggestions
- Be practical and actionable - focus on what they should add, how to phrase it, and where to place it
- If they mention a specific experience, focus on how to incorporate that into their resume`,
          prompt: `USER'S DOCUMENTATION AND EXPERIENCE:
${context}

USER REQUEST: ${query}

Based on all the documentation and experiences provided above, please provide specific suggestions on how to improve their resume and incorporate their experience. Be detailed and actionable.`,
          temperature: 0.7,
        });

        return {
          suggestions: suggestions,
        };
      }
    },
  });
}
