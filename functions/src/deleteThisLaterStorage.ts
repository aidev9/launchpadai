import * as functions from "firebase-functions/v2";
import { StorageEvent } from "firebase-functions/v2/storage";

/**
 * Simple test function triggered when an object is finalized in Storage
 * This function only logs the event for testing deployments
 */
export const deleteThisLaterStorage = functions.storage.onObjectFinalized(
  {
    memory: "256MiB", // Using minimal memory as it's just for logging
    timeoutSeconds: 60,
    minInstances: 0,
    region: "us-east1",
    maxInstances: 1,
  },
  async (event: StorageEvent) => {
    console.log("Storage finalize event triggered!");
    console.log(`File: ${event.data.name}`);
    console.log(`Bucket: ${event.data.bucket}`);
    console.log(`Content Type: ${event.data.contentType}`);
    console.log(`Size: ${event.data.size} bytes`);
    console.log(`Created: ${event.data.timeCreated}`);

    return null; // No need to return anything for this test function
  }
);
