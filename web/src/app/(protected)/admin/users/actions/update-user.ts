"use server";

import { adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { getCurrentUnixTimestamp } from "@/utils/constants";

/**
 * Update a user's profile in Firestore
 */
export async function updateUser(userId: string, userData: any) {
  try {
    // Get the user document reference
    const userRef = adminDb.collection("users").doc(userId);

    // Update the user document
    await userRef.update({
      ...userData,
      updatedAt: getCurrentUnixTimestamp(),
    });

    // Revalidate the users page
    revalidatePath("/admin/users");

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
