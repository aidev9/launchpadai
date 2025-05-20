/**
 * Test script for DOCX document processing with spaces in filename
 *
 * This script uploads a test DOCX document with spaces in the filename
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
import { Document, Packer, Paragraph, TextRun } from "docx";

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

// Function to create a sample DOCX document using docx library
async function createSampleDOCX() {
  try {
    // Create a new document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Sample DOCX Document with Spaces in Filename",
                  bold: true,
                  size: 36, // equivalent to font size 18
                }),
              ],
              spacing: { after: 200 }, // Add some space after the header
            }),

            // Introduction
            new Paragraph({
              children: [
                new TextRun({
                  text: "Introduction",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun(
                  "This is a sample DOCX document for testing the document processing function with filenames containing spaces."
                ),
              ],
              spacing: { after: 400 },
            }),

            // Features
            new Paragraph({
              children: [
                new TextRun({
                  text: "Features Being Tested",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun("- Automatic embedding generation")],
            }),
            new Paragraph({
              children: [new TextRun("- Document chunking")],
            }),
            new Paragraph({
              children: [new TextRun("- Keyword extraction")],
            }),
            new Paragraph({
              children: [new TextRun("- Filename with spaces handling")],
              spacing: { after: 400 },
            }),

            // Technical Details
            new Paragraph({
              children: [
                new TextRun({
                  text: "Technical Details",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun(
                  "The system uses OpenAI's text-embedding-3-small to generate embeddings."
                ),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(
                  "Each document is broken down into chunks for improved retrieval."
                ),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(
                  "Filenames with spaces should be properly handled by the system."
                ),
              ],
              spacing: { after: 400 },
            }),

            // Architecture
            new Paragraph({
              children: [
                new TextRun({
                  text: "Architecture",
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun("1. Document uploaded to Storage")],
            }),
            new Paragraph({
              children: [new TextRun("2. Function is triggered")],
            }),
            new Paragraph({
              children: [new TextRun("3. Text is extracted and chunked")],
            }),
            new Paragraph({
              children: [
                new TextRun("4. Embeddings are generated for each chunk"),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun("5. Chunks and metadata are stored in NeonDB"),
              ],
              spacing: { after: 400 },
            }),

            // Conclusion
            new Paragraph({
              children: [
                new TextRun({
                  text: "Conclusion",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun(
                  "This test DOCX document should trigger the processing function and validate our implementation with space-containing filenames."
                ),
              ],
              spacing: { after: 400 },
            }),

            // Metadata
            new Paragraph({
              children: [
                new TextRun({
                  text: `Date created: ${new Date().toISOString()}`,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Unique ID: ${Math.random()
                    .toString(36)
                    .substring(2, 15)}`,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Random string: ${Math.random()
                    .toString(36)
                    .substring(2, 15)}`,
                  size: 20,
                }),
              ],
              spacing: { after: 400 },
            }),

            // Sample text for extraction testing
            new Paragraph({
              children: [
                new TextRun({
                  text: "SAMPLE TEXT PAGE FOR EXTRACTION",
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun(
                  "This page contains only plain text to ensure that Word document text extraction works properly with filenames containing spaces."
                ),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun(
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus at mauris vel nisi feugiat fermentum. Donec eleifend, nisl vel dignissim ultrices, massa neque convallis massa, eget laoreet justo justo id diam. Fusce auctor, ligula non scelerisque aliquam, enim nibh fermentum nisl, ut pellentesque lacus felis sit amet felis. Donec commodo auctor vehicula. Sed a lorem in lectus suscipit bibendum."
                ),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Key points for testing:",
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun("1. Text extraction")],
            }),
            new Paragraph({
              children: [new TextRun("2. Embedding generation")],
            }),
            new Paragraph({
              children: [new TextRun("3. Document processing")],
            }),
            new Paragraph({
              children: [new TextRun("4. Keyword extraction")],
            }),
            new Paragraph({
              children: [new TextRun("5. Storage and indexing")],
            }),
            new Paragraph({
              children: [new TextRun("6. Filename with spaces handling")],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun(
                  "This text should be easily extractable by the document parser, and the filename with spaces should be properly handled."
                ),
              ],
            }),
          ],
        },
      ],
    });

    // Generate the document buffer
    const buffer = await Packer.toBuffer(doc);

    // Write the document to the file system with spaces in the filename
    const tempFilePath = join(
      __dirname,
      "Sample Word Document with Spaces.docx"
    );
    await fs.writeFile(tempFilePath, buffer);

    console.log("Created sample DOCX file with spaces in name:", tempFilePath);
    return tempFilePath;
  } catch (error) {
    console.error("Error creating DOCX file:", error);
    throw error;
  }
}

// Test function
async function testDOCXUpload() {
  try {
    // Create sample DOCX file with spaces in the name
    const tempFilePath = await createSampleDOCX();
    console.log(`DOCX test file created at: ${tempFilePath}`);

    // Log file size for debugging
    const fileStats = await fs.stat(tempFilePath);
    console.log(`DOCX file size: ${fileStats.size} bytes`);

    // Generate test user and collection IDs
    const userId = "test-user-123";
    const productId = `test-product-${Math.random(100).toString()}`;
    const collectionId = "test-collection-123";
    const documentId = "test-document-9004";

    // Create the path that matches what the function expects
    // Use a filename with spaces to test space handling
    const originalFilename = "Project Report and Analysis.docx";
    const storagePath = `storage/${userId}/collections/${collectionId}/documents/${documentId}/${originalFilename}`;

    console.log("Setting up Firestore documents before upload...");

    // Initialize Firestore references for the document
    const db = admin.firestore();

    const docRef = db
      .collection("documents")
      .doc(userId)
      .collection("documents")
      .doc(documentId);

    // Initialize Firestore references for the collection
    const collectionRef = db
      .collection("collections")
      .doc(userId)
      .collection("collections")
      .doc(collectionId);

    // Create initial document to track BEFORE uploading file
    // Add custom chunkSize and overlap parameters to test the document chunking functionality
    // These values will be used by the embeddings function instead of the default values (1000, 200)
    await docRef.set({
      title: "Test DOCX Document with Spaces",
      description:
        "A test Word document with spaces in the filename for embedding generation",
      keywords: [
        "test",
        "docx",
        "word",
        "document",
        "embeddings",
        "spaces",
        "filename",
      ],
      status: "pending",
      userId: userId,
      productId: productId,
      chunkSize: 750,
      overlap: 180,
    });

    // Also create collection doc
    await collectionRef.set({
      title: "Test Collection",
      description:
        "A test collection for DOCX document uploads with spaces in filename",
      keywords: ["test", "collection", "docx", "spaces"],
      status: "pending",
      productId: productId,
    });

    console.log(
      "Created initial Firestore collection and document for tracking"
    );

    // Now that Firestore is set up, upload the file to trigger the function
    console.log("Uploading test DOCX document to:", storagePath);

    // Get storage bucket
    const bucket = admin.storage().bucket();

    // Upload the file
    await bucket.upload(tempFilePath, {
      destination: storagePath,
      metadata: {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
              "SUCCESS: DOCX document with spaces in filename and collection processed successfully!"
            );
            console.log("Document data:", data);
            console.log("Collection data:", collection.data());
            // Clean up
            await fs.unlink(tempFilePath);
            console.log("Test completed and cleaned up. Exiting.");
            process.exit(0);
          } else if (data.status === "error") {
            console.error(
              "ERROR: DOCX document with spaces in filename processing failed"
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
testDOCXUpload().catch(console.error);
