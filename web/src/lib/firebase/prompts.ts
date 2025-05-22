"use server";

import { adminDb } from "./admin";
import { Prompt } from "@/lib/firebase/schema";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Get global prompts collection reference
function getPromptsRef() {
  return adminDb.collection("prompts");
}

// Get user-specific prompts collection reference
export async function getUserPromptsRef(userId: string) {
  return await adminDb
    .collection("myprompts")
    .doc(userId)
    .collection("myprompts");
}

// Helper function to get the current user ID
async function getUserId() {
  try {
    return await getCurrentUserId();
  } catch (error) {
    console.error("Error getting current user ID:", error);
    throw new Error("User not authenticated");
  }
}

// Get all prompts from the global collection
export async function getAllPrompts() {
  try {
    const promptsRef = getPromptsRef();
    const promptsSnapshot = await promptsRef.orderBy("createdAt", "desc").get();

    const prompts: Prompt[] = [];
    promptsSnapshot.forEach((doc) => {
      const data = doc.data();
      prompts.push({
        id: doc.id,
        title: data.title,
        body: data.body,
        phaseTags: data.phaseTags || [],
        productTags: data.productTags || [],
        tags: data.tags || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return { success: true, prompts };
  } catch (error) {
    console.error("Error getting prompts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get prompts filtered by phases
export async function getPromptsByPhase(phases: string[]) {
  try {
    const promptsRef = getPromptsRef();
    const promptsSnapshot = await promptsRef
      .where("phaseTags", "array-contains-any", phases)
      .orderBy("createdAt", "desc")
      .get();

    const prompts: Prompt[] = [];
    promptsSnapshot.forEach((doc) => {
      const data = doc.data();
      prompts.push({
        id: doc.id,
        title: data.title,
        body: data.body,
        phaseTags: data.phaseTags || [],
        productTags: data.productTags || [],
        tags: data.tags || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return { success: true, prompts };
  } catch (error) {
    console.error("Error getting prompts by phase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get a single prompt by ID
export async function getPrompt(promptId: string) {
  try {
    const promptDoc = await getPromptsRef().doc(promptId).get();

    if (!promptDoc.exists) {
      return { success: false, error: "Prompt not found" };
    }

    const data = promptDoc.data();
    if (!data) {
      return { success: false, error: "Prompt data is undefined" };
    }

    const prompt: Prompt = {
      id: promptDoc.id,
      title: data.title || "",
      body: data.body || "",
      phaseTags: data.phaseTags || [],
      productTags: data.productTags || [],
      tags: data.tags || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return { success: true, prompt };
  } catch (error) {
    console.error("Error getting prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Add a new prompt with retry logic
export async function addPrompt(
  promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt">
) {
  // Maximum number of retry attempts
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError: any = null;

  // Retry loop
  while (retryCount < MAX_RETRIES) {
    try {
      // Validate data before sending to Firestore
      if (!promptData.title) {
        console.error("Title is required for prompt");
        return {
          success: false,
          error: "Title is required for prompt",
        };
      }

      if (!promptData.phaseTags || promptData.phaseTags.length === 0) {
        console.error("At least one phase tag is required");
        return {
          success: false,
          error: "At least one phase tag is required",
        };
      }

      // Use getCurrentUnixTimestamp for timestamp
      const timestamp = getCurrentUnixTimestamp();

      // Prepare the data for Firestore
      const firestoreData = {
        ...promptData,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Log attempt information
      console.log(
        `Adding prompt to Firestore (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
        {
          ...promptData,
          createdAt: "server timestamp",
          updatedAt: "server timestamp",
        }
      );

      // Try to add the document
      const promptRef = await getPromptsRef().add(firestoreData);

      console.log("Successfully added prompt with ID:", promptRef.id);

      // Revalidate paths
      revalidatePath("/admin/prompts");
      revalidatePath("/prompts");

      return { success: true, promptId: promptRef.id };
    } catch (error) {
      lastError = error;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Log the error details
      console.error(
        `Error adding prompt (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
        error
      );
      console.error("Error details:", JSON.stringify(error, null, 2));

      // Check if it's a network-related error that might resolve with a retry
      const isNetworkError =
        errorMessage.includes("network") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("connection") ||
        errorMessage.includes("WebChannelConnection") ||
        errorMessage.includes("stream");

      if (isNetworkError && retryCount < MAX_RETRIES - 1) {
        // Exponential backoff delay: 500ms, 1000ms, 2000ms, etc.
        const delayMs = 500 * Math.pow(2, retryCount);
        console.log(`Network error detected, retrying in ${delayMs}ms...`);

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        retryCount++;
      } else {
        // Either it's not a network error or we've exhausted all retry attempts
        return {
          success: false,
          error: `Failed after ${retryCount + 1} attempts: ${errorMessage}`,
        };
      }
    }
  }

  // This shouldn't be reached due to the return in the final catch block,
  // but TypeScript needs it for safety
  return {
    success: false,
    error: `Failed after ${MAX_RETRIES} attempts: ${lastError?.message || "Unknown error"}`,
  };
}

// Update an existing prompt
export async function updatePrompt(
  promptId: string,
  promptData: Partial<Omit<Prompt, "id" | "createdAt" | "updatedAt">>
) {
  try {
    const promptRef = getPromptsRef().doc(promptId);

    // Check if prompt exists
    const doc = await promptRef.get();
    if (!doc.exists) {
      return {
        success: false,
        error: "Prompt not found",
      };
    }

    // Use getCurrentUnixTimestamp for update time
    await promptRef.update({
      ...promptData,
      updatedAt: getCurrentUnixTimestamp(),
    });

    // Revalidate paths
    revalidatePath("/admin/prompts");
    revalidatePath("/prompts");

    return { success: true };
  } catch (error) {
    console.error("Error updating prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Delete a prompt
export async function deletePrompt(promptId: string) {
  try {
    await getPromptsRef().doc(promptId).delete();

    // Revalidate paths
    revalidatePath("/admin/prompts");
    revalidatePath("/prompts");

    return { success: true };
  } catch (error) {
    console.error("Error deleting prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// --- User-specific prompts ---

// Get all prompts for the current user
export async function getUserPrompts() {
  try {
    const userId = await getUserId();

    const userPromptsRef = await getUserPromptsRef(userId);
    const promptsSnapshot = await userPromptsRef
      .orderBy("createdAt", "desc")
      .get();

    const prompts: Prompt[] = [];
    promptsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      prompts.push({
        id: doc.id,
        title: data.title,
        body: data.body,
        phaseTags: data.phaseTags || [],
        productTags: data.productTags || [],
        tags: data.tags || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return { success: true, prompts };
  } catch (error) {
    console.error("Error getting user prompts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get user prompts filtered by phases
export async function getUserPromptsByPhase(phases: string[]) {
  try {
    const userId = await getUserId();

    const userPromptsRef = await getUserPromptsRef(userId);
    const promptsSnapshot = await userPromptsRef
      .where("phaseTags", "array-contains-any", phases)
      .orderBy("createdAt", "desc")
      .get();

    const prompts: Prompt[] = [];
    promptsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      prompts.push({
        id: doc.id,
        title: data.title,
        body: data.body,
        phaseTags: data.phaseTags || [],
        productTags: data.productTags || [],
        tags: data.tags || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return { success: true, prompts };
  } catch (error) {
    console.error("Error getting user prompts by phase:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Copy a prompt from global collection to user's collection
export async function copyPromptToUserCollection(promptId: string) {
  try {
    const userId = await getUserId();

    // Get the original prompt
    const { success, prompt, error } = await getPrompt(promptId);
    if (!success || !prompt) {
      return { success: false, error: error || "Failed to fetch prompt" };
    }

    // Create a new prompt in the user's collection
    const timestamp = getCurrentUnixTimestamp();
    const userPromptRef = await getUserPromptsRef(userId);
    const newPromptRef = await userPromptRef.add({
      title: prompt.title,
      body: prompt.body,
      phaseTags: prompt.phaseTags,
      productTags: prompt.productTags,
      tags: prompt.tags,
      sourcePromptId: promptId, // Reference to the original prompt
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Revalidate paths
    revalidatePath("/myprompts");

    return { success: true, promptId: newPromptRef.id };
  } catch (error) {
    console.error("Error copying prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Add a new user prompt
export async function addUserPrompt(
  promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt">
) {
  try {
    const userId = await getUserId();

    const timestamp = getCurrentUnixTimestamp();
    const userPromptRef = await getUserPromptsRef(userId);
    const newPromptRef = await userPromptRef.add({
      ...promptData,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Revalidate paths
    revalidatePath("/myprompts");

    return { success: true, promptId: newPromptRef.id };
  } catch (error) {
    console.error("Error adding user prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Update a user prompt
export async function updateUserPrompt(
  promptId: string,
  promptData: Partial<Omit<Prompt, "id" | "createdAt" | "updatedAt">>
) {
  try {
    const userId = await getUserId();

    const userPromptsRef = await getUserPromptsRef(userId);
    const promptRef = userPromptsRef.doc(promptId);

    // Check if prompt exists
    const doc = await promptRef.get();
    if (!doc.exists) {
      return {
        success: false,
        error: "User prompt not found",
      };
    }

    await promptRef.update({
      ...promptData,
      updatedAt: getCurrentUnixTimestamp(),
    });

    // Revalidate paths
    revalidatePath("/myprompts");

    return { success: true };
  } catch (error) {
    console.error("Error updating user prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Delete a user prompt
export async function deleteUserPrompt(promptId: string) {
  try {
    const userId = await getUserId();

    const userPromptsRef = await getUserPromptsRef(userId);
    await userPromptsRef.doc(promptId).delete();

    // Revalidate paths
    revalidatePath("/myprompts");

    return { success: true };
  } catch (error) {
    console.error("Error deleting user prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
