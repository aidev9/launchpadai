"use server";

import { revalidatePath } from "next/cache";
// import { adminDb } from "../admin";
import { getCurrentUserId } from "../adminAuth";
import { getProductQuestionsRef } from "../questions";
import { awardXpPoints } from "@/xp/server-actions"; // Import XP award function

// Get reference to the questions collection
// const questionsCollection = adminDb.collection("questions");

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

    const questions = snapshot.docs.map((doc) => ({
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

// Add a server action for updating existing questions
export async function updateProductQuestionAction(
  productId: string,
  questionId: string,
  questionData: {
    question: string;
    answer: string | null;
    tags: string[];
    phase?: string;
  }
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

    // Check if question exists
    const questionDoc = await questionsRef.doc(questionId).get();
    if (!questionDoc.exists) {
      return {
        success: false,
        error: "Question not found",
      };
    }

    // Get the existing data
    const existingData = questionDoc.data() || {};

    // Prepare the update data
    const now = new Date().toISOString();
    const phase = questionData.phase || questionData.tags[0] || "Discover";

    const updatedQuestion = {
      question: questionData.question,
      answer: questionData.answer,
      tags: questionData.tags,
      phase: phase,
      last_modified: now,
    };

    // Update in Firestore
    await questionsRef.doc(questionId).update(updatedQuestion);

    // Revalidate the UI
    Promise.resolve().then(() => {
      revalidatePath("/answer_questions");
      revalidatePath("/product");
      revalidatePath("/qa");
    });

    return {
      success: true,
      id: questionId,
      question: {
        id: questionId,
        ...updatedQuestion,
        createdAt: existingData.createdAt,
        order: existingData.order || Date.now(),
      },
    };
  } catch (error) {
    console.error(`Error updating question ${questionId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update this function to award XP when answering a question
 */
export async function answerProductQuestionAction(
  productId: string,
  questionId: string,
  answer: string
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

    // Get the question document to check if it exists
    const questionDoc = await questionsRef.doc(questionId).get();

    if (!questionDoc.exists) {
      return {
        success: false,
        error: `Question with ID ${questionId} not found`,
      };
    }

    // Check if the answer is actually new before awarding XP
    const existingAnswer = questionDoc.data()?.answer;
    const isNewAnswer = !existingAnswer;

    // Update the answer in Firestore
    const now = new Date().toISOString();
    await questionsRef.doc(questionId).update({
      answer: answer,
      last_modified: now,
    });

    // Award XP only for answering a question for the first time
    if (isNewAnswer) {
      try {
        await awardXpPoints("answer_question", userId);
        console.log(
          `Awarded XP to user ${userId} for answering question ${questionId}`
        );
      } catch (xpError) {
        console.error(`Failed to award XP for answering question:`, xpError);
        // Continue even if XP awarding fails
      }
    }

    // Revalidate relevant paths
    Promise.resolve().then(() => {
      revalidatePath("/answer_questions");
      revalidatePath("/product");
    });

    return {
      success: true,
      questionId,
      answer,
      lastModified: now,
    };
  } catch (error) {
    console.error("Error answering question:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
