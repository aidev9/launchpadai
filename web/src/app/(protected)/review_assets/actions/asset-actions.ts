"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { saveAsset as saveAssetToFirebase } from "@/lib/firebase/assets";
import { Asset } from "../data/assets";
import { FirestoreAsset } from "@/lib/firebase/initialize-assets";

// Schema for saving assets
const saveAssetSchema = z.object({
  productId: z.string(),
  asset: z.object({
    id: z.string(),
    phase: z.enum([
      "Discover",
      "Validate",
      "Design",
      "Build",
      "Secure",
      "Launch",
      "Grow",
    ]),
    title: z.string(),
    description: z.string().optional(),
    systemPrompt: z.string(),
    tags: z.array(z.string()).optional(),
    order: z.number(),
    content: z.string().optional(),
  }),
});

// Define server action for saving assets
export async function saveAssetAction(data: z.infer<typeof saveAssetSchema>) {
  try {
    const { productId, asset } = data;

    // Make sure we have tags array
    const assetWithTags = {
      ...asset,
      tags: asset.tags || [asset.phase],
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
const deleteAssetSchema = z.object({
  productId: z.string(),
  assetId: z.string(),
});

// Define server action for deleting assets
export async function deleteAssetAction(
  data: z.infer<typeof deleteAssetSchema>
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
