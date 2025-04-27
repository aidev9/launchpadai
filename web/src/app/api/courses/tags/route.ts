import { NextResponse } from "next/server";
import { getAllUniqueTags } from "@/lib/firebase/courses";

/**
 * GET /api/courses/tags
 * Returns all unique tags from all courses in the database
 */
export async function GET() {
  try {
    const response = await getAllUniqueTags();

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || "Failed to fetch tags" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tags: response.tags,
    });
  } catch (error) {
    console.error("Error in tags API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
