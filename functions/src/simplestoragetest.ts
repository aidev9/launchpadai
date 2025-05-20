import { onObjectFinalized } from "firebase-functions/v2/storage";

// Simple storage test function with minimal configuration
export const simpleStorageTest = onObjectFinalized(
  {
    region: "us-east1", // Match bucket region
    bucket: "launchpadai-prod.firebasestorage.app", // Explicitly specify the bucket
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (event) => {
    console.log("Simple storage test triggered");
    console.log("File:", event.data.name);
    console.log("Bucket:", event.data.bucket);
    return null;
  }
);
