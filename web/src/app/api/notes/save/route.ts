import { NextRequest, NextResponse } from "next/server";
import { saveNote } from "@/lib/firebase/notes";

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
