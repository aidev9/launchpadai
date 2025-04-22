import { NextResponse } from "next/server";
import fs from "fs/promises";
import { cookies } from "next/headers";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

// Following the exact Next.js route handler pattern for dynamic routes
export async function GET(request: Request) {
  // Get the id from the URL path
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  try {
    // Verify user is authenticated
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const filePath = `/tmp/${id}`;

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath);

    // Set Content-Disposition header to trigger download
    const fileName = `launchpad-assets-${new Date().toISOString().split("T")[0]}.zip`;

    // Set headers for file download
    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename=${fileName}`);
    headers.set("Content-Type", "application/zip");

    // Return the file as a response
    return new NextResponse(fileBuffer, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
