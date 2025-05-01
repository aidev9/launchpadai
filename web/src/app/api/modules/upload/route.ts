// /api/modules/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadModuleAsset } from "@/lib/firebase/storage";
import { MAX_FILE_SIZE } from "@/utils/constants";

export async function POST(request: NextRequest) {
  console.log("UPLOAD API CALLED");
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const courseId = formData.get("courseId") as string;
    const moduleId = formData.get("moduleId") as string;

    // Validate inputs
    if (!file || !courseId || !moduleId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // File size validation (5MB limit)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // File type validation based on upload type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/zip",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Supported types: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate sanitized filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, "-");
    const fileName = `${timestamp}-${originalName}`;

    // Upload based on type
    const result = await uploadModuleAsset(
      buffer,
      courseId,
      moduleId,
      fileName,
      file.type
    );

    if (result.success) {
      return NextResponse.json({ success: true, url: result.url });
    } else {
      return NextResponse.json(
        { error: result.error || "Upload failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Module upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
