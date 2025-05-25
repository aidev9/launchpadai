"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { revalidatePath } from "next/cache";
import { getCurrentUnixTimestamp } from "@/utils/constants";

/**
 * Delete a user from Firebase Auth and mark as deleted in Firestore
 */
export async function deleteUser(userId: string) {
  try {
    // Start a transaction-like operation
    let authDeleted = false;
    let firestoreUpdated = false;
    let error = null;

    // Step 1: Delete user auth record
    try {
      await adminAuth.deleteUser(userId);
      authDeleted = true;
      console.log(`Successfully deleted user auth record for ${userId}`);
    } catch (err) {
      error = err;
      console.error(`Error deleting user auth record for ${userId}:`, err);
    }

    // Step 2: Mark user as deleted in Firestore
    try {
      // Instead of deleting the document, update it to mark as deleted
      await adminDb.collection("users").doc(userId).update({
        deleted: true,
        deletedAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      });
      firestoreUpdated = true;
      console.log(`Successfully marked user ${userId} as deleted in Firestore`);
    } catch (err) {
      error = err;
      console.error(
        `Error marking user as deleted in Firestore for ${userId}:`,
        err
      );
    }

    // Check results
    if (firestoreUpdated || authDeleted) {
      // Consider the operation successful if either operation succeeded
      revalidatePath("/admin/users");

      if (!authDeleted) {
        console.warn(
          `Warning: User auth record for ${userId} was not deleted, but Firestore data was marked as deleted.`
        );
      }
      
      if (!firestoreUpdated) {
        console.warn(
          `Warning: User ${userId} was deleted from Auth but not marked as deleted in Firestore.`
        );
      }

      return { success: true };
    } else {
      // Failed both operations
      const errorMessage = "Failed to delete user from Auth and mark as deleted in Firestore.";

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
