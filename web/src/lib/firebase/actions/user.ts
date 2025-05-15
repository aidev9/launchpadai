"use server";

import { adminDb } from "../admin";
import { awardXpPoints } from "@/xp/server-actions";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { initializePromptCredits } from "@/lib/firebase/prompt-credits";

/**
 * Server action to ensure a user record exists in Firestore
 * @param userId The Firebase Auth user ID
 * @param userData User data to store in Firestore
 * @returns Object indicating success/failure and if the user record already existed
 */
export async function ensureUserInFirestoreAction(
  userId: string,
  userData: {
    name: string;
    email: string;
    photoURL: string;
    provider: string;
    xp?: number;
    createdAt: number;
  }
) {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    // Get reference to the user document
    const userRef = adminDb.collection("users").doc(userId);

    // Check if user already exists
    const userDoc = await userRef.get();
    const userExists = userDoc.exists;

    // If user exists and we're not forcing an update, return success
    if (userExists) {
      return {
        success: true,
        message: "User record already exists",
        existed: true,
      };
    }

    // Set default values for xp if not provided
    const userDataWithDefaults = {
      ...userData,
      xp: userData.xp || 0,
      updatedAt: getCurrentUnixTimestamp(),
    };

    // Create user record in Firestore
    await userRef.set(userDataWithDefaults, { merge: true });

    // Award XP points for new signup
    try {
      await awardXpPoints("signup", userId);
      console.log(`Awarded XP to user ${userId} for signing up`);
    } catch (xpError) {
      console.error("Error awarding XP points:", xpError);
    }

    // Initialize prompt credits for the user (default to "free" plan for social sign-ins)
    try {
      await initializePromptCredits(userId, "free");
      console.log(
        `Initialized prompt credits for user ${userId} with free plan`
      );
    } catch (creditsError) {
      console.error("Error initializing prompt credits:", creditsError);
    }

    return {
      success: true,
      message: "User record created successfully",
      existed: false,
    };
  } catch (error) {
    console.error("Error ensuring user in Firestore:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
