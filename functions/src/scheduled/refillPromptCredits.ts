import * as functions from "firebase-functions/v2";
import {ScheduledEvent} from "firebase-functions/v2/scheduler";
import {firestore} from "../lib/firebase";

/**
 * Handles the logic for refilling prompt credits
 * @return {Promise<number | null>} The number of updated documents or null on error
 */
export async function refillPromptCreditsHandler(): Promise<number | null> {
  try {
    // Get reference to the prompt_credits collection
    const promptCreditsRef = firestore.collection("prompt_credits");

    // Get current Unix timestamp
    const getCurrentUnixTimestamp = (): number => {
      return Math.floor(Date.now() / 1000);
    };

    const now = getCurrentUnixTimestamp();
    const batch = firestore.batch();
    let updateCount = 0;

    // Get all documents in the prompt_credits collection
    const promptCreditsSnapshot = await promptCreditsRef.get();

    // Iterate through each document
    for (const doc of promptCreditsSnapshot.docs) {
      const data = doc.data();
      const remainingCredits = data.remainingCredits;
      const dailyCredits = data.dailyCredits || 10; // Default to 10 if not set

      // Check if credits need to be refilled (less than the daily credit amount)
      if (remainingCredits !== undefined && remainingCredits < dailyCredits) {
        // Update the document
        batch.update(doc.ref, {
          remainingCredits: dailyCredits,
          lastRefillDate: now,
          updatedAt: now,
        });

        updateCount++;
      }
    }

    // If no updates were made, return 0
    if (updateCount === 0) {
      return 0;
    }

    // Commit the batch write
    await batch.commit();
    return updateCount;
  } catch (error) {
    console.error("Error refilling prompt credits:", error);
    return null;
  }
}

/**
 * This Cloud Function runs every night at 12:00 AM to check users' prompt
 * credit balances and refill them to their daily limit if they are below it.
 */
export const refillPromptCredits = functions.scheduler.onSchedule(
  {
    schedule: "0 0 * * *", // Runs at midnight every day (CRON format)
    timeZone: "America/New_York", // Adjust to your preferred timezone
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_event: ScheduledEvent) => {
    const result = await refillPromptCreditsHandler();
    console.log(`Refill operation completed with result: ${result}`);
  }
);
