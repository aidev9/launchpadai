"use server";

import { adminDb } from "./admin";
import {
  assets as defaultAssets,
  Asset,
} from "@/app/(protected)/review_assets/data/assets";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUserId } from "./adminAuth";

// Interface for an asset in Firestore
export interface FirestoreAsset {
  id: string;
  title: string;
  description: string;
  systemPrompt: string;
  phase: Asset["phase"];
  tags: string[];
  order: number;
  created_at: Date;
  last_updated: Date;
  content?: string;
}

/**
 * Initialize assets for a user's product
 * This should be called when a product is first created
 */
export async function initializeProductAssets(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = adminDb
      .collection("assets")
      .doc(userId)
      .collection("products")
      .doc(productId)
      .collection("assets");

    // Check if assets already exist
    const existing = await assetsRef.limit(1).get();
    if (!existing.empty) {
      return { success: true }; // Assets already initialized
    }

    // Create a batch to add all assets at once
    const batch = adminDb.batch();
    const now = new Date();

    // Create a new asset from each default asset with a new ID
    for (const defaultAsset of defaultAssets) {
      const newAssetId = uuidv4();
      const assetRef = assetsRef.doc(newAssetId);

      const firestoreAsset: FirestoreAsset = {
        id: newAssetId,
        title: defaultAsset.document,
        description: defaultAsset.document,
        systemPrompt: defaultAsset.systemPrompt,
        phase: defaultAsset.phase,
        tags: [defaultAsset.phase],
        order: defaultAsset.order,
        created_at: now,
        last_updated: now,
      };

      batch.set(assetRef, firestoreAsset);
    }

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error("Error initializing product assets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
