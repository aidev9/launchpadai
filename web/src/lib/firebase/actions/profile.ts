"use server";

import { adminDb } from "../admin";
import { getCurrentUserId } from "../adminAuth";
import { PromptCredit, UserProfile } from "../schema";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { xpActions } from "@/xp/points-schedule"; // Import the XP schedule
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Find the sign-in action and get its points value
const signInAction = xpActions.find((action) => action.id === "signin");
const SIGN_IN_XP_AWARD = signInAction?.points || 0; // Default to 0 if not found

// Check if the sign-in action was found and log a warning if not
if (!signInAction) {
  console.warn(
    "XP Action 'signin' not found in points-schedule.ts. Defaulting XP award to 0."
  );
}

/**
 * Server action to fetch the current user's profile, including XP
 * This is used to refresh the client-side state when server-side updates occur
 * Also increments XP on successful fetch (representing sign-in).
 */
export async function fetchUserProfile(): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  try {
    // Get the current user ID from the server context
    const userId = await getCurrentUserId();

    if (!userId) {
      console.error("Not authenticated - no user ID returned");
      return {
        success: false,
        error: "Not authenticated",
      };
    }

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

    // Get the current user data before incrementing
    const currentData = userDoc.data() || {};

    const currentXp = currentData.xp;

    // Calculate the new XP value. Default to current XP if award is not positive.
    let newXp = currentXp;

    // Only increment XP if a positive award amount was found
    if (SIGN_IN_XP_AWARD > 0) {
      try {
        await userRef.update({
          xp: FieldValue.increment(SIGN_IN_XP_AWARD),
          updatedAt: getCurrentUnixTimestamp(),
        });
        // Update newXp only if the database update is successful
        newXp = currentXp + SIGN_IN_XP_AWARD;
      } catch (updateError) {
        console.error(
          "[fetchUserProfile] Failed to update XP in Firestore:",
          updateError
        );
        // If update fails, keep newXp as currentXp and proceed,
        // maybe log this for monitoring
      }
    }

    // Explicitly handle properties
    const levelValue = currentData?.level ?? 1;

    // Create restOfCurrentData excluding known numeric/handled fields
    const {
      xp: _xp,
      level: _level,
      ...restOfSerializedData
    } = currentData as any;

    // Create a user profile object reflecting the potentially updated XP value
    const profile: UserProfile = {
      uid: userId,
      // Use the calculated new XP for the returned profile
      xp: newXp,
      level: levelValue,
      // Spread the rest of the data, ensuring our new xp isn't overwritten
      ...restOfSerializedData,
    };

    // Revalidate related paths to ensure fresh data
    revalidatePath("/dashboard"); // Ensure dashboard reflects new XP potentially
    revalidatePath("/answer_questions"); // Example path, adjust if needed

    return {
      success: true,
      profile,
    };
  } catch (error) {
    console.error("Error fetching or updating user profile:", error); // Updated log message
    // More detailed error message
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : "Unknown error";

    console.error(`Error details: ${errorMessage}`);

    return {
      success: false,
      error: `Failed to fetch or update profile: ${errorMessage}`, // Updated error message
    };
  }
}

// Server action to fetch user prompt credits
export async function fetchUserPromptCredits(): Promise<{
  success: boolean;
  credits?: PromptCredit;
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      console.error("Not authenticated - no user ID returned");
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Fetch user's prompt credits from Firestore
    const ref = adminDb.collection("prompt_credits").doc(userId);
    const doc = await ref.get();

    if (!doc.exists) {
      console.error(`Prompt credits not found for user ID: ${userId}`);
      return {
        success: false,
        error: "Prompt credits not found",
      };
    }

    const data = doc.data();
    if (!data) {
      console.error(`No data found for user ID: ${userId}`);
      return {
        success: false,
        error: "No data found",
      };
    }

    const totalUsedCreditsValue = data.totalUsedCredits || 0;
    const remainingCreditsValue = data.remainingCredits || 0;

    // Ensure numeric values are returned
    if (typeof totalUsedCreditsValue !== "number") {
      console.error(`Invalid totalUsedCredits value for user ID: ${userId}`);
      return {
        success: false,
        error: "Invalid totalUsedCredits value",
      };
    }

    if (typeof remainingCreditsValue !== "number") {
      console.error(`Invalid remainingCredits value for user ID: ${userId}`);
      return {
        success: false,
        error: "Invalid remainingCredits value",
      };
    }

    // Create a credits object reflecting the user's credit balance
    const credits = {
      totalUsedCredits: totalUsedCreditsValue,
      remainingCredits: remainingCreditsValue,
      dailyCredits: data.dailyCredits || 10, // Default to 10 if not set
      monthlyCredits: data.monthlyCredits || 300, // Default to 300 if not set
      lastRefillDate: data.lastRefillDate || 0, // Default to 0 if not set
      lastUsedDate: data.lastUsedDate || 0, // Default to 0 if not set
      updatedAt: data.updatedAt || 0, // Default to 0 if not set
      userId: userId,
    };

    return {
      success: true,
      credits,
    };
  } catch (error) {
    console.error("Error fetching user prompt credits:", error);
    // More detailed error message
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : "Unknown error";

    console.error(`Error details: ${errorMessage}`);

    return {
      success: false,
      error: `Failed to fetch prompt credits: ${errorMessage}`, // Updated error message
    };
  }
}
