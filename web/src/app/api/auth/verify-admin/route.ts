import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

/**
 * API endpoint to verify if a user has admin privileges
 * Used by middleware for admin route protection
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session cookie from the request
    const sessionCookie = request.cookies.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify the session cookie with Firebase Admin
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
    const uid = decodedClaims.uid;

    if (!uid) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Get user data from Firestore to check userType
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user data
    const userData = userDoc.data();

    // Check if the user has admin privileges
    if (userData?.userType === "admin" || userData?.userType === "superadmin") {
      return NextResponse.json({
        isAdmin: true,
        userType: userData.userType,
      });
    } else {
      return NextResponse.json(
        { error: "Unauthorized - not an admin user" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Admin verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify admin status" },
      { status: 500 }
    );
  }
}
