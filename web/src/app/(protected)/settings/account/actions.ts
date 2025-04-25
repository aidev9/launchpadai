"use server";

import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { revalidatePath } from "next/cache";

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
      updatedAt: new Date().toISOString(),
    };

    // Add optional fields if they exist
    if (validatedData.language) {
      updatePayload.language = validatedData.language;
    }

    if (validatedData.dob) {
      updatePayload.dateOfBirth = validatedData.dob.toISOString();
    }

    // Update the account settings in Firestore
    await userRef.update(updatePayload);

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
