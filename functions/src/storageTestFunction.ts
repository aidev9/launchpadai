import * as functions from "firebase-functions/v2";
import { onObjectFinalized } from "firebase-functions/v2/storage";

/**
 * Cloud Storage trigger function
 * This function gets triggered when a file is uploaded to the 'test-uploads' bucket
 */
export const storageTestFunction = onObjectFinalized(
  {
    bucket: "launchpadai-prod.firebasestorage.app", // Replace with your actual bucket name if different
    region: "us-east1",
    memory: "256MiB", // Adding explicit memory configuration
    timeoutSeconds: 60, // Adding explicit timeout
  },
  async (event) => {
    console.log("Storage event triggered:", event.data.name);
    console.log("Document processed successfully", event);
    return null;
  }
);
