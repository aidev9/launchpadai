"use server";

import { adminDb } from "./admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Feedback, FeedbackInput, feedbackSchema } from "./schema";
import { Resend } from "resend";
import FeedbackNotification from "@/lib/emails/feedback-notification";

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Create a new feedback entry
 */
export async function createFeedback(
  data: FeedbackInput,
  userId: string,
  userEmail: string
) {
  try {
    // Validate input data
    const validatedData = feedbackSchema.parse(data);

    // Create a reference to the feedback collection
    const feedbackRef = adminDb.collection("feedback");

    // Generate a unique ID for the feedback
    const feedbackId = uuidv4();

    // Add timestamps
    const now = new Date().toISOString();

    const feedbackData = {
      ...validatedData,
      id: feedbackId,
      userId,
      userEmail,
      status: "new",
      createdAt: now,
      updatedAt: now,
    } as Feedback;

    // Add to Firestore
    await feedbackRef.doc(feedbackId).set(feedbackData);

    // Send email notification to admin
    await sendFeedbackNotificationEmail(feedbackData);

    return {
      success: true,
      id: feedbackId,
      data: feedbackData,
    };
  } catch (error) {
    console.error("Failed to create feedback:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all feedback entries
 */
export async function getAllFeedback() {
  try {
    const feedbackRef = adminDb.collection("feedback");
    const snapshot = await feedbackRef.orderBy("createdAt", "desc").get();

    if (snapshot.empty) {
      return {
        success: true,
        feedback: [],
      };
    }

    const feedback = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Feedback[];

    return {
      success: true,
      feedback,
    };
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get a feedback entry by ID
 */
export async function getFeedback(id: string) {
  try {
    const feedbackRef = adminDb.collection("feedback").doc(id);
    const doc = await feedbackRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: "Feedback not found",
      };
    }

    return {
      success: true,
      feedback: {
        id: doc.id,
        ...doc.data(),
      } as Feedback,
    };
  } catch (error) {
    console.error(`Failed to fetch feedback ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update a feedback entry
 */
export async function updateFeedback(id: string, data: Partial<FeedbackInput>) {
  try {
    const feedbackRef = adminDb.collection("feedback").doc(id);
    const doc = await feedbackRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: "Feedback not found",
      };
    }

    // Update timestamp
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
    };

    await feedbackRef.update(updateData);

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error(`Failed to update feedback ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Delete a feedback entry
 */
export async function deleteFeedback(id: string) {
  try {
    const feedbackRef = adminDb.collection("feedback").doc(id);
    const doc = await feedbackRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: "Feedback not found",
      };
    }

    await feedbackRef.delete();

    return {
      success: true,
      id,
      message: `Feedback ${id} deleted`,
    };
  } catch (error) {
    console.error(`Failed to delete feedback ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Respond to a feedback entry
 */
export async function respondToFeedback(id: string, response: string) {
  try {
    const feedbackRef = adminDb.collection("feedback").doc(id);
    const doc = await feedbackRef.get();

    if (!doc.exists) {
      return {
        success: false,
        error: "Feedback not found",
      };
    }

    // Update timestamp and add response
    const now = new Date().toISOString();
    const updateData = {
      response,
      responseAt: now,
      status: "resolved",
      updatedAt: now,
    };

    await feedbackRef.update(updateData);

    return {
      success: true,
      id,
    };
  } catch (error) {
    console.error(`Failed to respond to feedback ${id}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send email notification to admin about new feedback
 */
export async function sendFeedbackNotificationEmail(feedback: Feedback) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "notifications@launchpadai.io",
      to: process.env.EMAIL_ADMIN || "admin@launchpadai.io",
      subject: `New ${feedback.type} from ${feedback.name}`,
      react: FeedbackNotification({ feedback }),
    });
    console.log(
      `Admin notification email sent for new feedback: ${feedback.id}`
    );
    return true;
  } catch (emailError) {
    // Log error but don't fail the feedback submission process
    console.error("Error sending admin notification email:", emailError);
    return false;
  }
}
