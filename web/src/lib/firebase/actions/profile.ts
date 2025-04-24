"use server";

import { adminDb } from "../admin";
import { getCurrentUserId } from "../adminAuth";
import { UserProfile } from "@/lib/store/user-store";
import { revalidatePath } from "next/cache";

/**
 * Server action to fetch the current user's profile, including XP
 * This is used to refresh the client-side state when server-side updates occur
 */
export async function fetchUserProfile(): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  console.log("fetchUserProfile server action called");

  try {
    // Get the current user ID from the server context
    console.log("Getting current user ID");
    const userId = await getCurrentUserId();

    if (!userId) {
      console.error("Not authenticated - no user ID returned");
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    console.log(`Got user ID: ${userId}, fetching user document`);

    // Fetch the user document from Firestore
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error(`User profile not found for ID: ${userId}`);
      return {
        success: false,
        error: "User profile not found",
      };
    }

    // Get the user data
    const userData = userDoc.data() || {};
    console.log(`User data retrieved:`, {
      uid: userId,
      xp: userData?.xp || 0,
      hasXpField: "xp" in userData,
    });

    // Create a user profile object
    const profile: UserProfile = {
      uid: userId,
      xp: userData?.xp || 0,
      level: userData?.level || 1,
      ...userData,
    };

    // Revalidate related paths to ensure fresh data
    console.log("Revalidating paths");
    revalidatePath("/dashboard");
    revalidatePath("/answer_questions");

    console.log("Returning user profile with XP:", profile.xp);
    return {
      success: true,
      profile,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    // More detailed error message
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : "Unknown error";

    console.error(`Error details: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
