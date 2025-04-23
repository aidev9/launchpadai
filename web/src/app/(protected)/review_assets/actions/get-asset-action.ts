"use server";

import { getAsset } from "@/lib/firebase/assets";

/**
 * Get a single asset by ID
 */
export async function getAssetAction(productId: string, assetId: string) {
  try {
    if (!productId || !assetId) {
      return {
        success: false,
        error: "Product ID and Asset ID are required",
      };
    }

    return await getAsset(productId, assetId);
  } catch (error) {
    console.error("Error in getAssetAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
