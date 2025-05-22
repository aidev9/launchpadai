"use server";

import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { questions as staticQuestions } from "@/app/(protected)/answer_questions/data/questions";
import { initializeProductAssets } from "./initialize-assets";
import { awardXpPoints } from "@/xp/server-actions";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { firebaseQA } from "./client/FirebaseQA";

// Root products collection reference
// const productsCollection = adminDb.collection("products");

// Questions collection reference
// const questionsCollection = adminDb.collection("questions");

// Get the productsRef for a specific user
function getUserProductsRef(userId: string) {
  return adminDb.collection("products").doc(userId).collection("products");
}

// Get the questionsRef for a specific user
function getUserQuestionsRef(userId: string) {
  return adminDb.collection("questions").doc(userId).collection("questions");
}

// Schema for product creation/update
const productInputSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  phases: z.array(z.string()).optional(),
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
    const productData = {
      ...validatedData,
      createdAt: getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
    };

    // Add to Firestore
    const docRef = await productsRef.add(productData);
    const productId = docRef.id;

    try {
      // Create questions for this product in the questions collection
      await createProductQuestions(userId, productId);
      console.log(`Successfully created questions for product ${productId}`);
    } catch (questionsError) {
      console.error(
        `Failed to create questions for product ${productId}:`,
        questionsError
      );
      // Continue with product creation even if questions creation fails
      // This way we don't lose the product data
    }

    try {
      // Initialize assets for this product
      await initializeProductAssets(productId);
      console.log(`Successfully initialized assets for product ${productId}`);
    } catch (assetsError) {
      console.error(
        `Failed to initialize assets for product ${productId}:`,
        assetsError
      );
      // Continue with product creation even if asset initialization fails
    }

    // Award XP for creating a product
    try {
      await awardXpPoints("create_product", userId);
      console.log(
        `Awarded XP to user ${userId} for creating product ${productId}`
      );
    } catch (xpError) {
      console.error(`Failed to award XP for product creation:`, xpError);
      // Continue with product creation even if XP awarding fails
    }

    // Revalidate relevant paths
    revalidatePath("/welcome");
    revalidatePath("/dashboard");

    return {
      success: true,
      id: productId,
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
 * Create questions for a product in the questions collection using the correct path structure
 */
async function createProductQuestions(userId: string, productId: string) {
  try {
    console.log(
      `Creating questions for product ${productId} (user ${userId}) in questions collection`
    );

    // Prepare the questions data from static questions
    const questionsData = staticQuestions.map((staticQuestion) => ({
      question: staticQuestion.text,
      answer: null,
      tags: [staticQuestion.phases[0].toLowerCase()],
      phases: staticQuestion.phases,
      order: staticQuestion.order,
      userId: userId, // Add userId to each question
      productId: productId, // Add productId to each question
    }));

    // Use the new bulk create method through a server-side wrapper
    const result = await createBulkQuestionsServerWrapper(
      productId,
      questionsData
    );

    if (result.success) {
      console.log(
        `Successfully created ${result.count} questions for product ${productId} in questions collection`
      );
      return result;
    } else {
      console.error(
        `Failed to create questions for product ${productId}:`,
        result.error
      );
      throw new Error(result.error || "Failed to create questions");
    }
  } catch (error) {
    console.error("Failed to create product questions:", error);
    throw error;
  }
}

/**
 * Server wrapper to use firebase client in server actions with the correct path
 */
async function createBulkQuestionsServerWrapper(
  productId: string,
  questionsData: Array<{
    question: string;
    answer: null;
    tags: string[];
    phases: string[];
    order: number;
    userId: string;
    productId: string; // Include productId field
  }>
) {
  // We're going to use the Firebase Admin SDK to create the questions
  // using the path questions/{userId}/questions with productId in each question

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        count: 0,
        error: "User not authenticated",
      };
    }

    // Get a reference to the questions collection (UPDATED PATH)
    const questionsRef = adminDb
      .collection("questions")
      .doc(userId)
      .collection("questions");

    // Create a batch write
    const batch = adminDb.batch();
    let count = 0;

    // Current timestamp
    const timestamp = getCurrentUnixTimestamp();

    // Add each question to the batch
    for (const questionData of questionsData) {
      try {
        // Generate a unique ID for each question
        const questionId = adminDb.collection("_").doc().id;

        // Format the question data with timestamps
        const data = {
          ...questionData,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        // Add to batch
        const newQuestionRef = questionsRef.doc(questionId);
        batch.set(newQuestionRef, data);
        count++;
      } catch (err) {
        console.error(`Error processing question:`, err);
        // Continue with other questions
      }
    }

    if (count === 0) {
      return {
        success: false,
        count: 0,
        error: "No questions were added to the batch",
      };
    }

    // Commit the batch
    await batch.commit();

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error("Failed to create product questions:", error);
    return {
      success: false,
      count: 0,
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

    const updateData = {
      ...data,
      updatedAt: getCurrentUnixTimestamp(),
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
 * Delete multiple products
 * @param ids Array of product IDs to delete
 * @returns Object with success status and count of deleted products
 */
export async function deleteMultipleProducts(ids: string[]) {
  try {
    // Validate inputs
    if (!ids || ids.length === 0) {
      return {
        success: false,
        error: "No product IDs provided",
        deletedCount: 0,
      };
    }

    // Limit the number of products that can be deleted at once
    if (ids.length > 100) {
      return {
        success: false,
        error: "Cannot delete more than 100 products at once",
        deletedCount: 0,
      };
    }

    const userId = await getCurrentUserId();
    const productsRef = getUserProductsRef(userId);

    // Create a batch write
    const batch = adminDb.batch();
    let deletedCount = 0;

    // Add each product to the batch delete
    for (const id of ids) {
      const productRef = productsRef.doc(id);
      const productDoc = await productRef.get();

      if (productDoc.exists) {
        batch.delete(productRef);
        deletedCount++;
      }
    }

    // Commit the batch
    await batch.commit();

    // Revalidate relevant paths
    revalidatePath("/welcome");
    revalidatePath("/dashboard");
    revalidatePath("/product");

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    console.error("Error deleting multiple products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      deletedCount: 0,
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
    const snapshot = await productsRef.orderBy("updatedAt", "desc").get();
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      products,
    };
  } catch (error) {
    // Check if it's an authentication error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("not authenticated") ||
      errorMessage.includes("Authentication failed")
    ) {
      console.error("Authentication error in getAllProducts:", errorMessage);
      return {
        success: false,
        error: "Authentication required. Please sign in again.",
        authError: true,
      };
    }

    console.error("Failed to fetch products:", error);
    return {
      success: false,
      error: errorMessage,
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
