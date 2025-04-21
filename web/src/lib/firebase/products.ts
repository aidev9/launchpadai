"use server";

import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

// Root products collection reference
const productsCollection = adminDb.collection("products");

// Get the productsRef for a specific user
function getUserProductsRef(userId: string) {
  return productsCollection.doc(userId).collection("products");
}

// Schema for product creation/update
const productInputSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  stage: z.enum([
    "Discover",
    "Validate",
    "Design",
    "Build",
    "Secure",
    "Launch",
    "Grow",
  ]),
  problem: z.string().optional(),
  team: z.string().optional(),
  website: z.string().optional(),
  country: z.string().optional(),
  template_id: z.string().optional(),
  template_type: z.enum(["app", "agent", "integration", "blank"]).optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

/**
 * Create a new product
 */
export async function createProduct(data: ProductInput) {
  try {
    // Validate input data
    const validatedData = productInputSchema.parse(data);
    const userId = await getCurrentUserId();
    const productsRef = getUserProductsRef(userId);

    // Add timestamps
    const now = new Date().toISOString();
    const productData = {
      ...validatedData,
      createdAt: now,
      last_modified: now,
    };

    // Add to Firestore
    const docRef = await productsRef.add(productData);

    // Revalidate relevant paths
    revalidatePath("/welcome");
    revalidatePath("/dashboard");

    return {
      success: true,
      id: docRef.id,
      data: productData,
    };
  } catch (error) {
    console.error("Failed to create product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, data: Partial<ProductInput>) {
  try {
    const userId = await getCurrentUserId();
    const productsRef = getUserProductsRef(userId);

    // Check if product exists
    const productDoc = await productsRef.doc(id).get();
    if (!productDoc.exists) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Update with new data and last_modified timestamp
    const updateData = {
      ...data,
      last_modified: new Date().toISOString(),
    };

    await productsRef.doc(id).update(updateData);

    // Revalidate relevant paths
    revalidatePath("/welcome");
    revalidatePath("/dashboard");
    revalidatePath("/product");

    return {
      success: true,
      id,
      data: updateData,
    };
  } catch (error) {
    console.error(`Failed to update product ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string) {
  try {
    const userId = await getCurrentUserId();
    const productsRef = getUserProductsRef(userId);

    // Check if product exists
    const productDoc = await productsRef.doc(id).get();
    if (!productDoc.exists) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Delete the product
    await productsRef.doc(id).delete();

    // Revalidate relevant paths
    revalidatePath("/welcome");
    revalidatePath("/dashboard");
    revalidatePath("/product");

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error(`Failed to delete product ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Fetch all products for the current user
 */
export async function getAllProducts() {
  try {
    const userId = await getCurrentUserId();
    const productsRef = getUserProductsRef(userId);

    const snapshot = await productsRef.orderBy("last_modified", "desc").get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      products,
    };
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string) {
  try {
    const userId = await getCurrentUserId();
    const productsRef = getUserProductsRef(userId);

    const productDoc = await productsRef.doc(id).get();

    if (!productDoc.exists) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    return {
      success: true,
      product: {
        id: productDoc.id,
        ...productDoc.data(),
      },
    };
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Count products for the current user
 */
export async function countProducts() {
  try {
    const userId = await getCurrentUserId();
    const productsRef = getUserProductsRef(userId);

    const snapshot = await productsRef.count().get();
    const count = snapshot.data().count;

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error("Failed to count products:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
