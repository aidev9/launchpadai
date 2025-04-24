"use server";

import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { xpActions } from "./points-schedule";
import { revalidatePath } from "next/cache";

/**
 * Awards XP points to a user for a specific action
 * @param actionId The ID of the action from the points schedule
 * @param userId Optional user ID, will use current authenticated user if not provided
 */
export async function awardXpPoints(actionId: string, userId?: string) {
  try {
    // Get user ID if not provided
    let userIdToUse = userId;

    if (!userIdToUse) {
      try {
        userIdToUse = await getCurrentUserId();
      } catch (authError) {
        console.warn("Cannot get current user ID:", authError);
        return {
          success: false,
          error: "User not authenticated or session expired",
        };
      }
    }

    if (!userIdToUse) {
      console.error("Cannot award XP: No user ID available");
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Find the action in the points schedule
    const action = xpActions.find((a) => a.id === actionId);

    if (!action) {
      console.error(`XP action not found: ${actionId}`);
      return {
        success: false,
        error: `Invalid action ID: ${actionId}`,
      };
    }

    // Update the user's XP in Firestore
    const userRef = adminDb.collection("users").doc(userIdToUse);

    // Get current user data
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();

      // Check if xp field exists
      if (userData && "xp" in userData) {
        // Update existing user document
        await userRef.update({
          xp: userData.xp + action.points,
        });
      } else {
        // User exists but doesn't have xp field
        await userRef.update({
          xp: action.points,
        });
      }
    } else {
      // Create user document if it doesn't exist
      await userRef.set(
        {
          xp: action.points,
        },
        { merge: true }
      );
    }

    // Log the XP award
    console.log(
      `Awarded ${action.points} XP to user ${userIdToUse} for ${action.name}`
    );

    // Revalidate paths that might display XP
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/ftux");

    return {
      success: true,
      action,
      pointsAwarded: action.points,
    };
  } catch (error) {
    console.error("Error awarding XP:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Gets the current XP for a user
 * @param userId Optional user ID, will use current authenticated user if not provided
 */
export async function getUserXp(userId?: string) {
  try {
    // Get user ID if not provided
    const userIdToUse = userId || (await getCurrentUserId());

    if (!userIdToUse) {
      console.error("Cannot get XP: No user ID available");
      return {
        success: false,
        error: "User not authenticated",
        xp: 0,
      };
    }

    // Get the user document from Firestore
    const userRef = adminDb.collection("users").doc(userIdToUse);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      return {
        success: true,
        xp: userData?.xp || 0,
      };
    } else {
      return {
        success: true,
        xp: 0,
      };
    }
  } catch (error) {
    console.error("Error getting user XP:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      xp: 0,
    };
  }
}
