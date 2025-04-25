"use server";

import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { productQuestionInputSchema, ProductQuestionInput } from "./schema";

// Root questions collection reference
const questionsCollection = adminDb.collection("questions");

// Get the questionsRef for a specific user
function getUserQuestionsRef(userId: string) {
  return questionsCollection.doc(userId).collection("questions");
}

// Get the product questions ref for a specific user and product
export async function getProductQuestionsRef(
  userId: string,
  productId: string
) {
  return questionsCollection
    .doc(userId)
    .collection("products")
    .doc(productId)
    .collection("questions");
}

// Schema for question creation/update
const questionInputSchema = z.object({
  project_id: z.string(),
  question: z.string().min(1, "Question is required"),
  answer: z.string().optional(),
  tags: z.array(z.string()),
});

type QuestionInput = z.infer<typeof questionInputSchema>;

/**
 * Create a new question
 */
export async function createQuestion(data: QuestionInput) {
  try {
    // Validate input data
    const validatedData = questionInputSchema.parse(data);
    const userId = await getCurrentUserId();
    const questionsRef = getUserQuestionsRef(userId);

    // Add timestamps
    const now = new Date().toISOString();
    const questionData = {
      ...validatedData,
      createdAt: now,
      last_modified: now,
    };

    // Add to Firestore
    const docRef = await questionsRef.add(questionData);

    // Revalidate the questions page
    revalidatePath("/questions");

    return {
      success: true,
      id: docRef.id,
      data: questionData,
    };
  } catch (error) {
    console.error("Failed to create question:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update an existing question
 */
export async function updateQuestion(id: string, data: Partial<QuestionInput>) {
  try {
    const userId = await getCurrentUserId();
    const questionsRef = getUserQuestionsRef(userId);

    // Check if question exists
    const questionDoc = await questionsRef.doc(id).get();
    if (!questionDoc.exists) {
      return {
        success: false,
        error: "Question not found",
      };
    }

    // Update with new data and last_modified timestamp
    const updateData = {
      ...data,
      last_modified: new Date().toISOString(),
    };

    await questionsRef.doc(id).update(updateData);

    // Revalidate the questions page
    revalidatePath("/questions");

    return {
      success: true,
      id,
      data: updateData,
    };
  } catch (error) {
    console.error(`Failed to update question ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a question
 */
export async function deleteQuestion(id: string) {
  try {
    const userId = await getCurrentUserId();
    const questionsRef = getUserQuestionsRef(userId);

    // Check if question exists
    const questionDoc = await questionsRef.doc(id).get();
    if (!questionDoc.exists) {
      return {
        success: false,
        error: "Question not found",
      };
    }

    // Delete the question
    await questionsRef.doc(id).delete();

    // Revalidate the questions page
    revalidatePath("/questions");

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error(`Failed to delete question ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Fetch all questions for the current user
 */
export async function getAllQuestions() {
  try {
    const userId = await getCurrentUserId();
    const questionsRef = getUserQuestionsRef(userId);

    const snapshot = await questionsRef.orderBy("last_modified", "desc").get();

    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      questions,
    };
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Fetch questions by project
 */
export async function getQuestionsByProject(projectId: string) {
  try {
    const userId = await getCurrentUserId();
    const questionsRef = getUserQuestionsRef(userId);

    const snapshot = await questionsRef
      .where("project_id", "==", projectId)
      .orderBy("last_modified", "desc")
      .get();

    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      questions,
    };
  } catch (error) {
    console.error(`Failed to fetch questions for project ${projectId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a single question by ID
 */
export async function getQuestion(id: string) {
  try {
    const userId = await getCurrentUserId();
    const questionsRef = getUserQuestionsRef(userId);

    const questionDoc = await questionsRef.doc(id).get();

    if (!questionDoc.exists) {
      return {
        success: false,
        error: "Question not found",
      };
    }

    return {
      success: true,
      question: {
        id: questionDoc.id,
        ...questionDoc.data(),
      },
    };
  } catch (error) {
    console.error(`Failed to fetch question ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Get all questions (admin function)
export async function getAllQuestionsAdmin() {
  try {
    const questionsSnapshot = await adminDb.collection("questions").get();

    if (questionsSnapshot.empty) {
      return { success: true, questions: [] };
    }

    const questions = questionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, questions };
  } catch (error) {
    console.error("Error getting questions:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Save/update answer to a product question
 */
export async function saveProductQuestionAnswer(
  productId: string,
  questionId: string,
  answer: string
) {
  try {
    if (!productId || !questionId) {
      console.error("Missing required parameters:", { productId, questionId });
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

    console.log(
      `Saving answer for question ${questionId} in product ${productId}`
    );

    const questionsRef = await getProductQuestionsRef(userId, productId);
    const questionRef = questionsRef.doc(questionId);

    // Check if the question exists
    const questionDoc = await questionRef.get();
    if (!questionDoc.exists) {
      console.error(`Question ${questionId} not found in product ${productId}`);
      return {
        success: false,
        error: "Question not found",
      };
    }

    console.log(
      `Question found, updating with answer: "${answer.substring(0, 20)}${answer.length > 20 ? "..." : ""}"`
    );

    // Update the answer and last_modified timestamp
    const now = new Date().toISOString();
    await questionRef.update({
      answer,
      last_modified: now,
    });

    console.log(`Successfully saved answer for question ${questionId}`);

    revalidatePath("/answer_questions");
    revalidatePath("/product");

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
 * Save a question answer - Legacy method, use saveProductQuestionAnswer instead
 */
export async function saveQuestionAnswer(
  productId: string,
  questionId: string,
  answer: string
) {
  try {
    console.warn(
      "saveQuestionAnswer is deprecated, use saveProductQuestionAnswer instead"
    );
    // Redirect to the new function
    return await saveProductQuestionAnswer(productId, questionId, answer);
  } catch (error) {
    console.error("Error saving question answer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Add a new question to a product
 */
export async function addProductQuestion(
  productId: string,
  data: ProductQuestionInput
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Validate input data
    const validatedData = productQuestionInputSchema.parse(data);
    const questionsRef = await getProductQuestionsRef(userId, productId);

    // Generate a unique ID for custom questions
    const questionId = `custom_${Date.now()}`;

    // Add timestamps
    const now = new Date().toISOString();
    const questionData = {
      ...validatedData,
      createdAt: now,
      last_modified: now,
    };

    // Add to Firestore
    await questionsRef.doc(questionId).set(questionData);

    revalidatePath("/answer_questions");

    return {
      success: true,
      id: questionId,
      data: questionData,
    };
  } catch (error) {
    console.error(`Failed to add question to product ${productId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a product question
 */
export async function deleteProductQuestion(
  productId: string,
  questionId: string
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const questionsRef = await getProductQuestionsRef(userId, productId);
    const questionRef = questionsRef.doc(questionId);

    // Check if question exists
    const questionDoc = await questionRef.get();
    if (!questionDoc.exists) {
      return {
        success: false,
        error: "Question not found",
      };
    }

    // Delete the question
    await questionRef.delete();

    revalidatePath("/answer_questions");

    return {
      success: true,
      id: questionId,
    };
  } catch (error) {
    console.error(`Failed to delete question ${questionId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Delete a question - Admin function
export async function deleteQuestionAdmin(questionId: string) {
  try {
    const userId = await getCurrentUserId();
    const questionsRef = getUserQuestionsRef(userId);

    // Check if question exists
    const questionDoc = await questionsRef.doc(questionId).get();
    if (!questionDoc.exists) {
      return {
        success: false,
        error: "Question not found",
      };
    }

    // Delete the question
    await questionsRef.doc(questionId).delete();

    // Revalidate the questions page
    revalidatePath("/questions");

    return {
      success: true,
      id: questionId,
    };
  } catch (error) {
    console.error(`Failed to delete question ${questionId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
