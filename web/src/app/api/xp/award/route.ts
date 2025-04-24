import { NextRequest, NextResponse } from "next/server";
import { awardXpPoints } from "@/xp/server-actions";

/**
 * API endpoint for awarding XP points to the current user
 * This is called from client-side code when actions that award XP are performed
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { actionId } = data;

    if (!actionId) {
      return NextResponse.json(
        { success: false, error: "Action ID is required" },
        { status: 400 }
      );
    }

    // Award XP to the current user
    const result = await awardXpPoints(actionId);

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
