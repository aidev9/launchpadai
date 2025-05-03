"use server";

import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { Prompt, PromptInput } from "@/lib/firebase/schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { getUserPromptsRef } from "@/lib/firebase/prompts";
import { adminDb } from "@/lib/firebase/admin";

export async function createPromptAction(promptData: PromptInput) {
  try {
    // Get the current user ID
    const uid = await getCurrentUserId();
    if (!uid) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Prepare data for Firestore
    const promptToAdd = {
      ...promptData,
      createdAt: getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
      // Add user as a tag to identify it as a user prompt
      tags: [...promptData.tags, "user"],
    };

    const ref = await (await getUserPromptsRef(uid)).add(promptToAdd);
    const prompt = {
      id: ref.id,
      ...promptToAdd,
    } as Prompt;

    return {
      success: true,
      prompt,
    };
  } catch (error) {
    console.error("Error creating prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create prompt",
    };
  }
}

export async function updatePromptAction(
  promptId: string,
  promptData: PromptInput
) {
  try {
    // Get the current user ID
    const uid = await getCurrentUserId();
    if (!uid) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Get the prompt reference
    const ref = (await getUserPromptsRef(uid)).doc(promptId);
    const docSnapshot = await ref.get();

    if (!docSnapshot.exists) {
      return {
        success: false,
        error: `Prompt with ID ${promptId} not found`,
      };
    }

    // Prepare update data
    const updateData = {
      ...promptData,
      updatedAt: getCurrentUnixTimestamp(),
    };

    // Update the document
    await ref.update(updateData);

    // Return updated prompt with original fields preserved
    const originalData = docSnapshot.data() as Prompt;
    const updatedPrompt = {
      id: promptId,
      ...originalData,
      ...updateData,
    } as Prompt;

    return {
      success: true,
      prompt: updatedPrompt,
    };
  } catch (error) {
    console.error("Error updating prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update prompt",
    };
  }
}

export async function deletePromptAction(promptId: string) {
  try {
    // Get the current user ID
    const uid = await getCurrentUserId();
    if (!uid) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Get the prompt reference
    const ref = (await getUserPromptsRef(uid)).doc(promptId);

    // Delete the document
    await ref.delete();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting prompt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete prompt",
    };
  }
}

export async function deleteMultiplePromptsAction(promptIds: string[]) {
  try {
    // Get the current user ID
    const uid = await getCurrentUserId();
    if (!uid) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    // Create a batch operation for efficient deletion
    const batch = adminDb.batch();

    // Get user prompts collection reference
    const userPromptsCollection = await getUserPromptsRef(uid);

    // Add each prompt to the batch deletion
    for (const promptId of promptIds) {
      const promptRef = userPromptsCollection.doc(promptId);
      batch.delete(promptRef);
    }

    // Commit the batch operation
    await batch.commit();

    return {
      success: true,
      deletedCount: promptIds.length,
    };
  } catch (error) {
    console.error("Error deleting multiple prompts:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete prompts",
    };
  }
}
