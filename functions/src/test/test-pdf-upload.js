/**
 * Test script for PDF document processing with spaces in filename
 *
 * This script uploads a test PDF document with spaces in the filename
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
import { createWriteStream } from "fs";
import PDFDocument from "pdfkit";

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

// Function to create a sample PDF document using PDFKit
async function createSamplePDF() {
  return new Promise((resolve, reject) => {
    try {
      // Create a filename with spaces to test space handling
      const tempFilePath = join(
        __dirname,
        "Sample Test Document with Spaces.pdf"
      );

      // Create a PDF document with PDFKit
      const doc = new PDFDocument({
        info: {
          Title: "Test Document with Spaces",
          Author: "LaunchpadAI Test",
          Subject: "PDF Testing with Spaces",
          Keywords: "test,pdf,embeddings,spaces,filename",
          CreationDate: new Date(),
        },
      });

      const stream = createWriteStream(tempFilePath);

      // Handle errors
      stream.on("error", (err) => {
        console.error("Error writing PDF:", err);
        reject(err);
      });

      // Handle completion
      stream.on("finish", () => {
        console.log(
          "Created sample PDF file with spaces in name:",
          tempFilePath
        );
        resolve(tempFilePath);
      });

      // Pipe the PDF to the file
      doc.pipe(stream);

      // ADD SIMPLE TEXT CONTENT - Plain text with minimal formatting
      // This should be easier for PDF extractors to parse
      doc
        .fontSize(16)
        .text("Sample PDF Document for Testing Filenames with Spaces", {
          align: "center",
        });

      doc
        .moveDown()
        .fontSize(12)
        .text(
          "This is a sample PDF document for testing the document processing function with filenames containing spaces."
        );

      doc.moveDown().text("Features being tested:");
      doc.text("- Automatic embedding generation");
      doc.text("- Document chunking");
      doc.text("- Keyword extraction");
      doc.text("- Filename with spaces handling");

      doc.moveDown().text("Technical Details:");
      doc.text(
        "The system uses OpenAI text-embedding-3-small to generate embeddings."
      );
      doc.text(
        "Each document is broken down into chunks for improved retrieval."
      );
      doc.text(
        "Filenames with spaces should be properly handled by the system."
      );

      doc.moveDown().text("Architecture:");
      doc.text("1. Document uploaded to Storage");
      doc.text("2. Function is triggered");
      doc.text("3. Text is extracted and chunked");
      doc.text("4. Embeddings are generated for each chunk");
      doc.text("5. Chunks and metadata are stored in NeonDB");

      doc.moveDown().text("Conclusion:");
      doc.text(
        "This test PDF document should trigger the processing function and validate our implementation with space-containing filenames."
      );

      doc
        .moveDown()
        .fontSize(10)
        .text(`Date created: ${new Date().toISOString()}`)
        .text(`Unique ID: ${Math.random().toString(36).substring(2, 15)}`)
        .text(`Random string: ${Math.random().toString(36).substring(2, 15)}`);

      // Add a page of pure text for better extraction
      doc.addPage();
      doc
        .fontSize(12)
        .text(
          "SAMPLE TEXT PAGE FOR EXTRACTION\n\n" +
            "This page contains only plain text to ensure that PDF text extraction works properly with filenames containing spaces.\n\n" +
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus at mauris vel nisi feugiat fermentum. " +
            "Donec eleifend, nisl vel dignissim ultrices, massa neque convallis massa, eget laoreet justo justo id diam. " +
            "Fusce auctor, ligula non scelerisque aliquam, enim nibh fermentum nisl, ut pellentesque lacus felis sit amet felis. " +
            "Donec commodo auctor vehicula. Sed a lorem in lectus suscipit bibendum.\n\n" +
            "Key points for testing:\n" +
            "1. Text extraction\n" +
            "2. Embedding generation\n" +
            "3. Document processing\n" +
            "4. Keyword extraction\n" +
            "5. Storage and indexing\n" +
            "6. Filename with spaces handling\n\n" +
            "This text should be easily extractable by the PDF parser, and the filename with spaces should be properly handled."
        );

      // Finalize the PDF and end the stream
      doc.end();
    } catch (error) {
      console.error("Error creating PDF:", error);
      reject(error);
    }
  });
}

// Test function
async function testPDFUpload() {
  try {
    // Create sample PDF file with spaces in the name
    const tempFilePath = await createSamplePDF();
    console.log(`PDF test file created at: ${tempFilePath}`);

    // Log file size for debugging
    const fileStats = await fs.stat(tempFilePath);
    console.log(`PDF file size: ${fileStats.size} bytes`);

    // Generate test user and collection IDs
    const userId = "test-user-123";
    const productId = `test-product-${Math.random(100).toString()}`;
    const collectionId = "test-collection-123";
    const documentId = "test-document-9002";

    // Create the path that matches what the function expects
    // Use a filename with spaces to test space handling
    const originalFilename = "Fish and Fisheries of India.pdf";
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
      title: "Test PDF Document with Spaces",
      description:
        "A test PDF document with spaces in the filename for embedding generation",
      keywords: ["test", "pdf", "document", "embeddings", "spaces", "filename"],
      status: "pending",
      userId: userId,
      productId: productId,
      chunkSize: 800,
      overlap: 150,
    });

    // Also create collection doc
    await collectionRef.set({
      title: "Test Collection",
      description:
        "A test collection for PDF document uploads with spaces in filename",
      keywords: ["test", "collection", "pdf", "spaces"],
      status: "pending",
      productId: productId,
    });

    console.log(
      "Created initial Firestore collection and document for tracking"
    );

    // Now that Firestore is set up, upload the file to trigger the function
    console.log("Uploading test PDF document to:", storagePath);

    // Get storage bucket
    const bucket = admin.storage().bucket();

    // Upload the file
    await bucket.upload(tempFilePath, {
      destination: storagePath,
      metadata: {
        contentType: "application/pdf",
      },
    });

    console.log("Upload complete. Function should be triggered.");
    console.log("Checking Firestore for document status updates...");

    // Now check Firestore to see if the document status was updated
    let attempts = 0;
    const maxAttempts = 15; // Increase max attempts
    const checkInterval = 15000; // Increase to 15 seconds to give more time for PDF processing

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
              "SUCCESS: PDF document with spaces in filename and collection processed successfully!"
            );
            console.log("Document data:", data);
            console.log("Collection data:", collection.data());
            // Clean up
            await fs.unlink(tempFilePath);
            console.log("Test completed and cleaned up. Exiting.");
            process.exit(0);
          } else if (data.status === "error") {
            console.error(
              "ERROR: PDF document with spaces in filename processing failed"
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
testPDFUpload().catch(console.error);
