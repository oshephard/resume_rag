import { NextRequest, NextResponse } from "next/server";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { provideResumeSuggestions } from "@/lib/tools/resume-suggestions";
import { SYSTEM_PROMPT } from "@/constants/system-prompt";
import { addExperience } from "@/lib/tools/add-experience";
import { getInformation } from "@/lib/tools/get-information";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const documentId = body.documentId;

    let resumeId: number | null = null;
    if (documentId) {
      const doc = await db
        .select({ type: documents.type })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      if (doc.length > 0 && doc[0].type === "resume") {
        resumeId = documentId;
      }
    }

    const systemPrompt = resumeId
      ? `${SYSTEM_PROMPT}\n\nNote: The user is currently viewing resume ID ${resumeId}. When answering questions, focus on this resume, but you can also reference other documents (experiences, certifications, etc.) for context.`
      : documentId
        ? `${SYSTEM_PROMPT}\n\nNote: The user is currently viewing document ID ${documentId}.`
        : SYSTEM_PROMPT;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: body.messages
        ? convertToModelMessages(body.messages)
        : [
            {
              role: "user",
              content: body.query,
            },
          ],
      stopWhen: stepCountIs(5),
      tools: {
        provideResumeSuggestions: provideResumeSuggestions(documentId),
        addExperience,
        getInformation: getInformation(null),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Failed to process query: ", error);
    return NextResponse.json(
      { error: error.message || "Failed to process query" },
      { status: 500 }
    );
  }
}
