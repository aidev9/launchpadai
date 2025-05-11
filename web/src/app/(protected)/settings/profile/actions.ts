"use server";

import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { revalidatePath } from "next/cache";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Define the schema for profile updates
const profileUpdateSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().max(500, {
    message: "Bio must not be longer than 500 characters.",
  }),
  urls: z.array(
    z.object({
      value: z.string().url({ message: "Please enter a valid URL." }),
    })
  ),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

/**
 * Server action to update a user's profile in Firestore
 */
export async function updateProfileAction(data: ProfileUpdateData) {
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
    const validatedData = profileUpdateSchema.parse(data);

    // Get reference to the user document
    const userRef = adminDb.collection("users").doc(userId);

    // Prepare update payload
    const updatePayload = {
      bio: validatedData.bio,
      urls: validatedData.urls,
      updatedAt: getCurrentUnixTimestamp(),
    };

    // Update the user document
    await userRef.update(updatePayload);

    // Revalidate the profile page
    revalidatePath("/settings/profile");

    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Server action to get the current user's profile from Firestore
 */
export async function getProfileAction() {
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
        error: "User profile not found",
      };
    }

    const userData = userDoc.data();

    return {
      success: true,
      profile: {
        displayName: userData?.displayName || "",
        email: userData?.email || "",
        bio: userData?.bio || "",
        urls: userData?.urls || [],
      },
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
