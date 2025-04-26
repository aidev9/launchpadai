"use server";

import { adminAuth, adminDb } from "./admin";
// import { FirebaseError } from "firebase/app";

const usersRef = adminDb.collection("users");

/**
 * Safely creates or updates a user document in Firestore based on Auth data.
 * Should be called after successful sign-up/sign-in to ensure Firestore is synced.
 * @param userId - The user ID from Firebase Auth.
 */
export async function syncUserWithFirestore(userId: string) {
  try {
    // Get user from Auth to ensure we have the latest data
    const user = await adminAuth.getUser(userId);
    // Get the existing Firestore document data if it exists
    const userDocRef = usersRef.doc(userId);
    const userDoc = await userDocRef.get();
    const existingData = userDoc.exists ? userDoc.data() : {};
    console.log(
      `[syncUserWithFirestore] Existing Firestore data before merge:`,
      JSON.stringify(existingData)
    );

    // Prepare user data for Firestore, preserving existing XP, level, and especially userType
    const userData = {
      // IMPORTANT: Start with existing data to preserve userType, subscription, etc.
      ...existingData,
      // Fields from Auth - these will overwrite existing data with the same keys
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "",
      phoneNumber: user.phoneNumber || "",
      photoURL: user.photoURL || "",
      emailVerified: user.emailVerified,
      providerData: user.providerData,
      createdAt: user.metadata.creationTime || new Date().toISOString(),
      lastLoginAt: user.metadata.lastSignInTime || new Date().toISOString(),
      // Include profile data from custom claims if available
      ...(user.customClaims?.profile || {}),
      // Always update the 'updatedAt' timestamp
      updatedAt: new Date().toISOString(),
    };

    console.log(
      `[syncUserWithFirestore] Auth user email: ${user.email || "(not set)"}`
    );
    console.log(
      `[syncUserWithFirestore] Auth user displayName: ${
        user.displayName || "(not set)"
      }`
    );
    console.log(
      `[syncUserWithFirestore] Auth user photoURL: ${user.photoURL || "(not set)"}`
    );
    console.log(
      `[syncUserWithFirestore] Writing user data to Firestore (merge: true):`,
      JSON.stringify(userData)
    );
    await userDocRef.set(userData, { merge: true });

    return {
      success: true,
      userId,
    };
  } catch (error) {
    console.error(`Failed to sync user ${userId} with Firestore:`, error);
    return {
      success: false,
      userId,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if an email already exists in Firestore.
 * @param email - The email to check.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const snapshot = await usersRef.where("email", "==", email).limit(1).get();
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking if email exists:", error);
    return false;
  }
}
