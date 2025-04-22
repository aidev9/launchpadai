"use server";

import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

// Schema for asset validation
const assetSchema = z.object({
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
  last_modified: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
});

export type Asset = z.infer<typeof assetSchema>;

// Get the assets reference for a specific user and product
function getUserAssetRef(userId: string, productId: string) {
  return adminDb
    .collection("assets")
    .doc(userId)
    .collection("products")
    .doc(productId)
    .collection("assets");
}

// Helper to convert Firestore timestamps to ISO strings
function serializeFirestoreData(data: any): any {
  if (!data) return data;

  const result: any = {};

  Object.keys(data).forEach((key) => {
    const value = data[key];

    // Check if value is a Firestore timestamp
    if (
      value &&
      typeof value === "object" &&
      value.toDate instanceof Function
    ) {
      // Convert to ISO string
      result[key] = value.toDate().toISOString();
    }
    // Check if value is an object (but not an array)
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      // Recursively serialize nested objects
      result[key] = serializeFirestoreData(value);
    } else {
      // Pass through other values
      result[key] = value;
    }
  });

  return result;
}

/**
 * Get all assets for a specific product
 */
export async function getProductAssets(productId: string) {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = getUserAssetRef(userId, productId);

    const snapshot = await assetsRef.orderBy("order", "asc").get();

    // Serialize each asset document to handle timestamps
    const assets = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...serializeFirestoreData(data),
      };
    });

    return {
      success: true,
      assets,
    };
  } catch (error) {
    console.error(`Failed to fetch assets for product ${productId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a single asset by ID
 */
export async function getAsset(productId: string, assetId: string) {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = getUserAssetRef(userId, productId);

    const assetDoc = await assetsRef.doc(assetId).get();

    if (!assetDoc.exists) {
      return {
        success: false,
        error: "Asset not found",
      };
    }

    // Serialize the asset document to handle timestamps
    const data = assetDoc.data();
    return {
      success: true,
      asset: {
        id: assetDoc.id,
        ...serializeFirestoreData(data),
      },
    };
  } catch (error) {
    console.error(`Failed to fetch asset ${assetId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Save or update an asset
 */
export async function saveAsset(
  productId: string,
  assetData: Partial<Asset> & { id: string }
) {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = getUserAssetRef(userId, productId);

    const now = new Date();
    const assetWithTimestamp = {
      ...assetData,
      last_modified: now,
      createdAt: assetData.createdAt || now,
    };

    await assetsRef.doc(assetData.id).set(assetWithTimestamp, { merge: true });

    // Revalidate the assets page
    revalidatePath("/review_assets");

    return {
      success: true,
      asset: {
        ...assetWithTimestamp,
      },
    };
  } catch (error) {
    console.error(`Failed to save asset:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Delete an asset
export async function deleteAsset(assetId: string) {
  try {
    await adminDb.collection("assets").doc(assetId).delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting asset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get assets by category
export async function getAssetsByCategory(productId: string, category: string) {
  try {
    const assetsSnapshot = await adminDb
      .collection("assets")
      .where("productId", "==", productId)
      .where("category", "==", category)
      .get();

    if (assetsSnapshot.empty) {
      return { success: true, assets: [] };
    }

    const assets = assetsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, assets };
  } catch (error) {
    console.error("Error getting assets by category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
