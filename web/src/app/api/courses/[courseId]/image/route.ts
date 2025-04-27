import { NextResponse } from "next/server";
import { uploadCourseImage, deleteCourseImage } from "@/lib/firebase/storage";

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// POST handler for image upload
export async function POST(request: Request) {
  try {
    // Extract courseId from URL path
    const url = new URL(request.url);
    const courseId = url.pathname.split("/").slice(-2)[0];

    const formData = await request.formData();
    const image = formData.get("image") as File | null;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image must be less than 5MB" },
        { status: 400 }
      );
    }

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

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const fileName = `${timestamp}-${image.name.replace(/\s+/g, "-").toLowerCase()}`;

    const result = await uploadCourseImage(courseId, buffer, fileName);

    if (!result.success) {
      throw new Error(result.error || "Failed to upload image");
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      fileName: fileName,
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

// DELETE handler for image deletion
export async function DELETE(request: Request) {
  try {
    // Extract courseId from URL path
    const url = new URL(request.url);
    const courseId = url.pathname.split("/").slice(-2)[0];
    const fileName = url.searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "Filename is required" },
        { status: 400 }
      );
    }

    const result = await deleteCourseImage(courseId, fileName);

    if (!result.success) {
      throw new Error(result.error || "Failed to delete image");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
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
