import { createResource } from "@/lib/actions/resources";
import { NextRequest, NextResponse } from "next/server";
import { getATSTemplate } from "@/lib/utils/resume-formatter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name || `Resume ${new Date().toLocaleDateString()}`;

    const template = getATSTemplate();

    const result = await createResource({
      content: template,
      name: name,
      type: "resume",
      tags: [],
    });

    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      chunksProcessed: result.chunksProcessed,
      message: "Resume created successfully",
    });
  } catch (error: any) {
    console.error("Error creating resume: ", error);
    return NextResponse.json(
      { error: error.message || "Failed to create resume" },
      { status: 500 }
    );
  }
}

