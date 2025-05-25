/**
 * Test script for TXT document processing with spaces in filename
 *
 * This script uploads a test TXT document with spaces in the filename
 * to verify that the processDocumentUpload function handles it correctly.
 *
 * Before running this script:
 * 1. Start Firebase emulators:
 *    firebase emulators:start
 *
 * 2. Set environment variables for OpenAI API key and NeonDB connection:
 *    firebase functions:config:set openai.api_key=your_api_key neondb.connection_string=your_connection_string
 */

import admin from "firebase-admin";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set the environment variable to use emulator
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "localhost:9200";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9100";
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8081"; // Or your configured port
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = "localhost:5001"; // Add Functions emulator host

// Check for OpenAI API key in environment
if (!process.env.OPENAI_API_KEY) {
  console.log("INFO: No OPENAI_API_KEY found in process.env");
  console.log("The function will attempt to use firebase config values.");
  console.log("Make sure you have set the API key using:");
  console.log("firebase functions:config:set openai.api_key=your_api_key");
}

process.env.NODE_ENV = "test"; // Ensure we're in test mode

// Explicitly set project ID for consistency
process.env.GCLOUD_PROJECT = "launchpadai-prod";

// Initialize Firebase Admin with emulator settings
const app = admin.initializeApp({
  projectId: "launchpadai-prod",
  storageBucket: "launchpadai-prod.firebasestorage.app",
});

// Function to create a sample TXT document
async function createSampleTXT() {
  try {
    // Create a text file with spaces in the name
    const tempFilePath = join(
      __dirname,
      "Sample Text Document with Spaces.txt"
    );

    // Create sample content
    const sampleText = `Sample Text Document for Testing Filenames with Spaces

Introduction
============
This is a sample text document for testing the document processing function with filenames containing spaces.

Features Being Tested
====================
- Automatic embedding generation
- Document chunking
- Keyword extraction
- Filename with spaces handling

Technical Details
================
The system uses OpenAI's text-embedding-3-small to generate embeddings.
Each document is broken down into chunks for improved retrieval.
Filenames with spaces should be properly handled by the system.

Architecture
===========
1. Document uploaded to Storage
2. Function is triggered
3. Text is extracted and chunked
4. Embeddings are generated for each chunk
5. Chunks and metadata are stored in NeonDB

Conclusion
==========
This test text document should trigger the processing function and validate our implementation with space-containing filenames.

Date created: ${new Date().toISOString()}
Unique ID: ${Math.random().toString(36).substring(2, 15)}
Random string: ${Math.random().toString(36).substring(2, 15)}
`;

    // Write the file
    await fs.writeFile(tempFilePath, sampleText, "utf8");
    console.log("Created sample TXT file with spaces in name:", tempFilePath);
    return tempFilePath;
  } catch (error) {
    console.error("Error creating TXT file:", error);
    throw error;
  }
}

// Test function
async function testTXTUpload() {
  try {
    // Create sample text file with spaces in the name
    const tempFilePath = await createSampleTXT();
    console.log(`TXT test file created at: ${tempFilePath}`);

    // Log file size for debugging
    const fileStats = await fs.stat(tempFilePath);
    console.log(`TXT file size: ${fileStats.size} bytes`);

    // Generate test user and collection IDs
    const userId = "test-user-123";
    const productId = `test-product-${Math.random(100).toString()}`;
    const collectionId = "test-collection-123";
    const documentId = "test-document-9003";

    // Create the path that matches what the function expects
    // Use a filename with spaces to test space handling
    const originalFilename = "Research Notes and Analysis.txt";
    const storagePath = `storage/${userId}/collections/${collectionId}/documents/${documentId}/${originalFilename}`;

    console.log("Setting up Firestore documents before upload...");

    // Initialize Firestore references for the document
    const db = admin.firestore();

    const docRef = db
      .collection("mydocuments")
      .doc(userId)
      .collection("mydocuments")
      .doc(documentId);

    // Initialize Firestore references for the collection
    const collectionRef = db
      .collection("mycollections")
      .doc(userId)
      .collection("mycollections")
      .doc(collectionId);

    // Create initial document to track BEFORE uploading file
    // Add custom chunkSize and overlap parameters to test the document chunking functionality
    // These values will be used by the embeddings function instead of the default values (1000, 200)
    await docRef.set({
      title: "Test TXT Document with Spaces",
      description:
        "A test text document with spaces in the filename for embedding generation",
      keywords: ["test", "txt", "document", "embeddings", "spaces", "filename"],
      status: "pending",
      userId: userId,
      productId: productId,
      chunkSize: 500,
      overlap: 100,
    });

    // Also create collection doc
    await collectionRef.set({
      title: "Test Collection",
      description:
        "A test collection for TXT document uploads with spaces in filename",
      keywords: ["test", "collection", "txt", "spaces"],
      status: "pending",
      productId: productId,
    });

    console.log(
      "Created initial Firestore collection and document for tracking"
    );

    // Now that Firestore is set up, upload the file to trigger the function
    console.log("Uploading test TXT document to:", storagePath);

    // Get storage bucket
    const bucket = admin.storage().bucket();

    // Upload the file
    await bucket.upload(tempFilePath, {
      destination: storagePath,
      metadata: {
        contentType: "text/plain",
      },
    });

    console.log("Upload complete. Function should be triggered.");
    console.log("Checking Firestore for document status updates...");

    // Now check Firestore to see if the document status was updated
    let attempts = 0;
    const maxAttempts = 15; // Increase max attempts
    const checkInterval = 15000; // Increase to 15 seconds

    const checkStatus = async () => {
      attempts++;
      try {
        console.log(`Attempt ${attempts}: Checking document status...`);
        const doc = await docRef.get();
        const collection = await collectionRef.get();

        if (!doc.exists) {
          console.log(`Attempt ${attempts}/${maxAttempts}: Document not found`);
        } else {
          const data = doc.data();
          console.log(
            `Attempt ${attempts}/${maxAttempts}: Document status is "${data.status}"`
          );
          console.log(`Full document data:`, JSON.stringify(data, null, 2));

          if (
            data.status === "indexed" &&
            collection.data().status === "indexed"
          ) {
            console.log(
              "SUCCESS: TXT document with spaces in filename and collection processed successfully!"
            );
            console.log("Document data:", data);
            console.log("Collection data:", collection.data());
            // Clean up
            await fs.unlink(tempFilePath);
            console.log("Test completed and cleaned up. Exiting.");
            process.exit(0);
          } else if (data.status === "error") {
            console.error(
              "ERROR: TXT document with spaces in filename processing failed"
            );
            process.exit(1);
          }
        }

        if (attempts >= maxAttempts) {
          console.error(
            "Failed to detect function execution after maximum attempts"
          );
          console.log("Check the Firebase emulator logs for errors");
          process.exit(1);
        } else {
          setTimeout(checkStatus, checkInterval);
        }
      } catch (error) {
        console.error(
          `Error in checkStatus (attempt ${attempts}/${maxAttempts}):`,
          error
        );
        if (attempts >= maxAttempts) {
          process.exit(1);
        } else {
          setTimeout(checkStatus, checkInterval);
        }
      }
    };

    // Start checking
    setTimeout(checkStatus, checkInterval);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testTXTUpload().catch(console.error);
