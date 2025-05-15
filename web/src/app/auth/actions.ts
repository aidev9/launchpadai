"use server";

import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { actionClient } from "@/lib/action";
import { z } from "zod";
import { initializePromptCredits } from "@/lib/firebase/prompt-credits";

/**
 * Server action to initialize prompt credits for a user
 * This is intended to be called from client components
 */
export const initializeUserPromptCredits = actionClient
  .schema(
    z.object({ userId: z.string(), planType: z.string().default("free") })
  )
  .action(async ({ parsedInput: { userId, planType } }) => {
    try {
      await initializePromptCredits(userId, planType);
      return { success: true };
    } catch (error) {
      console.error("Error initializing prompt credits:", error);
      return { success: false, error: String(error) };
    }
  });

/**
 * Revokes all refresh tokens for a user
 * This effectively invalidates all sessions for the user
 */
export async function revokeUserTokens(uid: string) {
  if (!uid) {
    throw new Error("User ID is required");
  }

  try {
    await adminAuth.revokeRefreshTokens(uid);
    return { success: true };
  } catch (error: any) {
    console.error("Error revoking tokens:", error);
    throw new Error(error.message);
  }
}
