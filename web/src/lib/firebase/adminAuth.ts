"use server";
import { adminAuth } from "./admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get current user ID from Firebase session cookie
 * Throws an error if the user is not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    // Get the session cookie from the request
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      throw new Error("No session cookie found. User is not authenticated.");
    }

    // Verify the session cookie with Firebase Admin
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );

    if (!decodedClaims.uid) {
      throw new Error("Invalid user ID in session");
    }

    return decodedClaims.uid;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    // Navigate to the sign-in page
    redirect("/auth/signin");

    // throw new Error("Authentication failed. Please sign in again.");
  }
}
