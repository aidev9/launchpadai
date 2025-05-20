// import * as functions from "firebase-functions/v2";
// import { ScheduledEvent } from "firebase-functions/v2/scheduler";
import { firestore } from "../common/firebase.js";
import { onSchedule } from "firebase-functions/v2/scheduler";
// import { logger } from "firebase-functions";

// Maximum concurrent account deletions.
const MAX_CONCURRENT = 3;

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
    console.log(
      `Refill operation completed. Updated documents: ${updateCount}`
    );
    return updateCount;
  } catch (error) {
    console.error("Error refilling prompt credits:", error);
    return null;
  }
}

// Wrapper function to match the expected signature
// async function scheduledRefillHandler(_event: ScheduledEvent): Promise<void> {
// await refillPromptCreditsHandler();
// The return value of refillPromptCreditsHandler is ignored here
// to match the expected void | Promise<void> return type.
// }

/**
 * This Cloud Function runs every night at 12:00 AM to check users' prompt
 * credit balances and refill them to their daily limit if they are below it.
 */
// export const refillPromptCredits = functions.scheduler.onSchedule(
//   {
//     schedule: "0 0 * * *", // Runs at midnight every day (CRON format)
//     timeZone: "America/New_York", // Adjust to your preferred timezone
//     // timeoutSeconds: 540,
//     // minInstances: 0,
//     region: "us-east1",
//   },
//   scheduledRefillHandler // Use the wrapper function
// );

export const refillPromptCredits = onSchedule(
  "every day 00:00",
  async (event) => {
    await refillPromptCreditsHandler();
  }
);
