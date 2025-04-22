"use server";

import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/firebase/adminAuth";

// Root questions collection reference
const questionsCollection = adminDb.collection("questions");

// Get the questionsRef for a specific user
function getUserQuestionsRef(userId: string) {
  return questionsCollection.doc(userId).collection("questions");
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

interface QuestionRecord {
  id: string;
  questionId: string;
  productId: string;
  answer: string;
  phase: string;
  createdAt: Date;
  updatedAt: Date;
}

// Get all questions for a given product
export async function getProductQuestions(productId: string) {
  try {
    const questionsSnapshot = await adminDb
      .collection("questions")
      .where("productId", "==", productId)
      .get();

    if (questionsSnapshot.empty) {
      return { success: true, questions: [] };
    }

    const questions = questionsSnapshot.docs.map((doc: any) => ({
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

// Get all questions (admin function)
export async function getAllQuestionsAdmin() {
  try {
    const questionsSnapshot = await adminDb.collection("questions").get();

    if (questionsSnapshot.empty) {
      return { success: true, questions: [] };
    }

    const questions = questionsSnapshot.docs.map((doc: any) => ({
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

// Save a question answer
export async function saveQuestionAnswer(
  productId: string,
  questionId: string,
  answer: string,
  phase: string = ""
) {
  try {
    // Check if this question has already been answered
    const existingSnapshot = await adminDb
      .collection("questions")
      .where("productId", "==", productId)
      .where("questionId", "==", questionId)
      .limit(1)
      .get();

    const now = new Date();

    if (!existingSnapshot.empty) {
      // Update existing answer
      const docId = existingSnapshot.docs[0].id;
      await adminDb.collection("questions").doc(docId).update({
        answer,
        updatedAt: now,
      });

      return { success: true, id: docId };
    } else {
      // Create new answer
      const newQuestion: Omit<QuestionRecord, "id"> = {
        questionId,
        productId,
        answer,
        phase,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await adminDb.collection("questions").add(newQuestion);
      return { success: true, id: docRef.id };
    }
  } catch (error) {
    console.error("Error saving question answer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Delete a question
export async function deleteQuestionAdmin(questionId: string) {
  try {
    await adminDb.collection("questions").doc(questionId).delete();
    return { success: true };
  } catch (error) {
    console.error("Error deleting question:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
