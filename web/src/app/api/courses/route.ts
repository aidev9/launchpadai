import { NextRequest, NextResponse } from "next/server";
import { getAllCourses } from "@/lib/firebase/courses";

export async function GET(_request: NextRequest) {
  try {
    // Fetch all courses from Firestore
    const result = await getAllCourses();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Return the courses
    return NextResponse.json({
      success: true,
      courses: result.courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
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
