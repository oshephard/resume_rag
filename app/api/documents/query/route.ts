import { NextRequest, NextResponse } from "next/server";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { provideResumeSuggestions } from "@/lib/tools/resume-suggestions";
import { SYSTEM_PROMPT } from "@/constants/system-prompt";
import { addExperience } from "@/lib/tools/add-experience";
import { getInformation } from "@/lib/tools/get-information";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const documentId = body.documentId;
    const contextIds = body.contextIds || (documentId ? [documentId] : null);

    let resumeId: number | null = null;
    if (contextIds && contextIds.length > 0) {
      const docs = await db
        .select({ id: documents.id, type: documents.type })
        .from(documents)
        .where(inArray(documents.id, contextIds));
      const resumeDoc = docs.find((doc) => doc.type === "resume");
      if (resumeDoc) {
        resumeId = resumeDoc.id;
      }
    } else if (documentId) {
      const doc = await db
        .select({ type: documents.type })
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      if (doc.length > 0 && doc[0].type === "resume") {
        resumeId = documentId;
      }
    }

    let systemPrompt = SYSTEM_PROMPT;
    if (resumeId) {
      systemPrompt = `${SYSTEM_PROMPT}\n\nNote: The user is currently viewing resume ID ${resumeId}. When answering questions, focus on this resume, but you can also reference other documents (experiences, certifications, etc.) for context.`;
    } else if (contextIds && contextIds.length > 0) {
      const contextNames = await db
        .select({ name: documents.name })
        .from(documents)
        .where(inArray(documents.id, contextIds));
      const namesList = contextNames.map((d) => d.name).join(", ");
      systemPrompt = `${SYSTEM_PROMPT}\n\nNote: The user has selected the following documents as context: ${namesList}.`;
    } else if (documentId) {
      systemPrompt = `${SYSTEM_PROMPT}\n\nNote: The user is currently viewing document ID ${documentId}.`;
    }

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
        provideResumeSuggestions: provideResumeSuggestions(
          documentId,
          contextIds
        ),
        addExperience,
        getInformation: getInformation(contextIds),
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
