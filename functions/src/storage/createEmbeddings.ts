import { onObjectFinalized, StorageEvent } from "firebase-functions/v2/storage";
import * as functions from "firebase-functions/v2";
const logger = functions.logger;
import { Client } from "pg";
import { TextExtractor } from "./modules/textExtractor.js";
import { OpenAIEmbedding } from "./modules/embedding.js";
import * as path from "path";
import { chunkText } from "./utils.js";
import {
  DocumentMetadata,
  firestore,
  getCollectionData,
  getDocumentData,
  storage,
  updateCollectionStatus,
  updateDocumentStatus,
} from "../common/firebase.js";
import nlp from "compromise";

// Extract keywords from search query using compromise
function extractKeywords(text: string): string[] {
  try {
    const doc = nlp(text);
    // Extract nouns, proper nouns, and verbs which are likely to be important keywords
    const terms = [
      ...doc.nouns().out("array"),
      ...doc.verbs().out("array"),
      ...doc.match("#Adjective").out("array"),
    ];

    // Remove duplicates and common words
    return [...new Set(terms)]
      .filter((term) => term.length > 2) // Filter out very short terms
      .map((term) => term.toLowerCase());
  } catch (error) {
    console.error("Error extracting keywords:", error);
    // Return the original text split into words if keyword extraction fails
    return text.split(/\s+/).filter((word) => word.length > 2);
  }
}

// Async function that does the work
async function processDocumentHandler(event: StorageEvent): Promise<void> {
  // Get file metadata
  const filePath = event.data.name;
  const contentType = event.data.contentType;
  const fileSize = event.data.size ? parseInt(event.data.size.toString()) : 0;
  const bucket = event.data.bucket;

  // Store original filePath for metadata and download
  const originalFilePath = filePath;

  // Remove the spaces from the filePath for path operations
  let processedFilePath = filePath.replace(/\s+/g, "-");

  if (!processedFilePath) {
    console.error("No file path provided");
    return;
  }

  // Check if the path matches our target location and is a document type we want to process
  const validExtensions = [".pdf", ".md", ".txt", ".doc", ".docx"];
  const fileExtension = path.extname(processedFilePath).toLowerCase();

  // Verify this is a file we want to process
  if (!validExtensions.includes(fileExtension)) {
    console.log(
      `File ${processedFilePath} has unsupported extension: ${fileExtension}. Skipping.`
    );
    return;
  }

  let metadata: DocumentMetadata | undefined;

  try {
    // Extract file metadata from the path
    // Example path: collections/{collectionId}/documents/{documentId}
    const pathParts = processedFilePath.split("/");
    console.log("pathParts:::", pathParts);
    const userId = pathParts[1];
    const collectionId = pathParts[3];
    const documentId = pathParts[5];
    const fileNameWithExtension = pathParts[pathParts.length - 1]; // Use the last part as filename

    // Get the actual filename from the original path to preserve spaces
    const originalFileName =
      originalFilePath.split("/").pop() || fileNameWithExtension;

    metadata = {
      userId: userId,
      productId: "", // We'll get this from Firestore
      collectionId: collectionId,
      documentId: documentId,
      documentTitle: path.basename(originalFileName, fileExtension),
      fileUrl: `gs://${bucket}/${originalFilePath}`,
    };

    // Get the document reference to retrieve user and product IDs
    const docRef = firestore
      .collection("mydocuments")
      .doc(userId)
      .collection("mydocuments")
      .doc(documentId);

    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      console.error(
        `[METADATA] Document ${documentId} not found in Firestore. File path: ${filePath}`
      );
      console.error(
        `[METADATA] Attempting to access collection: ${collectionId}, document: ${documentId}`
      );
    } else {
      const docData = docSnapshot.data();
      if (!docData) {
        console.error(
          `[METADATA] No data found for document ${metadata.documentId}`
        );
      } else {
        // Update metadata with user and product IDs from Firestore
        // metadata.userId = docData.userId || "";
        console.info(
          `[METADATA] Setting metadata productId to: ${docData.productId}`
        );

        metadata.productId = docData.productId || Math.random().toString();
        console.info(`[METADATA] metadata::: ${metadata}`);
      }
    }

    // Update document status to 'indexing'
    await updateDocumentStatus(userId, documentId, "indexing");

    // Update collection status to 'indexing'
    await updateCollectionStatus(userId, collectionId, "indexing");

    // Get Firestore collection and document data
    const collectionData = await getCollectionData(
      metadata.userId,
      metadata.collectionId
    );

    console.log("collectionData:::", collectionData);
    metadata.productId = collectionData.productId;

    const documentData = await getDocumentData(
      metadata.userId,
      metadata.documentId
    );

    // Download the file to memory - use original file path for download
    console.log(`Downloading file ${originalFilePath} from bucket ${bucket}`);

    // Handle file download with proper error handling for files with spaces
    let fileContents;
    try {
      [fileContents] = await storage
        .bucket(bucket)
        .file(originalFilePath)
        .download();

      console.log(
        `Successfully downloaded file using original path: ${originalFilePath}`
      );
    } catch (downloadError) {
      console.error(`Error downloading with original path: ${downloadError}`);
      console.log(
        `Attempting download with processed path: ${processedFilePath}`
      );

      try {
        // Try with the processed path as fallback
        [fileContents] = await storage
          .bucket(bucket)
          .file(processedFilePath)
          .download();

        console.log(
          `Successfully downloaded file using processed path: ${processedFilePath}`
        );
      } catch (fallbackError) {
        console.error(
          `Failed to download with processed path too: ${fallbackError}`
        );
        throw new Error(
          `Unable to download file. Original error: ${downloadError}, Fallback error: ${fallbackError}`
        );
      }
    }

    // Extract text from document based on file type
    console.log(`Extracting text from ${fileExtension} document`);
    const textExtractor = new TextExtractor();
    const extractedText = await textExtractor.extractText(
      fileContents,
      fileExtension,
      contentType || ""
    );

    console.log("extractedText:::", extractedText);

    // Extract keywords from the entire document content
    console.log("Extracting keywords from the full document content");
    const extractedDocumentKeywords = extractKeywords(extractedText);
    console.log("Document keywords extracted:", extractedDocumentKeywords);

    // Combine extracted keywords with any existing keywords from Firestore
    const existingKeywords = documentData.keywords || [];
    const combinedKeywords = [
      ...new Set([...existingKeywords, ...extractedDocumentKeywords]),
    ];
    console.log("Combined document keywords:", combinedKeywords);

    // Update the document in Firestore with the combined keywords
    await firestore
      .collection("mydocuments")
      .doc(metadata.userId)
      .collection("mydocuments")
      .doc(metadata.documentId)
      .update({
        keywords: combinedKeywords,
      });

    // Create OpenAI embeddings
    console.log("Creating OpenAI vector embeddings");
    const embeddingModel = new OpenAIEmbedding();

    // Get chunk size and overlap from document data, or use defaults
    const chunkSize = documentData.chunkSize || 1000;
    const overlap = documentData.overlap || 200;

    console.log(
      `Using chunkSize: ${chunkSize} and overlap: ${overlap} from document settings`
    );
    console.log(`Document data: ${JSON.stringify(documentData)}`);

    // Chunk the text for processing with custom settings
    const chunks = chunkText(extractedText, chunkSize, overlap);
    console.log(`Created ${chunks.length} chunks from the document`);

    console.log("chunks:::", chunks);

    // Ensure metadata is defined before proceeding
    if (!metadata) {
      throw new Error("Document metadata is undefined");
    }

    // Create a local non-nullable copy of metadata
    const safeMetadata = metadata;

    // Process all chunks to create embeddings and keywords
    console.log(
      `Processing ${chunks.length} chunks to prepare for batch insert`
    );

    // Prepare an array to hold all processed chunk data
    const processedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1} of ${chunks.length}`);
      try {
        // Extract keywords using NLP
        const chunkKeywords = extractKeywords(chunk);
        console.log("chunkKeywords:::", chunkKeywords);

        // Create embeddings for the chunk
        const embedding = await embeddingModel.createEmbeddings(chunk);
        console.log("embedding:::", embedding);

        // Store the processed chunk data for batch insert
        processedChunks.push({
          embedding,
          chunkContent: chunk,
          chunkIndex: i,
          chunkKeywords,
        });
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
        throw error;
      }
    }

    try {
      // Batch insert all chunks into NeonDB - use original filename
      console.log(
        `Performing batch insert of ${processedChunks.length} chunks`
      );
      await batchStoreChunksInNeonDB({
        chunks: processedChunks,
        totalChunks: chunks.length,
        collectionId,
        documentId,
        documentTitle: safeMetadata.documentTitle,
        fileName: path.basename(originalFilePath).replace(fileExtension, ""),
        fileUrl: safeMetadata.fileUrl,
        documentKeywords: combinedKeywords,
        documentDescription: documentData.description || "",
        collectionName: collectionData.title || "",
        collectionDescription: collectionData.description || "",
        collectionKeywords: collectionData.keywords || [],
        metadata: safeMetadata,
      });

      console.log(
        `Successfully processed all ${chunks.length} chunks in batch`
      );

      // Update document status to 'indexed'
      console.log("Updating document status to 'indexed'", userId, documentId);
      await updateDocumentStatus(userId, documentId, "indexed");

      // Update collection status to 'indexed'
      console.log(
        "Updating collection status to 'indexed'",
        userId,
        collectionId
      );
      await updateCollectionStatus(userId, collectionId, "indexed");
    } catch (error) {
      console.error("Error in batch processing:", error);

      // Update document and collection status to 'error'
      await updateDocumentStatus(userId, documentId, "error");
      await updateCollectionStatus(userId, collectionId, "error");

      throw error;
    }

    console.log("metadata:::", safeMetadata);
    console.log(
      `Successfully processed document ${safeMetadata.documentId} in collection ${safeMetadata.collectionId}`
    );
    return;
  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
}

async function batchStoreChunksInNeonDB({
  chunks,
  totalChunks,
  collectionId,
  documentId,
  documentTitle,
  fileName,
  fileUrl,
  documentKeywords,
  documentDescription,
  collectionName,
  collectionDescription,
  collectionKeywords,
  metadata,
}: {
  chunks: Array<{
    embedding: number[];
    chunkContent: string;
    chunkIndex: number;
    chunkKeywords: string[];
  }>;
  totalChunks: number;
  collectionId: string;
  documentId: string;
  documentTitle: string;
  fileName: string;
  fileUrl: string;
  documentKeywords: string[];
  documentDescription: string;
  collectionName: string;
  collectionDescription: string;
  collectionKeywords: string[];
  metadata: DocumentMetadata;
}): Promise<void> {
  // Verify NeonDB connection string is set
  const neonDbConnectionString = process.env.NEON_DB_CONNECTION_STRING;
  if (!neonDbConnectionString) {
    throw new Error(
      "NEON_DB_CONNECTION_STRING environment variable must be set"
    );
  }

  let client: Client | null = null;

  try {
    // NeonDB connection setup
    client = new Client({
      connectionString: neonDbConnectionString,
    });

    await client.connect();

    // First, delete any existing chunks for this document to avoid unique constraint violations
    console.log(`Deleting any existing chunks for document ${documentId}...`);
    const deleteQuery = `
      DELETE FROM document_chunks 
      WHERE document_id = $1 AND user_id = $2
    `;

    const deleteResult = await client.query(deleteQuery, [
      documentId,
      metadata.userId,
    ]);
    console.log(`Deleted ${deleteResult.rowCount} existing chunks`);

    // Batch insert query
    const batchInsertQuery = `
      INSERT INTO document_chunks (
        document_id, 
        user_id, 
        product_id, 
        collection_id, 
        chunk_index, 
        total_chunks, 
        chunk_content, 
        embedding_vector, 
        document_title, 
        filename,
        file_url, 
        document_keywords, 
        document_description, 
        chunk_keywords,
        collection_name,
        collection_description,
        collection_keywords,
        created_at,
        updated_at,
        embedding_model
      ) 
      VALUES 
    `;

    // Current timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Prepare all values and parameters
    const valueStrings = [];
    const valueParams = [];
    let paramIndex = 1;

    // Add all chunk data to the batch
    for (const chunk of chunks) {
      // Create the parameter placeholders for this row
      const placeholders = [];
      for (let j = 0; j < 20; j++) {
        placeholders.push(`$${paramIndex}`);
        paramIndex++;
      }

      valueStrings.push(`(${placeholders.join(", ")})`);

      // Add the actual values to the parameters array
      valueParams.push(
        documentId,
        metadata.userId,
        metadata.productId,
        collectionId,
        chunk.chunkIndex,
        totalChunks,
        chunk.chunkContent,
        JSON.stringify(chunk.embedding),
        documentTitle,
        fileName,
        fileUrl,
        JSON.stringify(documentKeywords),
        documentDescription,
        JSON.stringify(chunk.chunkKeywords),
        collectionName,
        collectionDescription,
        JSON.stringify(collectionKeywords),
        timestamp,
        timestamp,
        "text-embedding-3-small"
      );
    }

    // Combine the query with the value placeholders
    const finalQuery = batchInsertQuery + valueStrings.join(", ");

    // Execute the batch insert
    await client.query(finalQuery, valueParams);

    console.log(
      `Successfully stored all ${chunks.length} chunks for document ${documentId} in a single batch operation`
    );
  } catch (error) {
    console.error("Error during batch insert in NeonDB:", error);
    throw error;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Keep the original function for individual inserts in case it's needed elsewhere
async function storeChunkInNeonDB({
  embedding,
  chunkContent,
  chunkIndex,
  totalChunks,
  chunkKeywords,
  collectionId,
  documentId,
  documentTitle,
  fileName,
  fileUrl,
  documentKeywords,
  documentDescription,
  collectionName,
  collectionDescription,
  collectionKeywords,
  metadata,
}: {
  embedding: number[];
  chunkContent: string;
  chunkIndex: number;
  totalChunks: number;
  chunkKeywords: string[];
  collectionId: string;
  documentId: string;
  documentTitle: string;
  fileName: string;
  fileUrl: string;
  documentKeywords: string[];
  documentDescription: string;
  collectionName: string;
  collectionDescription: string;
  collectionKeywords: string[];
  metadata: DocumentMetadata;
}): Promise<void> {
  // Verify NeonDB connection string is set
  const neonDbConnectionString = process.env.NEON_DB_CONNECTION_STRING;
  if (!neonDbConnectionString) {
    throw new Error(
      "NEON_DB_CONNECTION_STRING environment variable must be set"
    );
  }

  let client: Client | null = null;

  try {
    // NeonDB connection setup
    client = new Client({
      connectionString: neonDbConnectionString,
    });

    await client.connect();

    // Check if this chunk already exists and delete it if needed
    const checkQuery = `
      DELETE FROM document_chunks 
      WHERE document_id = $1 
      AND user_id = $2 
      AND chunk_index = $3
    `;

    const deleteResult = await client.query(checkQuery, [
      documentId,
      metadata.userId,
      chunkIndex,
    ]);

    if (deleteResult && deleteResult.rowCount && deleteResult.rowCount > 0) {
      console.log(
        `Deleted existing chunk ${chunkIndex} for document ${documentId}`
      );
    }

    // Prepare query for inserting chunks
    const insertChunkQuery = `
      INSERT INTO document_chunks (
        document_id, 
        user_id, 
        product_id, 
        collection_id, 
        chunk_index, 
        total_chunks, 
        chunk_content, 
        embedding_vector, 
        document_title, 
        filename,
        file_url, 
        document_keywords, 
        document_description, 
        chunk_keywords,
        collection_name,
        collection_description,
        collection_keywords,
        created_at,
        updated_at,
        embedding_model
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    `;

    // Current timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Insert chunk with metadata
    await client.query(insertChunkQuery, [
      documentId,
      metadata.userId,
      metadata.productId,
      collectionId,
      chunkIndex,
      totalChunks,
      chunkContent,
      JSON.stringify(embedding),
      documentTitle,
      fileName,
      fileUrl,
      JSON.stringify(documentKeywords),
      documentDescription,
      JSON.stringify(chunkKeywords),
      collectionName,
      collectionDescription,
      JSON.stringify(collectionKeywords),
      timestamp,
      timestamp,
      "text-embedding-3-small",
    ]);

    console.log(
      `Successfully stored chunk ${
        chunkIndex + 1
      } of ${totalChunks} for document ${documentId}`
    );
  } catch (error) {
    console.error("Error storing chunk in NeonDB:", error);
    throw error;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Storage cloud function definition
export const processDocumentEmbeddings = onObjectFinalized(
  {
    region: "us-east1",
    cpu: 2,
    memory: "2GiB",
  },
  async (event: StorageEvent) => {
    const filePath = event.data.name;

    // Regex for this pattern: collections/{collectionId}/documents/{documentId}
    const pathPattern = /collections\/[^\/]+\/documents\/[^\/]+/;

    if (!pathPattern.test(filePath)) {
      logger.log(`Ignoring file not in collections path: ${filePath}`);
      return;
    }

    await processDocumentHandler(event);
  }
);
