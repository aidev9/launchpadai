"use server";
import { adminAuth } from "./admin";
import { cookies } from "next/headers";

/**
 * Get current user ID from Firebase session cookie
 * In a production app, this would verify the session cookie and extract the user ID
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    // Get the session cookie from the request
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      console.warn("No session cookie found, using default user ID");
      return "current_user_id"; // Fallback for development
    }

    // Verify the session cookie with Firebase Admin
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(
        sessionCookie,
        true
      );
      return decodedClaims.uid; // Return the actual user ID from the verified session
    } catch (error) {
      console.error("Error verifying session cookie:", error);
      return "current_user_id"; // Fallback for development
    }
  } catch (error) {
    console.error("Error getting user ID:", error);
    return "current_user_id"; // Fallback for development
  }
}
