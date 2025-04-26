import { NextRequest, NextResponse } from "next/server";
import { uploadCourseImage } from "@/lib/firebase/storage";

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    const courseId = formData.get("courseId") as string | null;

    // Validate inputs
    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Validate file size
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image must be less than 5MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(image.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type. Only JPEG, PNG, GIF and WEBP are supported",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${image.name.replace(/\s+/g, "-").toLowerCase()}`;

    // Upload the image to Firebase Storage
    const result = await uploadCourseImage(courseId, buffer, fileName);

    if (!result.success) {
      throw new Error(result.error || "Failed to upload image");
    }

    // Return the image URL
    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
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
