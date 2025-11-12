import { NextRequest, NextResponse } from "next/server";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { provideResumeSuggestions } from "@/lib/tools/resume-suggestions";
import { SYSTEM_PROMPT } from "@/constants/system-prompt";
import { addExperience } from "@/lib/tools/add-experience";
import { getInformation } from "@/lib/tools/get-information";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const documentId = body.documentId;

    const systemPrompt = documentId
      ? `${SYSTEM_PROMPT}\n\nNote: The user is currently editing document ID ${documentId}. When providing resume suggestions, you can reference this document.`
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
        getInformation,
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
