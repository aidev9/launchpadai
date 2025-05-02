"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "../admin";
import { Prompt } from "@/lib/firebase/schema";
import { getCurrentUserId } from "../adminAuth";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { get } from "http";

// Get global prompts collection reference
function getPromptsRef() {
  return adminDb.collection("prompts");
}

// Get user-specific prompts collection reference
function getUserPromptsRef(userId: string) {
  return adminDb.collection("myprompts").doc(userId).collection("prompts");
}

/**
 * Get all prompts from the global collection
 */
export async function getAllPromptsAction() {
  try {
    const promptsRef = getPromptsRef();
    const promptsSnapshot = await promptsRef.orderBy("title", "desc").get();

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
        createdAt: data.createdAt * 1000, // Convert to milliseconds
        updatedAt: data.updatedAt * 1000, // Convert to milliseconds
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

/**
 * Get prompts filtered by phases
 */
export async function getPromptsByPhaseAction(phases: string[]) {
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
        createdAt: data.createdAt * 1000, // Convert to milliseconds
        updatedAt: data.updatedAt * 1000, // Convert to milliseconds
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

/**
 * Get a single prompt by ID
 */
export async function getPromptAction(promptId: string) {
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
      createdAt: data.createdAt * 1000, // Convert to milliseconds
      updatedAt: data.updatedAt * 1000, // Convert to milliseconds
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

/**
 * Add a new prompt
 */
export async function addPromptAction(
  promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt">
) {
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

    // Prepare the data for Firestore
    const firestoreData = {
      ...promptData,
      createdAt: getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
    };

    // Add the document
    const promptRef = await getPromptsRef().add(firestoreData);

    // Revalidate paths
    revalidatePath("/admin/prompts");
    revalidatePath("/prompts");

    return { success: true, prompt: { ...firestoreData, id: promptRef.id } };
  } catch (error) {
    console.error("Error adding prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update an existing prompt
 */
export async function updatePromptAction(
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

/**
 * Delete a prompt
 */
export async function deletePromptAction(promptId: string) {
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

/**
 * Delete multiple prompts
 */
export async function deletePromptsAction(promptIds: string[]) {
  try {
    const batch = adminDb.batch();

    promptIds.forEach((promptId) => {
      const promptRef = getPromptsRef().doc(promptId);
      batch.delete(promptRef);
    });

    await batch.commit();

    // Revalidate paths
    revalidatePath("/admin/prompts");
    revalidatePath("/prompts");

    return { success: true };
  } catch (error) {
    console.error("Error deleting prompts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all prompts for the current user
 */
export async function getUserPromptsAction() {
  try {
    const userId = await getCurrentUserId();

    const userPromptsRef = getUserPromptsRef(userId);
    const promptsSnapshot = await userPromptsRef
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
        createdAt: data.createdAt * 1000, // Convert to milliseconds
        updatedAt: data.updatedAt * 1000, // Convert to milliseconds
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

/**
 * Get user prompts filtered by phases
 */
export async function getUserPromptsByPhaseAction(phases: string[]) {
  try {
    const userId = await getCurrentUserId();

    const userPromptsRef = getUserPromptsRef(userId);
    const promptsSnapshot = await userPromptsRef
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
        createdAt: data.createdAt * 1000, // Convert to milliseconds
        updatedAt: data.updatedAt * 1000, // Convert to milliseconds
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

/**
 * Copy a prompt from global collection to user's collection
 */
export async function copyPromptToUserCollectionAction(promptId: string) {
  try {
    const userId = await getCurrentUserId();

    // Get the original prompt
    const { success, prompt, error } = await getPromptAction(promptId);
    if (!success || !prompt) {
      return { success: false, error: error || "Failed to fetch prompt" };
    }

    // Create a new prompt in the user's collection
    const userPromptRef = getUserPromptsRef(userId);
    const newPromptRef = await userPromptRef.add({
      title: prompt.title,
      body: prompt.body,
      phaseTags: prompt.phaseTags,
      productTags: prompt.productTags,
      tags: prompt.tags,
      sourcePromptId: promptId, // Reference to the original prompt
      createdAt: getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
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

/**
 * Add a new user prompt
 */
export async function addUserPromptAction(
  promptData: Omit<Prompt, "id" | "createdAt" | "updatedAt">
) {
  try {
    const userId = await getCurrentUserId();
    const userPromptRef = getUserPromptsRef(userId);
    const newPromptRef = await userPromptRef.add({
      ...promptData,
      createdAt: getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
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

/**
 * Update a user prompt
 */
export async function updateUserPromptAction(
  promptId: string,
  promptData: Partial<Omit<Prompt, "id" | "createdAt" | "updatedAt">>
) {
  try {
    const userId = await getCurrentUserId();

    const promptRef = getUserPromptsRef(userId).doc(promptId);

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

/**
 * Delete a user prompt
 */
export async function deleteUserPromptAction(promptId: string) {
  try {
    const userId = await getCurrentUserId();

    await getUserPromptsRef(userId).doc(promptId).delete();

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
