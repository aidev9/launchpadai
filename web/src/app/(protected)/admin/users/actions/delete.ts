"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { getCurrentUnixTimestamp } from "@/utils/constants";

/**
 * Delete a user from Firebase Auth and Firestore
 */
export async function deleteUser(userId: string) {
  try {
    // Start a transaction-like operation
    let authDeleted = false;
    let firestoreDeleted = false;
    let error = null;

    // Step 1: Delete user auth record
    try {
      await adminAuth.deleteUser(userId);
      authDeleted = true;
    } catch (err) {
      error = err;
      console.error(`Error deleting user auth record for ${userId}:`, err);
    }

    // Step 2: Delete user data from Firestore
    try {
      // Instead of deleting the document, update it to mark as deleted
      await adminDb.collection("users").doc(userId).update({
        deleted: true,
        deletedAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      });
      firestoreDeleted = true;
    } catch (err) {
      error = err;
      console.error(
        `Error deleting user data from Firestore for ${userId}:`,
        err
      );
    }

    // Check results
    if (firestoreDeleted) {
      // Consider the operation successful if Firestore data is deleted
      // Even if auth record deletion failed, we'll just log it but consider the operation successful
      revalidatePath("/admin/users");

      if (!authDeleted) {
        // Log the auth deletion failure but don't fail the operation
        console.warn(
          `Warning: User auth record for ${userId} was not deleted, but Firestore data was marked as deleted.`
        );
      }

      return { success: true };
    } else {
      // Failed to delete Firestore data
      const errorMessage = "Failed to delete user data from Firestore. ";

      return {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error),
      };
    }
  } catch (error) {
    console.error(`Error in deleteUser function for ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
