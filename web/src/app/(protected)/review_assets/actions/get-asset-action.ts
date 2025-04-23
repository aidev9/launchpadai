"use server";

import { z } from "zod";
import { getAsset } from "@/lib/firebase/assets";

// Get a single asset by ID (server action wrapper)
export async function getAssetAction(productId: string, assetId: string) {
  try {
    // Call the Firestore function
    const response = await getAsset(productId, assetId);
    return response;
  } catch (error) {
    console.error("Error in getAssetAction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
