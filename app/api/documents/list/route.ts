import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type");

    let query = db
      .select({
        id: documents.id,
        name: documents.name,
        type: documents.type,
        tags: documents.tags,
        createdAt: documents.createdAt,
      })
      .from(documents);

    if (type === "resume" || type === "other") {
      query = query.where(eq(documents.type, type)) as typeof query;
    }

    const allDocuments = await query.orderBy(desc(documents.createdAt));

    const resumes = allDocuments.filter((doc) => doc.type === "resume");
    const otherDocuments = allDocuments.filter((doc) => doc.type === "other");

    return NextResponse.json({
      success: true,
      documents: allDocuments,
      resumes,
      otherDocuments,
    });
  } catch (error: any) {
    console.error("Failed to fetch documents: ", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
