import { NextRequest, NextResponse } from "next/server";
import { createResource } from "@/lib/actions/resources";

export async function POST(request: NextRequest) {
  try {
    const { experience } = await request.json();

    if (!experience || typeof experience !== "string" || experience.trim().length === 0) {
      return NextResponse.json(
        { error: "Experience text is required" },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const documentName = `Experience - ${timestamp}`;

    const result = await createResource({
      content: experience.trim(),
      name: documentName,
    });

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      chunksProcessed: result.chunksProcessed,
      message: "Experience stored successfully and is now available for RAG queries.",
    });
  } catch (error: any) {
    console.error("Failed to store experience: ", error);
    return NextResponse.json(
      { error: error.message || "Failed to store experience" },
      { status: 500 }
    );
  }
}

