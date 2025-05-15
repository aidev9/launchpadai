"use server";

import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { TechStack, TechStackAsset } from "@/lib/firebase/schema";
import {
  getTechStackAssets,
  generateAssetContent,
  createTechStackAsset,
  updateTechStackAsset,
  deleteTechStackAsset,
} from "@/lib/firebase/techstack-assets";
import { getTechStack as fetchTechStackFromFirebase } from "@/lib/firebase/techstacks";
import { consumePromptCredit } from "@/lib/firebase/prompt-credits";
import { revalidatePath } from "next/cache";
import { getCurrentUnixTimestamp } from "@/utils/constants";

/**
 * Fetch a tech stack by ID
 */
export async function getTechStack(techStackId: string) {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Fetch tech stack from Firebase
    const result = await fetchTechStackFromFirebase(techStackId);

    if (!result.success || !result.techStack) {
      return {
        success: false,
        error: result.error || "Tech stack not found",
      };
    }

    return {
      success: true,
      techStack: result.techStack,
    };
  } catch (error) {
    console.error("Error fetching tech stack:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Fetch assets for a tech stack
 */
export async function fetchTechStackAssets(techStackId: string) {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        assets: [],
        error: "Not authenticated",
      };
    }

    // Fetch assets from Firebase
    const result = await getTechStackAssets(techStackId);
    return result;
  } catch (error) {
    console.error("Error fetching tech stack assets:", error);
    return {
      success: false,
      assets: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create a new asset for a tech stack
 */
export async function createAssetAction(
  techStackId: string,
  assetData: Partial<TechStackAsset>
) {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Ensure required fields are present
    if (!assetData.title || !assetData.assetType) {
      return {
        success: false,
        error: "Asset title and type are required",
      };
    }

    // Create the asset with proper input format
    const assetInput = {
      title: assetData.title,
      body: assetData.body || "",
      tags: assetData.tags || [],
      assetType: assetData.assetType,
      techStackId,
    };

    const result = await createTechStackAsset(assetInput);

    // Revalidate the path to update the UI
    revalidatePath(`/mystacks/stack`);

    return result;
  } catch (error) {
    console.error("Error creating asset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update an existing asset
 */
export async function updateAssetAction(
  techStackId: string,
  assetId: string,
  assetData: Partial<TechStackAsset>
) {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Update the asset
    const result = await updateTechStackAsset(techStackId, assetId, assetData);

    // Revalidate the path to update the UI
    revalidatePath(`/mystacks/stack`);

    return result;
  } catch (error) {
    console.error("Error updating asset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete an asset
 */
export async function deleteAssetAction(techStackId: string, assetId: string) {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Delete the asset
    const result = await deleteTechStackAsset(techStackId, assetId);

    // Revalidate the path to update the UI
    revalidatePath(`/mystacks/stack`);

    return result;
  } catch (error) {
    console.error("Error deleting asset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate content for an asset
 */
export async function generateAssetContentAction(
  techStackId: string,
  assetId: string,
  assetType: string,
  techStackDetails: TechStack,
  userInstructions?: string
) {
  try {
    // Get the current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Check and consume prompt credit
    const creditResult = await consumePromptCredit({ userId });
    // Type assertion for the credit result
    const typedResult = creditResult as unknown as {
      data: {
        success: boolean;
        error?: string;
        needMoreCredits?: boolean;
        remainingCredits?: number;
      };
    };

    if (!typedResult.data?.success) {
      // User doesn't have enough credits
      return {
        success: false,
        error: typedResult.data?.error || "Insufficient prompt credits",
        needMoreCredits: true,
      };
    }

    // Generate content using the existing server function
    const result = await generateAssetContent(
      techStackId,
      assetId,
      assetType,
      techStackDetails,
      userInstructions
    );

    // Update the asset in Firebase
    if (result.success && result.body) {
      await updateTechStackAsset(techStackId, assetId, {
        body: result.body,
        recentlyCompleted: false,
        needsGeneration: false,
      });
    }

    revalidatePath(`/mystacks/stack`);
    return result;
  } catch (error) {
    console.error("Error generating asset content:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
