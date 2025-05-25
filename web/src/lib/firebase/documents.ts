"use server";

import { adminDb } from "./admin";
import { getStorage } from "firebase-admin/storage";
import { adminApp } from "./admin";
import { getCurrentUserId } from "./adminAuth";
import { Document, DocumentInput, DocumentStatus } from "./schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Get Firebase Storage instance
const adminStorage = getStorage(adminApp);
const bucket = adminStorage.bucket(
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);

// Document paths
const getDocumentPath = (userId: string) => `mydocuments/${userId}/mydocuments`;
const getDocumentDoc = (userId: string, documentId: string) =>
  `${getDocumentPath(userId)}/${documentId}`;

// Storage paths
const getStoragePath = (
  userId: string,
  collectionId: string,
  documentId: string,
  fileName: string
) =>
  `storage/${userId}/collections/${collectionId}/documents/${documentId}/${fileName}`;

/**
 * Create a new document
 * @param data Document data to create
 * @returns Object with success status and created document ID
 */
export async function createDocument(data: DocumentInput) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const documentRef = adminDb.collection(getDocumentPath(userId)).doc();

    const timestamp = getCurrentUnixTimestamp();
    const document: Document = {
      id: documentRef.id,
      userId,
      collectionId: data.collectionId,
      productId: data.productId,
      title: data.title,
      description: data.description,
      url: data.url || "",
      filePath: data.filePath || "",
      tags: data.tags || [],
      chunkSize: data.chunkSize || 1000,
      overlap: data.overlap || 200,
      status: data.status || "uploading",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await documentRef.set(document);

    console.log(`Created document: ${documentRef.id}`);

    return {
      success: true,
      id: documentRef.id,
      document,
    };
  } catch (error) {
    console.error("Error creating document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create document",
    };
  }
}

/**
 * Get a document by ID
 * @param documentId ID of the document to retrieve
 * @returns Object with success status and document data
 */
export async function getDocument(documentId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const documentDoc = await adminDb
      .doc(getDocumentDoc(userId, documentId))
      .get();

    if (!documentDoc.exists) {
      return { success: false, error: "Document not found" };
    }

    const document = documentDoc.data() as Document;

    return { success: true, document };
  } catch (error) {
    console.error("Error getting document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get document",
    };
  }
}

/**
 * Update a document
 * @param documentId ID of the document to update
 * @param data Updated document data
 * @returns Object with success status
 */
export async function updateDocument(
  documentId: string,
  data: Partial<DocumentInput>
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const documentRef = adminDb.doc(getDocumentDoc(userId, documentId));
    const documentDoc = await documentRef.get();

    if (!documentDoc.exists) {
      return { success: false, error: "Document not found" };
    }

    const updateData = {
      ...data,
      updatedAt: getCurrentUnixTimestamp(),
    };

    await documentRef.update(updateData);

    return { success: true };
  } catch (error) {
    console.error("Error updating document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update document",
    };
  }
}

/**
 * Update a document's status
 * @param documentId ID of the document to update
 * @param status New status
 * @returns Object with success status
 */
export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const documentRef = adminDb.doc(getDocumentDoc(userId, documentId));
    const documentDoc = await documentRef.get();

    if (!documentDoc.exists) {
      return { success: false, error: "Document not found" };
    }

    await documentRef.update({
      status,
      updatedAt: getCurrentUnixTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating document status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update document status",
    };
  }
}

/**
 * Delete a document
 * @param documentId ID of the document to delete
 * @returns Object with success status
 */
export async function deleteDocument(documentId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const documentRef = adminDb.doc(getDocumentDoc(userId, documentId));
    const documentDoc = await documentRef.get();

    if (!documentDoc.exists) {
      return { success: false, error: "Document not found" };
    }

    // Get the document data to access the file path
    const document = documentDoc.data() as Document;

    // Delete the file from storage if it exists
    if (document.filePath) {
      try {
        const fileRef = bucket.file(document.filePath);
        const [exists] = await fileRef.exists();

        if (exists) {
          await fileRef.delete();
          console.log(`Deleted file: ${document.filePath}`);
        }
      } catch (storageError) {
        console.error("Error deleting file from storage:", storageError);
        // Continue with document deletion even if file deletion fails
      }
    }

    // Delete the document from Firestore
    await documentRef.delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete document",
    };
  }
}

/**
 * Get all documents for a collection
 * @param collectionId ID of the collection to get documents for
 * @returns Object with success status and array of documents
 */
export async function getDocumentsByCollection(collectionId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated", documents: [] };
    }

    const documentsSnapshot = await adminDb
      .collection(getDocumentPath(userId))
      .where("collectionId", "==", collectionId)
      .get();

    const documents = documentsSnapshot.docs.map(
      (doc) => doc.data() as Document
    );

    return { success: true, documents };
  } catch (error) {
    console.error("Error getting documents by collection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get documents",
      documents: [],
    };
  }
}

/**
 * Delete multiple documents
 * @param documentIds Array of document IDs to delete
 * @returns Object with success status and count of deleted documents
 */
export async function deleteMultipleDocuments(documentIds: string[]) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: "User not authenticated",
        deletedCount: 0,
      };
    }

    const batch = adminDb.batch();
    let deletedCount = 0;
    const filesToDelete = [];

    // Add each document to the batch delete and collect file paths
    for (const documentId of documentIds) {
      const documentRef = adminDb.doc(getDocumentDoc(userId, documentId));
      const documentDoc = await documentRef.get();

      if (documentDoc.exists) {
        const document = documentDoc.data() as Document;

        // Add file path to delete list if it exists
        if (document.filePath) {
          filesToDelete.push(document.filePath);
        }

        batch.delete(documentRef);
        deletedCount++;
      }
    }

    // Commit the batch
    await batch.commit();

    // Delete files from storage
    for (const filePath of filesToDelete) {
      try {
        const fileRef = bucket.file(filePath);
        const [exists] = await fileRef.exists();

        if (exists) {
          await fileRef.delete();
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (storageError) {
        console.error("Error deleting file from storage:", storageError);
        // Continue with next file deletion even if this one fails
      }
    }

    return { success: true, deletedCount };
  } catch (error) {
    console.error("Error deleting multiple documents:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete documents",
      deletedCount: 0,
    };
  }
}

/**
 * Upload a document file to Firebase Storage
 * @param file File buffer to upload
 * @param collectionId ID of the collection the document belongs to
 * @param documentId ID of the document
 * @param fileName Name of the file
 * @param contentType Content type of the file
 * @returns Object with success status, signed URL, and file path
 */
export async function uploadDocumentFile(
  file: Buffer,
  collectionId: string,
  documentId: string,
  fileName: string,
  contentType: string
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Create the storage path
    const path = getStoragePath(userId, collectionId, documentId, fileName);

    // Create a file reference
    const fileRef = bucket.file(path);

    // Upload the file
    await fileRef.save(file, {
      metadata: {
        contentType,
      },
      resumable: false,
    });

    // Get a signed URL that expires in 10 years
    const [signedUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + 24 * 60 * 60 * 1000 * 365 * 10, // 10 years
    });

    console.log(`Uploaded file: ${path}`);

    return {
      success: true,
      url: signedUrl,
      filePath: path,
    };
  } catch (error) {
    console.error("Error uploading document file:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to upload document file",
    };
  }
}
