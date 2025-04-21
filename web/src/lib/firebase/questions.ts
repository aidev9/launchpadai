"use server";

import { adminAuth, adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const questionsRef = adminDb.collection("questions");

// Schema for question creation/update
const questionInputSchema = z.object({
  user_id: z.string(),
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
 * Fetch all questions
 */
export async function getAllQuestions() {
  try {
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
