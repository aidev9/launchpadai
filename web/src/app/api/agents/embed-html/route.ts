import { NextRequest, NextResponse } from "next/server";
import { generateEmbedHtml } from "@/app/actions/generate-embed-html";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get("agentId");
    const agentName = searchParams.get("agentName") || "Agent";

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    // Use the origin from the request
    const origin = new URL(request.url).origin;

    // Generate the HTML content
    const htmlContent = await generateEmbedHtml(agentId, agentName, origin);

    // Create a sanitized filename
    const filename = `${agentName.toLowerCase().replace(/[^a-z0-9]/gi, "-")}-embed.html`;

    // Return the HTML as a downloadable file
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error serving embed HTML:", error);
    return NextResponse.json(
      { error: "Failed to generate embed HTML" },
      { status: 500 }
    );
  }
}
