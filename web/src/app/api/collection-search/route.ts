import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { searchDocumentChunks } from "@/app/(protected)/mycollections/actions";

export async function POST(req: NextRequest) {
  try {
    // Extract the query and collection ID from the request
    const { query, collectionId } = await req.json();

    if (!query || !collectionId) {
      return NextResponse.json(
        { error: "Query and collectionId are required" },
        { status: 400 }
      );
    }

    // Get current user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Search for document chunks
    const searchResults = await searchDocumentChunks(
      query,
      collectionId,
      1, // Page
      5 // Results per page - limit to top 5 for relevance
    );

    // Return the search results
    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("Error processing search request:", error);
    return NextResponse.json(
      { error: "Error processing your request" },
      { status: 500 }
    );
  }
}
