import { NextResponse } from "next/server";
import { deleteFromStorage } from "@/lib/firebase/storage";

// POST handler for asset deletion
export async function POST(request: Request) {
  try {
    // Extract filePath from request body
    const formData = await request.formData();
    const filePath = formData.get("filePath") as string | null;

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: "File path is required" },
        { status: 400 }
      );
    }

    // const result = await deleteCourseImage(courseId, fileName);
    const result = await deleteFromStorage(filePath);

    if (!result.success) {
      throw new Error(result.error || "Failed to delete asset");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
