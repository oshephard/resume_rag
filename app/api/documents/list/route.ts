import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const allDocuments = await db
      .select({
        id: documents.id,
        name: documents.name,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .orderBy(desc(documents.createdAt));

    return NextResponse.json({
      success: true,
      documents: allDocuments,
    });
  } catch (error: any) {
    console.error("Failed to fetch documents: ", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
