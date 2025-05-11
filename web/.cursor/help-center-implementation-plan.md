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
    const timestamp = getCurrentUnixTimestamp();

    const feedbackData = {
      ...validatedData,
      id: feedbackId,
      userId,
      userEmail,
      status: "new",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

} catch (error) {
console.error("Error creating feedback:", error);
throw error;
}
}
