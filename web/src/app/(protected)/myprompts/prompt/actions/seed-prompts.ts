"use server";

import { adminDb } from "@/lib/firebase/admin";
import { seedPrompts as promptsData } from "@/lib/seed-data/prompts";
import { getCurrentUnixTimestamp } from "@/utils/constants";

/**
 * Seed the Firestore database with prompts from the seed file
 * Uses batch processing to efficiently insert in groups of 20
 */
export async function seedPrompts() {
  try {
    const promptsCollection = adminDb.collection("prompts");
    let successCount = 0;
    const errorCount = 0;

    // Process prompts in batches of 20 for efficiency
    const batchSize = 20;
    const batchCount = Math.ceil(promptsData.length / batchSize);

    for (let i = 0; i < batchCount; i++) {
      const batch = adminDb.batch();

      // Get the current slice of prompts to process
      const start = i * batchSize;
      const end = Math.min(start + batchSize, promptsData.length);
      const currentBatch = promptsData.slice(start, end);

      // Add each prompt to the batch
      for (const prompt of currentBatch) {
        const docRef = promptsCollection.doc(); // Auto-generate ID
        batch.set(docRef, {
          ...prompt,
          createdAt: getCurrentUnixTimestamp(),
          updatedAt: getCurrentUnixTimestamp(),
        });
      }

      // Commit the current batch
      await batch.commit();
      successCount += currentBatch.length;
    }

    return {
      success: true,
      message: `Successfully seeded ${successCount} prompts in ${batchCount} batches`,
    };
  } catch (error) {
    console.error("Error seeding prompts:", error);
    return {
      success: false,
      error: `Failed to seed prompts: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
