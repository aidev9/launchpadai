import { NextResponse } from "next/server";
import { addSampleCourses } from "@/lib/firebase/courses";

export async function POST() {
  try {
    const result = await addSampleCourses();

    if (!result.success) {
      throw new Error(result.error || "Failed to seed courses");
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Sample courses added successfully",
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
