import { NextRequest, NextResponse } from "next/server";
import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { getContextForQuery } from "@/lib/rag";
import { provideResumeSuggestions } from "@/lib/tools/resume-suggestions";
import { SYSTEM_PROMPT } from "@/app/constants/system-prompt";
import { addExperience } from "@/lib/tools/add-experience";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: SYSTEM_PROMPT,
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
        provideResumeSuggestions,
        addExperience,
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
