"use server";

import { adminDb } from "../admin";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import {
  TechStackAsset,
  TechStackAssetInput,
  techStackAssetInputSchema,
} from "../schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Get the techStacksRef for a specific user
function getUserTechStacksRef(userId: string) {
  return adminDb.collection("products").doc(userId).collection("products");
}

// Get the assets collection reference for a specific tech stack
// Making this a non-exported helper function since it's not async
function _getTechStackAssetsRef(userId: string, techStackId: string) {
  return getUserTechStacksRef(userId)
    .doc("stacks")
    .collection("stacks")
    .doc(techStackId)
    .collection("assets");
}

// Async wrapper function that can be exported
export async function getTechStackAssetsRef(
  userId: string,
  techStackId: string
) {
  return _getTechStackAssetsRef(userId, techStackId);
}

/**
 * Create a new tech stack asset
 */
export async function createTechStackAsset(data: TechStackAssetInput) {
  try {
    // Validate input data
    const validatedData = techStackAssetInputSchema.parse(data);
    const userId = await getCurrentUserId();
    const assetsRef = _getTechStackAssetsRef(userId, data.techStackId);

    const assetData = {
      ...validatedData,
      createdAt: getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
    };

    // Add to Firestore
    const docRef = await assetsRef.add(assetData);
    const assetId = docRef.id;

    // Note: Removed revalidatePath call to avoid rendering errors
    // The UI will handle updates through direct state management

    return {
      success: true,
      id: assetId,
      data: assetData,
    };
  } catch (error) {
    console.error("Failed to create tech stack asset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all assets for a tech stack
 */
export async function getTechStackAssets(techStackId: string) {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = _getTechStackAssetsRef(userId, techStackId);

    // Order by createdAt instead of updatedAt to maintain consistent order
    // This ensures assets stay in the same order even when regenerated
    const snapshot = await assetsRef.orderBy("createdAt", "asc").get();

    const assets = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TechStackAsset[];

    return {
      success: true,
      assets,
    };
  } catch (error) {
    console.error(
      `Failed to fetch assets for tech stack ${techStackId}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a single asset by ID
 */
export async function getTechStackAsset(techStackId: string, assetId: string) {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = _getTechStackAssetsRef(userId, techStackId);

    const assetDoc = await assetsRef.doc(assetId).get();

    if (!assetDoc.exists) {
      return {
        success: false,
        error: "Asset not found",
      };
    }

    return {
      success: true,
      asset: {
        id: assetDoc.id,
        ...assetDoc.data(),
      } as TechStackAsset,
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
 * Update an existing asset
 */
export async function updateTechStackAsset(
  techStackId: string,
  assetId: string,
  data: Partial<TechStackAssetInput>
) {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = _getTechStackAssetsRef(userId, techStackId);

    // Check if asset exists
    const assetDoc = await assetsRef.doc(assetId).get();
    if (!assetDoc.exists) {
      return {
        success: false,
        error: "Asset not found",
      };
    }

    // Update with new data and updatedAt timestamp
    const updateData = {
      ...data,
      updatedAt: getCurrentUnixTimestamp(),
    };

    await assetsRef.doc(assetId).update(updateData);

    // Note: Removed revalidatePath call to avoid rendering errors
    // The UI will handle updates through direct state management

    return {
      success: true,
      id: assetId,
      data: updateData,
    };
  } catch (error) {
    console.error(`Failed to update asset ${assetId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete an asset
 */
export async function deleteTechStackAsset(
  techStackId: string,
  assetId: string
) {
  try {
    const userId = await getCurrentUserId();
    const assetsRef = _getTechStackAssetsRef(userId, techStackId);

    // Check if asset exists
    const assetDoc = await assetsRef.doc(assetId).get();
    if (!assetDoc.exists) {
      return {
        success: false,
        error: "Asset not found",
      };
    }

    // Delete the asset
    await assetsRef.doc(assetId).delete();

    // Note: Removed revalidatePath call to avoid rendering errors
    // The UI will handle updates through direct state management

    return {
      success: true,
      id: assetId,
    };
  } catch (error) {
    console.error(`Failed to delete asset ${assetId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
