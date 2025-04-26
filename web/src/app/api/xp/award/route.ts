import { NextRequest, NextResponse } from "next/server";
import { awardXpPoints } from "@/xp/server-actions";
import { adminAuth } from "@/lib/firebase/admin";

// Define the expected request body interface
interface XpAwardRequestData {
  actionId: string;
  idToken?: string;
}

/**
 * API endpoint for awarding XP points to the current user
 * This is called from client-side code when actions that award XP are performed
 */
export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as XpAwardRequestData;
    const { actionId, idToken } = data;

    if (!actionId) {
      return NextResponse.json(
        { success: false, error: "Action ID is required" },
        { status: 400 }
      );
    }

    let userId: string | undefined = undefined;

    // First, check for session cookie authentication
    const sessionCookie = request.cookies.get("session")?.value;
    if (sessionCookie) {
      try {
        const decodedClaims =
          await adminAuth.verifySessionCookie(sessionCookie);
        userId = decodedClaims.uid;
      } catch (verifyError) {
        console.error("Session verification error:", verifyError);
        // If session verification fails, we'll try the ID token next
      }
    }

    // If session auth failed, try ID token auth
    if (!userId && idToken) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        userId = decodedToken.uid;
        console.log("User authenticated with ID token for XP award:", userId);
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        return NextResponse.json(
          { success: false, error: "Invalid authentication" },
          { status: 401 }
        );
      }
    }

    // Award XP to the user
    const result = await awardXpPoints(actionId, userId);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to award XP",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action: result.action,
      pointsAwarded: result.pointsAwarded,
    });
  } catch (error) {
    console.error("Error in XP award API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
