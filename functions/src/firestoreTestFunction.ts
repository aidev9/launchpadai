import * as functions from "firebase-functions/v2";
import { logger } from "firebase-functions";

/**
 * Sample Firestore trigger function
 * This function gets triggered whenever a document is created in the 'testCollection' collection
 */
export const firestoreTestFunction = functions.firestore.onDocumentCreated(
  {
    document: "testCollection/{docId}",
    region: "us-east1",
    maxInstances: 10,
    memory: "256MiB", // Minimum memory allocation
  },
  async (event) => {
    // Get the data from the event
    const docData = event.data?.data();
    const docId = event.params.docId;

    // Log the event for testing purposes
    logger.info("Firestore document created", {
      documentId: docId,
      timestamp: new Date().toISOString(),
      data: docData,
    });

    // Here you could add more processing logic if needed
    console.log(`New document created in testCollection with ID: ${docId}`);

    return null;
  }
);
