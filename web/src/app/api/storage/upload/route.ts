import { NextRequest, NextResponse } from "next/server";
import { uploadAsset } from "@/lib/firebase/storage";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// POST handler for asset upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("file") as File | null;
    const uploadUrl = formData.get("uploadUrl") as string | null;
    const fileType = image?.type || "image/jpeg"; // Default to JPEG if type is not available

    // Convert file to buffer
    if (!image) {
      return NextResponse.json(
        { success: false, error: "No asset provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${image.name.replace(/\s+/g, "-").toLowerCase()}`;
    const url = uploadUrl + "/" + fileName;
    const result = await uploadAsset(buffer, url, fileType);

    if (!result.success) {
      throw new Error(result.error || "Failed to upload image");
    }

    // Return the image URL
    return NextResponse.json({
      success: true,
      url: result.url,
      filePath: result.filePath,
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
