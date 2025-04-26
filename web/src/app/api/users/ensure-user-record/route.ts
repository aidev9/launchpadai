import { NextRequest, NextResponse } from "next/server";
import { syncUserWithFirestore } from "@/lib/firebase/users";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

// Define the expected request body interface
interface RequestData {
  idToken?: string;
  userId?: string;
  userData?: Record<string, any>;
  force?: boolean;
  bypassAuth?: boolean;
}

/**
 * API endpoint that attempts to ensure a user record exists in Firestore
 * This runs server-side after successful login
 */
export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;
    let requestData: RequestData = {};

    try {
      requestData = (await request.json()) as RequestData;
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Check for session cookie first (preferred auth method)
    const sessionCookie = request.cookies.get("session")?.value;

    if (sessionCookie) {
      try {
        // Verify the session cookie
        const decodedClaims =
          await adminAuth.verifySessionCookie(sessionCookie);
        userId = decodedClaims.uid;
      } catch (verifyError) {
        console.error("Session verification error:", verifyError);
        // If session verification fails, we'll try the ID token next
      }
    }

    // If session auth failed, try ID token auth
    if (!userId && requestData.idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(requestData.idToken);
        userId = decodedToken.uid;
        console.log("User authenticated with ID token:", userId);
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        return NextResponse.json(
          { success: false, error: "Invalid token" },
          { status: 401 }
        );
      }
    }

    // If neither auth method worked, use the explicit userId as a last resort
    // but only in development for easier testing
    if (
      !userId &&
      process.env.NODE_ENV === "development" &&
      requestData.userId &&
      requestData.bypassAuth === true
    ) {
      console.warn("⚠️ Using bypass auth mode (development only)");
      userId = requestData.userId;
    }

    // If we still don't have a userId, authentication has failed
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get the existing user data first to preserve important fields
    const userRef = adminDb.collection("users").doc(userId);
    const userSnapshot = await userRef.get();
    const userExists = userSnapshot.exists;
    const existingUserData = userExists ? userSnapshot.data() || {} : {};

    // Use userData if provided directly, helpful during social sign-in
    const userData = requestData.userData || {};

    // Only set default values if the user doesn't exist yet
    if (!userExists) {
      // Add userType and subscription if not already set
      if (!userData.userType) {
        userData.userType = "user"; // Default user type
      }

      if (!userData.subscription) {
        userData.subscription = "free"; // Default subscription
      }
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

    // If user exists and we're not forcing an update, return success
    if (userExists && !requestData.force) {
      return NextResponse.json({
        success: true,
        message: "User record already exists",
        existed: true,
      });
    }

    // Create or update the user record in Firestore
    const newUserData: Record<string, any> = {
      // Start with the existing data to preserve fields like userType
      ...existingUserData,
      // Add new data from request
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    if (!userExists) {
      // Add creation timestamp for new users
      newUserData.createdAt = new Date().toISOString();
    }

    // Write to Firestore
    await userRef.set(newUserData, { merge: true });

    return NextResponse.json({
      success: true,
      message: userExists
        ? "User record updated successfully"
        : "User record created successfully",
      existed: userExists,
    });
  } catch (error) {
    console.error("Error ensuring user record:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
