import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/firebase/products";

export async function GET() {
  try {
    const result = await getAllProducts();

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.authError ? 401 : 500 }
      );
    }
  } catch (error) {
    console.error("Error in GET /api/products:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
