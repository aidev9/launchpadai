"use server";

import { adminDb } from "@/lib/firebase/admin";
import { seedPrompts as promptsData } from "@/lib/seed-data/prompts";
import { getCurrentUnixTimestamp } from "@/utils/constants";

/**
 * Seed the Firestore database with prompts from the seed file
 * Updated to seed into the myprompts collection structure that admin expects
 */
export async function seedPrompts() {
  try {
    const promptsCollection = adminDb.collection("myprompts");
    let successCount = 0;

    // Create some sample users if they don't exist
    const sampleUsers = [
      {
        id: "user1",
        email: "alice@example.com",
        displayName: "Alice Johnson",
        photoURL: null,
        isAdmin: false,
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      },
      {
        id: "user2",
        email: "bob@example.com",
        displayName: "Bob Smith",
        photoURL: null,
        isAdmin: false,
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      },
      {
        id: "user3",
        email: "carol@example.com",
        displayName: "Carol Williams",
        photoURL: null,
        isAdmin: false,
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      },
    ];

    // Create sample users
    for (const user of sampleUsers) {
      const userRef = adminDb.collection("users").doc(user.id);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        await userRef.set(user);
      }
    }

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

        // Randomly assign to one of our sample users
        const randomUserId =
          sampleUsers[Math.floor(Math.random() * sampleUsers.length)].id;

        batch.set(docRef, {
          ...prompt,
          userId: randomUserId,
          content: prompt.body, // Map body to content
          title: prompt.title,
          isPublic: Math.random() > 0.3, // 70% chance of being public
          views: Math.floor(Math.random() * 100), // Random views 0-99
          likes: Math.floor(Math.random() * 20), // Random likes 0-19
          createdAt:
            getCurrentUnixTimestamp() - Math.floor(Math.random() * 86400 * 30), // Random time in last 30 days
          updatedAt: getCurrentUnixTimestamp(),
        });
      }

      // Commit the current batch
      await batch.commit();
      successCount += currentBatch.length;
    }

    return {
      success: true,
      message: `Successfully seeded ${successCount} prompts in ${batchCount} batches with sample users`,
    };
  } catch (error) {
    console.error("Error seeding prompts:", error);
    return {
      success: false,
      error: `Failed to seed prompts: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
