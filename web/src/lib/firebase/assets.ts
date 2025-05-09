"use server";

import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { FirestoreAsset, Asset } from "@/lib/firebase/schema";
import { awardXpPoints } from "@/xp/server-actions";
import { get } from "http";
import { getCurrentUnixTimestamp } from "@/utils/constants";

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
function serializeFirestoreData(
  data: Record<string, FirebaseFirestore.FieldValue | any>
): Record<string, any> {
  if (!data) return data;

  const result: Record<string, any> = {};

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
 * Get assets by phase for a specific product
 */
export async function getAssetsByPhase(
  productId: string,
  phase: Asset["phase"]
) {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = getUserAssetRef(userId, productId);

    const snapshot = await assetsRef
      .where("phase", "==", phase)
      .orderBy("order", "asc")
      .get();

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
    console.error(`Failed to fetch assets for phase ${phase}:`, error);
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
    const data = assetDoc.data() as Record<string, any> | undefined;
    if (!data) {
      return {
        success: false,
        error: "Asset data is missing",
      };
    }
    return {
      success: true,
      asset: {
        id: assetDoc.id,
        ...serializeFirestoreData(data),
      } as FirestoreAsset, // Assert the final type
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
  assetData: Partial<FirestoreAsset> & { id: string }
) {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = getUserAssetRef(userId, productId);
    const assetDocRef = assetsRef.doc(assetData.id);

    // Check if the asset already exists before saving
    const docSnapshot = await assetDocRef.get();
    const isNewAsset = !docSnapshot.exists;

    const assetWithTimestamp = {
      ...assetData,
      updatedAt: getCurrentUnixTimestamp(),
      createdAt: assetData.createdAt || getCurrentUnixTimestamp(),
    };

    await assetDocRef.set(assetWithTimestamp, { merge: true });

    // Award XP if it's a new asset
    if (isNewAsset) {
      try {
        await awardXpPoints("add_asset", userId);
        console.log(
          `Awarded XP to user ${userId} for adding asset ${assetData.id}`
        );
      } catch (xpError) {
        console.error("Failed to award XP for adding asset:", xpError);
        // Non-critical, continue
      }
    }

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

/**
 * Delete an asset
 */
export async function deleteAsset(productId: string, assetId: string) {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = getUserAssetRef(userId, productId);

    await assetsRef.doc(assetId).delete();

    // Revalidate the assets page
    revalidatePath("/review_assets");

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
