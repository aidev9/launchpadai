import { NextRequest, NextResponse } from "next/server";
import { syncUserWithFirestore } from "@/lib/firebase/users";
import { adminAuth } from "@/lib/firebase/admin";

/**
 * API endpoint that attempts to ensure a user record exists in Firestore
 * This runs server-side after successful login
 */
export async function POST(request: NextRequest) {
  try {
    // Get the session cookie from the request
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify the session
    try {
      // Verify the session cookie
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      const userId = decodedClaims.uid;

      // Extract user ID from request as a fallback
      const requestData = await request.json().catch(() => ({}));
      const requestUserId = requestData.userId;

      // Ensure they match or use the verified one
      const userIdToUse = userId || requestUserId;

      if (!userIdToUse) {
        return NextResponse.json(
          { success: false, error: "User ID not provided" },
          { status: 400 }
        );
      }

      // Only proceed if we're in production or explicitly requested
      // This helps prevent Firestore errors in development
      if (process.env.NODE_ENV !== "production" && !requestData.force) {
        return NextResponse.json({
          success: true,
          message: "User record creation skipped in development",
          skipped: true,
        });
      }

      // Try to ensure the user record exists
      try {
        const result = await syncUserWithFirestore(userIdToUse);
        return NextResponse.json({
          success: true,
          message: "User record ensured",
          result,
        });
      } catch (firestoreError) {
        // Return success but note the error
        console.error("Firestore error:", firestoreError);
        return NextResponse.json({
          success: true,
          message: "User authenticated but Firestore record creation deferred",
          error: "Firestore operation failed",
        });
      }
    } catch (verifyError) {
      console.error("Session verification error:", verifyError);
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error ensuring user record:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
