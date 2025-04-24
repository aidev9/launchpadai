"use server";

import { NextRequest, NextResponse } from "next/server";
import { getProjectNotes, deleteNote } from "@/lib/firebase/notes";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) {
    return NextResponse.json(
      { success: false, error: "Missing productId" },
      { status: 400 }
    );
  }
  const result = await getProjectNotes(productId);
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  const { productId, noteIds } = await req.json();
  if (!productId || !Array.isArray(noteIds)) {
    return NextResponse.json(
      { success: false, error: "Missing productId or noteIds" },
      { status: 400 }
    );
  }
  try {
    await Promise.all(noteIds.map((id: string) => deleteNote(productId, id)));
    return NextResponse.json({ success: true });
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
