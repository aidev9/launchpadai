import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";
import { productQuestionInputSchema, ProductQuestionInput } from "./schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Get the questionsRef for a specific user
export function getUserQuestionsRef(userId: string) {
  return adminDb.collection("questions").doc(userId).collection("questions");
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
    const questionData = {
      ...validatedData,
      createdAt: getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
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

    const updateData = {
      ...data,
      updatedAt: getCurrentUnixTimestamp(),
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

    const snapshot = await questionsRef.orderBy("updatedAt", "desc").get();

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
      .orderBy("updatedAt", "desc")
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
 * Save an answer to a product question
 */
export async function saveProductQuestionAnswer(
  productId: string,
  questionId: string,
  answer: string
) {
  try {
    const userId = await getCurrentUserId();

    // Get the reference to the questions collection (using the correct path)
    const questionsRef = getUserQuestionsRef(userId);
    const questionRef = questionsRef.doc(questionId);

    // Get the question to verify it belongs to the product
    const questionDoc = await questionRef.get();

    if (!questionDoc.exists) {
      return {
        success: false,
        error: "Question not found",
      };
    }

    // Verify the question belongs to the specified product
    const questionData = questionDoc.data();
    if (!questionData || questionData.productId !== productId) {
      return {
        success: false,
        error: "Question does not belong to the specified product",
      };
    }

    await questionRef.update({
      answer,
      updatedAt: getCurrentUnixTimestamp(),
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
 * Add a question to a product
 */
export async function addProductQuestion(
  productId: string,
  data: ProductQuestionInput
) {
  try {
    // Validate input data
    const validatedData = productQuestionInputSchema.parse(data);
    const userId = await getCurrentUserId();
    const questionsRef = getUserQuestionsRef(userId);

    // Generate a unique ID for custom questions
    const questionId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Prepare question data
    const questionData = {
      ...validatedData,
      productId, // Add productId field
      userId, // Add userId field
      createdAt: getCurrentUnixTimestamp(),
      updatedAt: getCurrentUnixTimestamp(),
    };

    // Add the question
    await questionsRef.doc(questionId).set(questionData);

    return {
      success: true,
      id: questionId,
      data: {
        id: questionId,
        ...questionData,
      },
    };
  } catch (error) {
    console.error("Failed to add product question:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a question from a product
 */
export async function deleteProductQuestion(
  productId: string,
  questionId: string
) {
  try {
    const userId = await getCurrentUserId();
    const questionsRef = getUserQuestionsRef(userId);
    const questionRef = questionsRef.doc(questionId);

    // Get the question to verify it belongs to the product
    const questionDoc = await questionRef.get();

    if (!questionDoc.exists) {
      return {
        success: false,
        error: "Question not found",
      };
    }

    // Verify the question belongs to the specified product
    const questionData = questionDoc.data();
    if (!questionData || questionData.productId !== productId) {
      return {
        success: false,
        error: "Question does not belong to the specified product",
      };
    }

    // Delete the question
    await questionRef.delete();

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
