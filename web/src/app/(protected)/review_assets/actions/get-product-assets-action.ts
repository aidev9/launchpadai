"use server";

import { z } from "zod";
import { getProductAssets } from "@/lib/firebase/assets";

// Get all assets for a specific product (server action wrapper)
export async function getProductAssetsAction(productId: string) {
  try {
    // Call the Firestore function
    const response = await getProductAssets(productId);
    return response;
  } catch (error) {
    console.error("Error in getProductAssetsAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
