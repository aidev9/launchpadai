"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminDb } from "./admin";
import { getCurrentUserId } from "./adminAuth";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { featureInputSchema, Feature } from "../firebase/schema/feature";

/**
 * Create a new feature
 */
export async function createFeature(data: z.infer<typeof featureInputSchema>) {
  try {
    // Validate input data
    const validatedData = featureInputSchema.parse(data);

    // Additional validation
    if (!validatedData.productId) {
      return {
        success: false,
        error: "Product ID is required",
      };
    }

    // Validate name length
    if (validatedData.name.length > 100) {
      return {
        success: false,
        error: "Feature name cannot exceed 100 characters",
      };
    }

    // Validate description length
    if (validatedData.description && validatedData.description.length > 5000) {
      return {
        success: false,
        error: "Feature description cannot exceed 5000 characters",
      };
    }

    // Validate tags
    if (validatedData.tags && validatedData.tags.length > 20) {
      return {
        success: false,
        error: "Cannot have more than 20 tags per feature",
      };
    }

    // Check if any tag is too long
    if (
      validatedData.tags &&
      validatedData.tags.some((tag) => tag.length > 50)
    ) {
      return {
        success: false,
        error: "Tags cannot exceed 50 characters each",
      };
    }

    const userId = await getCurrentUserId();

    // Verify product exists
    const productRef = adminDb
      .collection("products")
      .doc(userId)
      .collection("products")
      .doc(validatedData.productId);

    const productDoc = await productRef.get();
    if (!productDoc.exists) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    const featuresRef = getUserProductFeaturesRef(
      userId,
      validatedData.productId
    );

    // Check for unique name within product
    const existingFeatures = await featuresRef
      .where("name", "==", validatedData.name)
      .get();

    if (!existingFeatures.empty) {
      return {
        success: false,
        error: "A feature with this name already exists for this product",
      };
    }

    // Check if user has too many features already (limit to 1000 per product)
    const featureCount = await featuresRef.count().get();
    if (featureCount.data().count >= 1000) {
      return {
        success: false,
        error: "Maximum number of features reached for this product (1000)",
      };
    }

    // Add timestamps
    const featureData = {
      ...validatedData,
      createdAt: getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
    };

    // Add to Firestore
    const docRef = await featuresRef.add(featureData);
    const featureId = docRef.id;

    // Revalidate relevant paths
    revalidatePath("/myproducts/product/features");

    return {
      success: true,
      id: featureId,
      data: featureData,
    };
  } catch (error) {
    console.error("Failed to create feature:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update an existing feature
 */
export async function updateFeature(
  id: string,
  productId: string,
  data: Partial<z.infer<typeof featureInputSchema>>
) {
  try {
    // Validate inputs
    if (!id) {
      return {
        success: false,
        error: "Feature ID is required",
      };
    }

    if (!productId) {
      return {
        success: false,
        error: "Product ID is required",
      };
    }

    if (Object.keys(data).length === 0) {
      return {
        success: false,
        error: "No update data provided",
      };
    }

    const userId = await getCurrentUserId();
    const featuresRef = getUserProductFeaturesRef(userId, productId);
    const featureRef = featuresRef.doc(id);

    // Use a transaction for atomicity
    const result = await adminDb.runTransaction(async (transaction) => {
      // Check if feature exists
      const featureDoc = await transaction.get(featureRef);
      if (!featureDoc.exists) {
        return {
          success: false,
          error: "Feature not found",
        };
      }

      // If name is being updated, check for uniqueness
      if (data.name) {
        const existingFeaturesQuery = featuresRef.where(
          "name",
          "==",
          data.name
        );
        const existingFeatures = await transaction.get(existingFeaturesQuery);

        const isDuplicate = existingFeatures.docs.some((doc) => doc.id !== id);
        if (isDuplicate) {
          return {
            success: false,
            error: "A feature with this name already exists for this product",
          };
        }
      }

      const updateData = {
        ...data,
        updatedAt: getCurrentUnixTimestamp(),
      };

      // Update the feature in the transaction
      transaction.update(featureRef, updateData);

      return {
        success: true,
        id,
        data: updateData,
      };
    });

    // Revalidate relevant paths
    revalidatePath("/myproducts/product/features");

    return result;
  } catch (error) {
    console.error(`Failed to update feature ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a feature
 */
export async function deleteFeature(id: string, productId: string) {
  try {
    const userId = await getCurrentUserId();
    const featuresRef = getUserProductFeaturesRef(userId, productId);

    // Check if feature exists
    const featureDoc = await featuresRef.doc(id).get();
    if (!featureDoc.exists) {
      return {
        success: false,
        error: "Feature not found",
      };
    }

    // Delete the feature
    await featuresRef.doc(id).delete();

    // Revalidate relevant paths
    revalidatePath("/myproducts/product/features");

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error(`Failed to delete feature ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete multiple features
 */
export async function deleteMultipleFeatures(ids: string[], productId: string) {
  try {
    // Validate inputs
    if (!productId) {
      return {
        success: false,
        error: "Product ID is required",
      };
    }

    if (!ids || ids.length === 0) {
      return {
        success: false,
        error: "No feature IDs provided",
      };
    }

    // Limit the number of features that can be deleted at once
    if (ids.length > 100) {
      return {
        success: false,
        error: "Cannot delete more than 100 features at once",
      };
    }

    const userId = await getCurrentUserId();
    const featuresRef = getUserProductFeaturesRef(userId, productId);

    // Verify all features exist before deleting
    const featurePromises = ids.map((id) => featuresRef.doc(id).get());
    const featureDocs = await Promise.all(featurePromises);

    const nonExistentIds = featureDocs
      .map((doc, index) => (doc.exists ? null : ids[index]))
      .filter(Boolean);

    if (nonExistentIds.length > 0) {
      return {
        success: false,
        error: `Some features do not exist: ${nonExistentIds.join(", ")}`,
      };
    }

    // Create a batch write
    const batch = adminDb.batch();

    // Add each feature deletion to the batch
    for (const id of ids) {
      const featureRef = featuresRef.doc(id);
      batch.delete(featureRef);
    }

    // Commit the batch
    await batch.commit();

    // Revalidate relevant paths
    revalidatePath("/myproducts/product/features");

    return {
      success: true,
      count: ids.length,
    };
  } catch (error) {
    console.error(`Failed to delete features:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all features for a product
 */
export async function getProductFeatures(productId: string) {
  try {
    const userId = await getCurrentUserId();
    const featuresRef = getUserProductFeaturesRef(userId, productId);

    const snapshot = await featuresRef.orderBy("updatedAt", "desc").get();

    const features = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Feature[];

    return {
      success: true,
      features,
    };
  } catch (error) {
    console.error("Failed to fetch features:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a single feature by ID
 */
export async function getFeature(id: string, productId: string) {
  try {
    const userId = await getCurrentUserId();
    const featuresRef = getUserProductFeaturesRef(userId, productId);

    const featureDoc = await featuresRef.doc(id).get();

    if (!featureDoc.exists) {
      return {
        success: false,
        error: "Feature not found",
      };
    }

    return {
      success: true,
      feature: {
        id: featureDoc.id,
        ...featureDoc.data(),
      } as Feature,
    };
  } catch (error) {
    console.error(`Failed to fetch feature ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper function to get features reference
 */
function getUserProductFeaturesRef(userId: string, productId: string) {
  return adminDb
    .collection("products")
    .doc(userId)
    .collection("products")
    .doc(productId)
    .collection("features");
}
