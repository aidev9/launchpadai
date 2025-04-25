import { NextResponse } from "next/server";
import { migrateAllProductQuestions } from "@/lib/firebase/products";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

export async function POST() {
  try {
    // Check if user is authenticated
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized", message: "You must be logged in" },
          { status: 401 }
        );
      }
    } catch (authError) {
      console.error("Authentication error during migration:", authError);
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication failed" },
        { status: 401 }
      );
    }

    // Run the migration
    const result = await migrateAllProductQuestions();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: "Migration failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
