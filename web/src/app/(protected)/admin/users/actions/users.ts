"use server";

import { adminDb } from "@/lib/firebase/admin";
import { UserProfile } from "@/lib/firebase/schema";

/**
 * Get all users from Firestore
 */
export async function getAllUsers() {
  try {
    // Get users collection
    const usersSnapshot = await adminDb.collection("users").get();

    if (usersSnapshot.empty) {
      return { success: true, users: [] };
    }

    // Map the documents to User objects
    const users = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
      } as UserProfile;
    });

    return { success: true, users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(userId: string) {
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      user: {
        uid: userDoc.id,
        ...userDoc.data(),
      } as UserProfile,
    };
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
