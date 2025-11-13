import { createResource } from "@/lib/actions/resources";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";

async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Handle PDFs using AI SDK
  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    const buffer = Buffer.from(await file.arrayBuffer());

    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL text content from this PDF file. Return the complete text content exactly as it appears, preserving structure and formatting where possible. Include all sections, headings, bullet points, and details.`,
            },
            {
              type: "file",
              mediaType: "application/pdf",
              data: buffer,
              filename: file.name,
            },
          ],
        },
      ],
    });

    return text;
  }

  // For text files, read as text
  return await file.text();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = (formData.get("name") as string) || file.name;
    const type = (formData.get("type") as string) || "other";
    const tagsStr = formData.get("tags") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (type !== "resume" && type !== "other") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'resume' or 'other'" },
        { status: 400 }
      );
    }

    const tags = tagsStr
      ? tagsStr
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    // Extract text from file (handles both PDF and text files)
    const text = await extractTextFromFile(file);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "File is empty or could not be read" },
        { status: 400 }
      );
    }

    // Store the document and generate embeddings
    const result = await createResource({
      content: text,
      name: name,
      type: type as "resume" | "other",
      tags: tags,
    });

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      chunksProcessed: result.chunksProcessed,
      message: "Document uploaded and processed successfully",
    });
  } catch (error: any) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process file" },
      { status: 500 }
    );
  }
}
