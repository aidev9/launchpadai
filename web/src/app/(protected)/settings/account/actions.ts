"use server";

import { z } from "zod";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { revalidatePath } from "next/cache";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Define the schema for account updates
const accountUpdateSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .max(30, {
      message: "Name must not be longer than 30 characters.",
    }),
  timezone: z.string({
    required_error: "Please select a time zone.",
  }),
  // Optional fields that might be uncommented in the future
  language: z.string().optional(),
  dob: z.date().optional(),
});

export type AccountUpdateData = z.infer<typeof accountUpdateSchema>;

/**
 * Server action to update a user's account settings in Firestore
 */
export async function updateAccountAction(data: AccountUpdateData) {
  try {
    // Get the current user ID from the server context
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Validate input data
    const validatedData = accountUpdateSchema.parse(data);

    // Get reference to the user document
    const userRef = adminDb.collection("users").doc(userId);

    // Prepare update payload (only include fields that are provided)
    const updatePayload: Record<string, any> = {
      name: validatedData.name,
      timezone: validatedData.timezone,
      updatedAt: getCurrentUnixTimestamp(),
    };

    // Add optional fields if they exist
    if (validatedData.language) {
      updatePayload.language = validatedData.language;
    }

    if (validatedData.dob) {
      updatePayload.dateOfBirth = validatedData.dob.toISOString();
    }

    // Check if document exists before updating
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      await userRef.update(updatePayload);
    } else {
      // If document doesn't exist, create it
      await userRef.set(updatePayload, { merge: true });
    }

    // Revalidate the account settings page
    revalidatePath("/settings/account");

    return {
      success: true,
      message: "Account settings updated successfully",
    };
  } catch (error) {
    console.error("Error updating account settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Server action to get the current user's account settings from Firestore
 */
export async function getAccountAction() {
  try {
    // Get the current user ID from the server context
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Get reference to the user document
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {
        success: false,
        error: "User account not found",
      };
    }

    const userData = userDoc.data();

    return {
      success: true,
      account: {
        name: userData?.name || "",
        timezone: userData?.timezone || "",
        language: userData?.language || "",
        dob: userData?.dateOfBirth ? new Date(userData.dateOfBirth) : undefined,
      },
    };
  } catch (error) {
    console.error("Error fetching account settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Server action to send a password reset email to the current user using Firebase Auth REST API
 */
export async function resetPasswordAction() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }
    // Fetch user email from Firestore
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return { success: false, error: "User not found" };
    }
    const userData = userDoc.data();
    const email = userData?.email;
    if (!email) {
      return { success: false, error: "No email found for user" };
    }
    // Use Firebase Auth REST API to send password reset email
    // Use NEXT_PUBLIC_FIREBASE_API_KEY for the API key
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Firebase Web API key not configured" };
    }
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
      }
    );
    const result = await response.json();
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true, message: "Password reset email sent" };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Server action to delete the current user's account and archive their user record
 */
export async function deleteAccountAction() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }
    // Delete the Firebase Auth user
    await adminAuth.deleteUser(userId);
    // Mark the user record as archived in Firestore (handle missing doc)
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      await userRef.update({
        archived: true,
        archivedAt: getCurrentUnixTimestamp(),
      });
    } else {
      await userRef.set(
        { archived: true, archivedAt: getCurrentUnixTimestamp() },
        { merge: true }
      );
    }
    // Invalidate the session cookie by deleting it directly (Next.js Response API)
    // Instead of calling the API, set the Set-Cookie header to delete the session cookie
    // This only works if this action is called in a server action with access to cookies()
    // If not, you must sign out the user on the client after deletion
    // For best UX, keep the client-side redirect to /auth/signin after deletion
    // (The client-side sign out logic should clear the session cookie and state)
    return { success: true, signOut: true };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
