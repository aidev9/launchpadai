"use server";

import { getProductAssets } from "@/lib/firebase/assets";

/**
 * Get all assets for a product
 */
export async function getProductAssetsAction(productId: string) {
  try {
    if (!productId) {
      return {
        success: false,
        error: "Product ID is required",
      };
    }

    return await getProductAssets(productId);
  } catch (error) {
    console.error("Error in getProductAssetsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
