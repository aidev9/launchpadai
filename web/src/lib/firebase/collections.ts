"use server";

import { adminDb } from "./admin";
import { getCurrentUserId } from "./adminAuth";
import { Collection, CollectionInput, CollectionStatus } from "./schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Collection paths
const getCollectionPath = (userId: string) =>
  `collections/${userId}/collections`;
const getCollectionDoc = (userId: string, collectionId: string) =>
  `${getCollectionPath(userId)}/${collectionId}`;

/**
 * Create a new collection
 * @param data Collection data to create
 * @returns Object with success status and created collection ID
 */
export async function createCollection(data: CollectionInput) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const collectionRef = adminDb.collection(getCollectionPath(userId)).doc();

    const timestamp = getCurrentUnixTimestamp();
    const collection: Collection = {
      id: collectionRef.id,
      userId,
      productId: data.productId,
      title: data.title,
      description: data.description,
      phaseTags: data.phaseTags || [],
      tags: data.tags || [],
      status: data.status || "uploaded",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await collectionRef.set(collection);

    console.log(`Created collection: ${collectionRef.id}`);

    return {
      success: true,
      id: collectionRef.id,
      collection,
    };
  } catch (error) {
    console.error("Error creating collection:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create collection",
    };
  }
}

/**
 * Get a collection by ID
 * @param collectionId ID of the collection to retrieve
 * @returns Object with success status and collection data
 */
export async function getCollection(collectionId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const collectionDoc = await adminDb
      .doc(getCollectionDoc(userId, collectionId))
      .get();

    if (!collectionDoc.exists) {
      return { success: false, error: "Collection not found" };
    }

    const collection = collectionDoc.data() as Collection;

    return { success: true, collection };
  } catch (error) {
    console.error("Error getting collection:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get collection",
    };
  }
}

/**
 * Update a collection
 * @param collectionId ID of the collection to update
 * @param data Updated collection data
 * @returns Object with success status
 */
export async function updateCollection(
  collectionId: string,
  data: Partial<CollectionInput>
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const collectionRef = adminDb.doc(getCollectionDoc(userId, collectionId));
    const collectionDoc = await collectionRef.get();

    if (!collectionDoc.exists) {
      return { success: false, error: "Collection not found" };
    }

    const updateData = {
      ...data,
      updatedAt: getCurrentUnixTimestamp(),
    };

    await collectionRef.update(updateData);

    return { success: true };
  } catch (error) {
    console.error("Error updating collection:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update collection",
    };
  }
}

/**
 * Update a collection's status
 * @param collectionId ID of the collection to update
 * @param status New status
 * @returns Object with success status
 */
export async function updateCollectionStatus(
  collectionId: string,
  status: CollectionStatus
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const collectionRef = adminDb.doc(getCollectionDoc(userId, collectionId));
    const collectionDoc = await collectionRef.get();

    if (!collectionDoc.exists) {
      return { success: false, error: "Collection not found" };
    }

    await collectionRef.update({
      status,
      updatedAt: getCurrentUnixTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating collection status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update collection status",
    };
  }
}

/**
 * Delete a collection
 * @param collectionId ID of the collection to delete
 * @returns Object with success status
 */
export async function deleteCollection(collectionId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const collectionRef = adminDb.doc(getCollectionDoc(userId, collectionId));
    const collectionDoc = await collectionRef.get();

    if (!collectionDoc.exists) {
      return { success: false, error: "Collection not found" };
    }

    await collectionRef.delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting collection:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete collection",
    };
  }
}

/**
 * Get all collections for the current user
 * @returns Object with success status and array of collections
 */
export async function getUserCollections() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
        collections: [],
      };
    }

    const collectionsSnapshot = await adminDb
      .collection(getCollectionPath(userId))
      .get();

    const collections = collectionsSnapshot.docs.map(
      (doc) => doc.data() as Collection
    );

    return { success: true, collections };
  } catch (error) {
    console.error("Error getting user collections:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get collections",
      collections: [],
    };
  }
}

/**
 * Get collections for a specific product
 * @param productId ID of the product to get collections for
 * @returns Object with success status and array of collections
 */
export async function getCollectionsByProduct(productId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
        collections: [],
      };
    }

    const collectionsSnapshot = await adminDb
      .collection(getCollectionPath(userId))
      .where("productId", "==", productId)
      .get();

    const collections = collectionsSnapshot.docs.map(
      (doc) => doc.data() as Collection
    );

    return { success: true, collections };
  } catch (error) {
    console.error("Error getting collections by product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get collections",
      collections: [],
    };
  }
}

/**
 * Delete multiple collections
 * @param collectionIds Array of collection IDs to delete
 * @returns Object with success status and count of deleted collections
 */
export async function deleteMultipleCollections(collectionIds: string[]) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
        deletedCount: 0,
      };
    }

    const batch = adminDb.batch();
    let deletedCount = 0;

    // Add each collection to the batch delete
    for (const collectionId of collectionIds) {
      const collectionRef = adminDb.doc(getCollectionDoc(userId, collectionId));
      const collectionDoc = await collectionRef.get();

      if (collectionDoc.exists) {
        batch.delete(collectionRef);
        deletedCount++;
      }
    }

    // Commit the batch
    await batch.commit();

    return { success: true, deletedCount };
  } catch (error) {
    console.error("Error deleting multiple collections:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete collections",
      deletedCount: 0,
    };
  }
}
