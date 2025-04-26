import { NextRequest, NextResponse } from "next/server";
import { addSampleCourses } from "@/lib/firebase/courses";

export async function POST(_request: NextRequest) {
  try {
    // Add sample courses to Firestore
    const result = await addSampleCourses();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error seeding courses:", error);
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
