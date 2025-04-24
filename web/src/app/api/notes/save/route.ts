import { NextRequest, NextResponse } from "next/server";
import { saveNote } from "@/lib/firebase/notes";
import { awardXpPoints } from "@/xp/server-actions";

export async function POST(req: NextRequest) {
  try {
    const { productId, noteData } = await req.json();

    if (!productId || !noteData || !noteData.id) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await saveNote(productId, noteData);

    if (result.success && !noteData.isUpdated) {
      try {
        await awardXpPoints("create_note");
      } catch (xpError) {
        console.error(`Failed to award XP for note creation:`, xpError);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
