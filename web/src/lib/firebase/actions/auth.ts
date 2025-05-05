"use server";

import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { User } from "firebase/auth";

// Get the current user from the session cookie
export async function getUser(): Promise<User | null> {
  try {
    // Use await when calling cookies() to properly resolve the promise
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify the session cookie and get the user
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    // Get the user from Firebase Auth
    const user = await adminAuth.getUser(decodedClaims.uid);

    return user as unknown as User;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

// Get user data from Firestore
export async function getUserData(userId: string) {
  try {
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}
