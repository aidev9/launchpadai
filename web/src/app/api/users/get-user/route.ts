import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

/**
 * API endpoint to get a user's data from Firestore
 * Used by middleware for authorization checks
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user ID from the query string
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    // If no uid provided, return an error
    if (!uid) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get the session cookie to verify authentication
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
      // Verify the session cookie
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);

      // Only allow users to access their own data or superadmins to access any data
      if (decodedClaims.uid !== uid) {
        // Check if the requesting user is a superadmin
        const requestingUserRef = adminDb
          .collection("users")
          .doc(decodedClaims.uid);
        const requestingUserDoc = await requestingUserRef.get();
        const requestingUserData = requestingUserDoc.data();

        if (
          !requestingUserData ||
          requestingUserData.userType !== "superadmin"
        ) {
          return NextResponse.json(
            { error: "Unauthorized to access this user's data" },
            { status: 403 }
          );
        }
      }

      // Get user data from Firestore
      const userRef = adminDb.collection("users").doc(uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Get user data
      const userData = userDoc.data();

      // Return user data (filtering sensitive fields if needed)
      return NextResponse.json({
        uid,
        displayName: userData?.name || userData?.displayName,
        email: userData?.email,
        photoURL: userData?.photoURL,
        userType: userData?.userType || "user", // Default to "user" if not set
        subscription: userData?.subscription || "free", // Default to "free" if not set
        createdAt: userData?.createdAt,
      });
    } catch (error) {
      console.error("Session verification error:", error);
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error retrieving user:", error);
    return NextResponse.json(
      { error: "Failed to retrieve user data" },
      { status: 500 }
    );
  }
}
