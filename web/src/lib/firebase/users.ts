"use server";

import { adminAuth, adminDb } from "./admin";
// import { FirebaseError } from "firebase/app";

const usersRef = adminDb.collection("users");

/**
 * Safely migrates user data from Auth to Firestore when needed
 * This can be called from a trusted context like an admin page or a cron job
 */
export async function migrateUsersToFirestore() {
  try {
    console.log("Starting user migration to Firestore...");

    // List all users from Firebase Auth
    const listUsersResult = await adminAuth.listUsers();
    const users = listUsersResult.users;

    console.log(`Found ${users.length} users to potentially migrate`);

    let migratedCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of users) {
      try {
        // Check if user already exists in Firestore
        try {
          const existingUser = await usersRef.doc(user.uid).get();

          if (existingUser.exists) {
            console.log(
              `User ${user.uid} already exists in Firestore, skipping`
            );
            skipCount++;
            continue;
          }
        } catch (_checkError) {
          // If checking fails, try to create anyway
          console.log(_checkError);
          console.log(
            `Error checking if user ${user.uid} exists, will try to create`
          );
        }

        // Extract user data from Auth
        const userData = {
          uid: user.uid,
          email: user.email || "",
          name: user.displayName || "",
          phoneNumber: user.phoneNumber || "",
          photoURL: user.photoURL || "",
          createdAt: user.metadata.creationTime || new Date().toISOString(),
          lastLoginAt: user.metadata.lastSignInTime || new Date().toISOString(),
          // Extract profile data from custom claims if available
          ...(user.customClaims?.profile || {}),
        };

        // Create the user in Firestore
        try {
          await usersRef.doc(user.uid).set(userData, { merge: true });
          console.log(`Successfully migrated user ${user.uid} to Firestore`);
          migratedCount++;
        } catch (createError) {
          console.error(
            `Failed to create user ${user.uid} in Firestore:`,
            createError
          );
          errorCount++;
        }
      } catch (userError) {
        console.error(`Error processing user ${user.uid}:`, userError);
        errorCount++;
      }
    }

    console.log(
      `Migration complete. Checked: ${users.length}, Migrated: ${migratedCount}, Skipped: ${skipCount}, Errors: ${errorCount}`
    );
    return {
      success: true,
      total: users.length,
      migrated: migratedCount,
      skipped: skipCount,
      errors: errorCount,
    };
  } catch (error) {
    console.error("Failed to migrate users to Firestore:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Safely creates or updates a user document in Firestore based on Auth data.
 * Should be called after successful sign-up/sign-in to ensure Firestore is synced.
 * @param userId - The user ID from Firebase Auth.
 */
export async function syncUserWithFirestore(userId: string) {
  try {
    // Get user from Auth to ensure we have the latest data
    const user = await adminAuth.getUser(userId);

    // Prepare user data for Firestore
    const userData = {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "",
      phoneNumber: user.phoneNumber || "",
      photoURL: user.photoURL || "",
      createdAt: user.metadata.creationTime || new Date().toISOString(),
      lastLoginAt: user.metadata.lastSignInTime || new Date().toISOString(),
      // Include profile data from custom claims if available
      ...(user.customClaims?.profile || {}),
      // Always update the 'updatedAt' timestamp
      updatedAt: new Date().toISOString(),
    };

    // Create or update the user document in Firestore using set with merge
    await usersRef.doc(userId).set(userData, { merge: true });

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
    console.error("Error checking email existence:", error);
    // Consider how to handle errors - returning false might mask issues
    return false;
  }
}
