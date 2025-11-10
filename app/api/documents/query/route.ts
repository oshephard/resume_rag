import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getContextForQuery } from "@/lib/rag";

export async function POST(request: NextRequest) {
  try {
    const { query: userQuery } = await request.json();

    if (!userQuery || typeof userQuery !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const context = await getContextForQuery(userQuery, 5);

    if (!context) {
      return NextResponse.json({
        answer:
          "I don't have any documents in the database yet. Please upload a document first.",
      });
    }

    const systemPrompt = `You are a helpful assistant answering questions about a resume/CV. 
You MUST base your answers ONLY on the provided resume context. 

Rules:
- Use ONLY information from the resume context provided below
- If the resume doesn't contain information to answer the question, say "Based on the resume, I don't have information about [specific thing]"
- Be accurate and specific - cite details from the resume when possible
- If asked about something not in the resume, clearly state it's not mentioned
- Do not make up or infer information that isn't explicitly in the resume`;

    const { text: answer } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: `RESUME CONTEXT:
${context}

USER QUESTION: ${userQuery}

Based on the resume context above, please answer the user's question. Only use information that is explicitly stated in the resume context.`,
      temperature: 0.3, // Lower temperature for more factual, consistent answers
    });

    return NextResponse.json({
      answer,
      context: context.substring(0, 500) + "...",
    });
  } catch (error: any) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process query" },
      { status: 500 }
    );
  }
}
