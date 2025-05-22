"use server";

import { revalidatePath } from "next/cache";
import { saveAsset as saveAssetToFirebase } from "@/lib/firebase/assets";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { getAsset } from "@/lib/firebase/assets";
import { awardXpPoints } from "@/xp/server-actions";
import { z } from "zod";

// Schema for saving assets
export const SaveAssetSchema = z.object({
  productId: z.string(),
  asset: z.object({
    id: z.string(),
    phases: z.array(z.string()).optional(),
    title: z.string(),
    description: z.string().optional(),
    systemPrompt: z.string(),
    tags: z.array(z.string()).optional(),
    order: z.number(),
    content: z.string().optional(),
  }),
});

// Define server action for saving assets
export async function saveAssetAction(data: z.infer<typeof SaveAssetSchema>) {
  try {
    const { productId, asset } = data;

    // Make sure we have tags array
    const assetWithTags = {
      ...asset,
      tags: asset.tags || [],
      phases: asset.phases || [],
      description: asset.description || asset.title,
    };

    // Call the Firestore function
    const response = await saveAssetToFirebase(productId, assetWithTags);

    // Revalidate the review assets page
    revalidatePath("/review_assets");

    return response;
  } catch (error) {
    console.error("Error in saveAssetAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Schema for deleting assets
const _deleteAssetSchema = z.object({
  productId: z.string(),
  assetId: z.string(),
});

// Define server action for deleting assets
export async function deleteAssetAction(
  data: z.infer<typeof _deleteAssetSchema>
) {
  try {
    const { productId, assetId } = data;

    // Import dynamically to avoid circular dependencies
    const { deleteAsset } = await import("@/lib/firebase/assets");
    const response = await deleteAsset(productId, assetId);

    // Revalidate the review assets page
    revalidatePath("/review_assets");

    return response;
  } catch (error) {
    console.error("Error in deleteAssetAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// --- Add the new action below ---

/**
 * Server action to download a single asset's content and award XP
 */
const _downloadSingleAssetSchema = z.object({
  productId: z.string(),
  assetId: z.string(),
});

export async function downloadSingleAssetAction(
  data: z.infer<typeof _downloadSingleAssetSchema>
) {
  try {
    const { productId, assetId } = data;
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch the asset
    const result = await getAsset(productId, assetId);
    if (!result.success || !result.asset) {
      return { success: false, error: result.error || "Asset not found" };
    }

    // Award XP for downloading this asset
    try {
      await awardXpPoints("download_asset", userId);
      console.log(
        `Awarded XP to user ${userId} for downloading asset ${assetId}`
      );
    } catch (xpError) {
      console.error(
        "Failed to award XP for downloading single asset:",
        xpError
      );
      // Non-critical, continue
    }

    // Return the necessary asset details for client-side download
    return {
      success: true,
      asset: {
        id: result.asset.id,
        title: result.asset.title || "asset",
        content: result.asset.content || "", // Ensure content is always a string
      },
    };
  } catch (error) {
    console.error("Error in downloadSingleAssetAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
