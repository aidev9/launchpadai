import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

// Session expiry in seconds (14 days)
const SESSION_EXPIRY = 60 * 60 * 24 * 14;

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      console.error("Session creation failed: No ID token provided");
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    console.log(
      "Attempting to create session cookie with token length:",
      idToken.length
    );

    // First verify the token to ensure it's valid
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken, true); // Force refresh check
      console.log("ID token successfully verified for user:", decodedToken.uid);
    } catch (verifyError) {
      console.error("ID token verification failed:", verifyError);

      // Provide more detailed error information
      const errorDetails = {
        message:
          verifyError instanceof Error
            ? verifyError.message
            : "Unknown verification error",
        // code:
        //   verifyError instanceof Error
        //     ? (verifyError as any).code
        //     : "unknown_error",
      };

      console.error("Verification error details:", errorDetails);

      return NextResponse.json(
        {
          error: "Invalid ID token",
          details: errorDetails,
        },
        { status: 401 }
      );
    }

    // Create a session cookie using the Firebase Admin SDK
    try {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_EXPIRY * 1000, // Firebase uses milliseconds
      });

      // Create a response with detailed info
      const response = NextResponse.json({
        success: true,
        message: "Session created successfully",
        cookieLength: sessionCookie.length,
        uid: decodedToken.uid,
      });

      // Set the cookie on the response with more cross-browser compatible options
      response.cookies.set("session", sessionCookie, {
        // Use maxAge for better browser compatibility
        maxAge: SESSION_EXPIRY,
        // HttpOnly to prevent JavaScript access
        httpOnly: true,
        // Only use secure in production to support local development
        secure: process.env.NODE_ENV === "production",
        // Essential for the cookie to be sent on all routes
        path: "/",
        // Use lax for better compatibility with redirects
        sameSite: "lax",
      });

      console.log("Session cookie set successfully:", {
        cookieLength: sessionCookie.length,
        cookieName: "session",
        expiresIn: SESSION_EXPIRY,
        uid: decodedToken.uid,
      });

      return response;
    } catch (cookieError) {
      console.error("Failed to create session cookie:", cookieError);

      // Provide more detailed error information
      const errorMessage =
        cookieError instanceof Error
          ? cookieError.message
          : "Unknown cookie creation error";

      return NextResponse.json(
        {
          error: "Failed to create session cookie",
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to process authentication:", error);

    // Provide more detailed error information
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        error: "Failed to process authentication",
        details: errorMessage,
      },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  // Create a response
  const response = NextResponse.json({
    success: true,
    message: "Session cookie cleared",
  });

  // Clear the session cookie
  response.cookies.delete("session");

  console.log("Session cookie deleted");

  return response;
}
