"use server";

import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { getPromptCredits } from "@/lib/firebase/prompt-credits";
import { PromptCredit } from "@/lib/firebase/schema";

/**
 * Fetch prompt credits for the current user
 */
export async function fetchPromptCredits(): Promise<{
  success: boolean;
  credits?: PromptCredit;
  error?: string;
}> {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Fetch prompt credits from Firebase
    return await getPromptCredits(userId);
  } catch (error) {
    console.error("Error fetching prompt credits:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
