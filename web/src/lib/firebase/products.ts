"use server";

import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { questions as staticQuestions } from "@/app/(protected)/answer_questions/data/questions";
// import { productQuestionInputSchema } from "./schema";
import { initializeProductAssets } from "./initialize-assets";
import { awardXpPoints } from "@/xp/server-actions";

// Import Jotai atoms
import {
  productCountAtom,
  productCountLoadedAtom,
} from "../store/product-store";
import { getDefaultStore } from "jotai";

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
  return adminDb.collection("questions").doc(userId).collection("products");
}

// Get the product questions ref for a specific user and product
function getProductQuestionsRef(userId: string, productId: string) {
  return getUserQuestionsRef(userId).doc(productId).collection("questions");
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
 * Create questions for a product in the questions collection
 */
async function createProductQuestions(userId: string, productId: string) {
  try {
    console.log(
      `Creating questions for product ${productId} (user ${userId}) in questions collection`
    );

    // Get references
    const productQuestionsRef = getProductQuestionsRef(userId, productId);

    // Create a batch write
    const batch = adminDb.batch();
    let count = 0;

    // Add each question from the static questions data
    for (const staticQuestion of staticQuestions) {
      try {
        // Generate a unique ID for each question
        const questionId = adminDb.collection("_").doc().id; // Generate a Firebase auto-ID

        // Format the question data - without the id from staticQuestions
        const now = new Date().toISOString();
        const questionData = {
          question: staticQuestion.text,
          answer: null,
          tags: [staticQuestion.phase.toLowerCase()],
          phase: staticQuestion.phase,
          order: staticQuestion.order,
          createdAt: now,
          last_modified: now,
        };

        // Add to batch
        const newQuestionRef = productQuestionsRef.doc(questionId);
        batch.set(newQuestionRef, questionData);
        count++;
      } catch (err) {
        console.error(`Error processing question:`, err);
        // Continue with other questions
      }
    }

    if (count === 0) {
      console.warn(
        "No questions were added to the batch. Check if staticQuestions is empty or has invalid data."
      );
      return { success: false, count: 0 };
    }

    // Commit the batch
    await batch.commit();
    console.log(
      `Successfully created ${count} questions for product ${productId} in questions collection`
    );

    return {
      success: true,
      count: count,
    };
  } catch (error) {
    console.error("Failed to create product questions:", error);
    throw error;
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
