import { adminDb } from "./admin";

interface AssetRecord {
  id: string;
  productId: string;
  name: string;
  content: string;
  category: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  size: number;
}

// Get all assets for a product
export async function getProductAssets(productId: string) {
  try {
    const assetsSnapshot = await adminDb
      .collection("assets")
      .where("productId", "==", productId)
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
    console.error("Error getting assets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get a single asset by ID
export async function getAsset(assetId: string) {
  try {
    const assetDoc = await adminDb.collection("assets").doc(assetId).get();

    if (!assetDoc.exists) {
      return { success: false, error: "Asset not found" };
    }

    return {
      success: true,
      asset: {
        id: assetDoc.id,
        ...assetDoc.data(),
      },
    };
  } catch (error) {
    console.error("Error getting asset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Create or update an asset
export async function saveAsset(
  productId: string,
  assetData: {
    name: string;
    content: string;
    category: string;
    type?: string;
    id?: string; // Only for updates
  }
) {
  try {
    const now = new Date();
    const size = new Blob([assetData.content]).size;

    if (assetData.id) {
      // Update existing asset
      await adminDb
        .collection("assets")
        .doc(assetData.id)
        .update({
          content: assetData.content,
          category: assetData.category,
          type: assetData.type || "markdown",
          updatedAt: now,
          size,
        });

      return { success: true, id: assetData.id };
    } else {
      // Create new asset
      const newAsset: Omit<AssetRecord, "id"> = {
        productId,
        name: assetData.name,
        content: assetData.content,
        category: assetData.category,
        type: assetData.type || "markdown",
        createdAt: now,
        updatedAt: now,
        size,
      };

      const docRef = await adminDb.collection("assets").add(newAsset);
      return { success: true, id: docRef.id };
    }
  } catch (error) {
    console.error("Error saving asset:", error);
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
