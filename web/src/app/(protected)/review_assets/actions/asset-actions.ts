"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { saveAsset as saveAssetToFirebase } from "@/lib/firebase/assets";
import { Asset } from "../data/assets";

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
    document: z.string(),
    systemPrompt: z.string(),
    order: z.number(),
    content: z.string().optional(),
  }),
});

// Define server action for saving assets
export async function saveAssetAction(data: z.infer<typeof saveAssetSchema>) {
  try {
    const { productId, asset } = data;

    // Call the Firestore function with the appropriate type cast
    const response = await saveAssetToFirebase(productId, asset as any);

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
