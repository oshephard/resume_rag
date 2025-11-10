import { tool } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getContextForQuery } from "@/lib/rag";

const resumeSuggestionsSchema = z.object({
  query: z
    .string()
    .describe(
      "The user's question or request about resume improvements or incorporating experience"
    ),
});

export const provideResumeSuggestions = tool({
  description:
    "Provide suggestions on how to improve a resume or incorporate experience into a resume. Use this tool when the user asks for resume advice, suggestions on how to add experience, or how to improve their resume.",
  inputSchema: resumeSuggestionsSchema,
  execute: async ({ query }) => {
    const context = await getContextForQuery(query, 10);

    if (!context) {
      return {
        suggestions:
          "I don't have any documents in the database yet. Please upload a document or add an experience first.",
      };
    }

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
  },
});
