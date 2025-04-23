"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "../admin";
import { getCurrentUserId } from "../adminAuth";
import { getProductQuestionsRef } from "../questions";
import { ProductQuestionInput } from "@/lib/firebase/schema";
import { z } from "zod";

// Get reference to the questions collection
const questionsCollection = adminDb.collection("questions");

// Helper function for getting question reference (not exported)
async function getProductQuestionsRefHelper(userId: string, productId: string) {
  return await getProductQuestionsRef(userId, productId);
}

/**
 * Save or update an answer to a product question using React Server Action
 */
export async function saveQuestionAnswer(
  productId: string,
  questionId: string,
  answer: string
) {
  if (!productId || !questionId) {
    return {
      success: false,
      error: "Product ID and Question ID are required",
    };
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Get reference to the question using the helper function
    const questionsRef = await getProductQuestionsRefHelper(userId, productId);
    const questionRef = questionsRef.doc(questionId);

    // We'll just update without checking existence first, which is faster
    // This is safe as the client should only call this with valid questions

    // Update the answer and last_modified timestamp
    const now = new Date().toISOString();
    await questionRef.update({
      answer,
      last_modified: now,
    });

    // Revalidate the UI
    // Defer revalidation to improve performance
    Promise.resolve().then(() => {
      revalidatePath("/answer_questions");
      revalidatePath("/product");
    });

    return {
      success: true,
      id: questionId,
    };
  } catch (error) {
    console.error(`Failed to save answer for question ${questionId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all questions for a product, ordered by order in ascending order
 */
export async function getOrderedProductQuestions(productId: string) {
  if (!productId) {
    return {
      success: false,
      error: "Product ID is required",
    };
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Get reference to the questions collection using the helper function
    const questionsRef = await getProductQuestionsRefHelper(userId, productId);

    // Get questions ordered by 'order' in ascending order
    const snapshot = await questionsRef.orderBy("order", "asc").get();

    const questions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      questions,
    };
  } catch (error) {
    console.error(`Failed to fetch questions for product ${productId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteQuestionAction(
  productId: string,
  questionId: string
) {
  try {
    if (!productId || !questionId) {
      return {
        success: false,
        error: "Product ID and Question ID are required",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Get reference to the questions collection using the helper function
    const questionsRef = await getProductQuestionsRefHelper(userId, productId);
    const questionRef = questionsRef.doc(questionId);

    // Delete the question document
    await questionRef.delete();

    // Revalidate the UI
    // Defer revalidation to improve performance
    Promise.resolve().then(() => {
      revalidatePath("/answer_questions");
      revalidatePath("/product");
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting question:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Add a server action for creating questions
export async function addProductQuestionAction(
  productId: string,
  questionData: {
    question: string;
    answer: string | null;
    tags: string[];
    phase?: string;
  }
) {
  try {
    if (!productId) {
      return {
        success: false,
        error: "Product ID is required",
      };
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Get reference to the questions collection using the helper function
    const questionsRef = await getProductQuestionsRefHelper(userId, productId);

    // Generate a unique ID
    const questionId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Prepare the question data
    const now = new Date().toISOString();
    const phase = questionData.phase || questionData.tags[0] || "Discover";

    const newQuestion = {
      question: questionData.question,
      answer: questionData.answer,
      tags: questionData.tags,
      phase: phase,
      order: Date.now(), // Use timestamp for default ordering
      createdAt: now,
      last_modified: now,
    };

    // Add to Firestore
    await questionsRef.doc(questionId).set(newQuestion);

    // Revalidate the UI
    Promise.resolve().then(() => {
      revalidatePath("/answer_questions");
      revalidatePath("/product");
    });

    return {
      success: true,
      id: questionId,
      question: {
        id: questionId,
        ...newQuestion,
      },
    };
  } catch (error) {
    console.error("Error adding question:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
