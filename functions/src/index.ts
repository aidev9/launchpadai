import * as functions from "firebase-functions/v2";
import { refillPromptCreditsHandler } from "./scheduled/refillPromptCredits";

// Export the scheduled function
export { refillPromptCredits } from "./scheduled/refillPromptCredits";

// HTTP endpoint for testing the prompt credits refill
export const testRefillPromptCredits = functions.https.onRequest(
  {
    // Set appropriate region and timeout for the function
    region: "us-central1",
    timeoutSeconds: 60,
    minInstances: 0,
  },
  async (req, res) => {
    try {
      console.log("Manual trigger of refillPromptCredits via HTTP endpoint");

      // Call the handler function directly
      const result = await refillPromptCreditsHandler();

      // Send the response
      res.status(200).json({
        success: true,
        message: "Prompt credits refill function executed successfully",
        updatedCount: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error executing refill function:", error);
      res.status(500).json({
        success: false,
        message: "Error executing refill function",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }
);
