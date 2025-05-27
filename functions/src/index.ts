// import { onDocumentCreated } from "firebase-functions/v2/firestore";
// import { onObjectFinalized } from "firebase-functions/v2/storage";
// import { onRequest } from "firebase-functions/v2/https";
// import { logger } from "firebase-functions/v2";
// import { refillPromptCreditsHandler } from "./scheduled/refillPromptCredits.js";
import { refillPromptCredits } from "./scheduled/refillPromptCredits.js";
// import { simpleStorageTest } from "./simplestoragetest.js";
import { processDocumentEmbeddings } from "./storage/createEmbeddings.js";

// Export scheduled and storage functions

export { refillPromptCredits };

// export { simpleStorageTest }; // Export the simple storage test
// Export storage functions

export { processDocumentEmbeddings };

// Import and export the new A2A endpoint
import { a2aEndpoint } from "./a2a.js";
export { a2aEndpoint };

// --- FIRESTORE TEST FUNCTION ---
// export const firestoreTestFunction = onDocumentCreated(
//   {
//     document: "testCollection/{docId}",
//     region: "us-east1",
//     maxInstances: 10,
//     memory: "256MiB",
//   },
//   async (event) => {
//     const docData = event.data?.data();
//     const docId = event.params.docId;
//     logger.info("Firestore document created", {
//       documentId: docId,
//       timestamp: new Date().toISOString(),
//       data: docData,
//     });
//     console.log(`New document created in testCollection with ID: ${docId}`);
//     return null;
//   }
// );

// --- STORAGE TEST FUNCTION ---
// export const storageTestFunction = onObjectFinalized(
//   {
//     bucket: "launchpadai-prod.firebasestorage.app",
//     region: "us-east1", // Must match the bucket's location
//     memory: "256MiB",
//     timeoutSeconds: 60,
//     retry: false, // Don't retry on failure
//     cpu: 1, // Specify CPU allocation
//     minInstances: 0, // No minimum instances
//     maxInstances: 5, // Maximum 5 instances
//   },
//   async (event) => {
//     console.log("Storage event triggered:", event.data.name);
//     console.log("Document processed successfully", event);
//     return null;
//   }
// );

// HTTP endpoint for testing the prompt credits refill
// export const testRefillPromptCredits = onRequest(
//   {
//     region: "us-east1",
//     timeoutSeconds: 60,
//     minInstances: 0,
//   },
//   async (request, response) => {
//     try {
//       console.log("Manual trigger of refillPromptCredits via HTTP endpoint");
//       const result = await refillPromptCreditsHandler();
//       response.status(200).json({
//         success: true,
//         message: "Prompt credits refill function executed successfully",
//         updatedCount: result,
//         timestamp: new Date().toISOString(),
//       });
//     } catch (error) {
//       console.error("Error executing refill function:", error);
//       response.status(500).json({
//         success: false,
//         message: "Failed to execute refill function",
//         error: error instanceof Error ? error.message : String(error),
//         timestamp: new Date().toISOString(),
//       });
//     }
//   }
// );

// All other functions are exported at the top of the file
