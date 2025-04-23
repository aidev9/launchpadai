"use server";

import { adminDb } from "./admin";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

// Get the answers reference for a specific user and product
function getUserAnswersRef(userId: string, productId: string) {
  return adminDb
    .collection("questions")
    .doc(userId)
    .collection("products")
    .doc(productId)
    .collection("questions");
}

// Interface for question answers
export interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  questionId: string;
}

/**
 * Get all question answers for a product
 */
export async function getAllQuestionAnswers(productId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
        answers: [],
      };
    }

    const answersRef = getUserAnswersRef(userId, productId);
    const snapshot = await answersRef.get();

    const answers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure answer is always a string
        answer: data.answer || "",
      };
    }) as QuestionAnswer[];

    return {
      success: true,
      answers,
    };
  } catch (error) {
    console.error(`Failed to fetch answers for product ${productId}:`, error);
    return {
      success: false,
      answers: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
