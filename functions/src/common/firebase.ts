import {
  initializeApp,
  getApps,
  getApp,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Initialize Firebase Admin SDK
const firebaseConfig = {
  storageBucket: "launchpadai-prod.firebasestorage.app",
  // Explicitly set the storage bucket region
  storageBucketLocation: "us-east1",
  projectId: "launchpadai-prod",
  databaseURL: "https://launchpadai.firebaseio.com",
  credential: applicationDefault(),
};

const getCurrentUnixTimestamp = () => {
  return Math.floor(Date.now() / 1000);
};

const firebaseApp =
  getApps().length === 0
    ? initializeApp(firebaseConfig, "launchpadai-prod")
    : getApp("launchpadai-prod");

// Initialize Firestore with the specific database
// For Firebase Functions deployment, we connect to the custom database
const firestore = getFirestore(firebaseApp);

try {
  firestore.settings({
    databaseId: "launchpadai",
  });
  console.log("[FIREBASE] Firebase initialized with database: launchpadai");
} catch (error) {
  console.error("[FIREBASE] Error configuring Firestore database:", error);
}

const storage = getStorage(firebaseApp);

// Export initialized services
export const admin = {
  app: firebaseApp,
  firestore: firestore,
  storage: storage,
};

// export { firestoreDb as firestore, storage };
export { firestore, storage };

export default {
  app: firebaseApp,
};

export interface DocumentMetadata {
  userId: string;
  productId: string;
  collectionId: string;
  documentId: string;
  documentTitle: string;
  fileUrl: string;
}

export interface CollectionMetadata {
  title: string;
  description: string;
  keywords: string[];
  status: DocumentStatus;
  productId: string;
}

export interface DocumentData {
  title: string;
  description: string;
  keywords: string[];
  status: DocumentStatus;
  chunkSize?: number;
  overlap?: number;
}

export type DocumentStatus = "indexing" | "indexed" | "error";

export async function getCollectionData(
  userId: string,
  collectionId: string
): Promise<CollectionMetadata> {
  const collectionRef = firestore
    .collection("mycollections")
    .doc(userId)
    .collection("mycollections")
    .doc(collectionId);

  try {
    const doc = await collectionRef.get();
    if (!doc.exists) {
      console.warn(`Collection ${collectionId} not found in Firestore`);
      return {
        title: "",
        description: "",
        keywords: [],
        status: "indexing",
        productId: "",
      };
    }

    const data = doc.data();
    return {
      title: data?.title || "",
      description: data?.description || "",
      keywords: data?.keywords || [],
      status: data?.status || "indexing",
      productId: data?.productId || "",
    };
  } catch (error) {
    console.error(`Error fetching collection data for ${collectionId}:`, error);
    return {
      title: "",
      description: "",
      keywords: [],
      status: "indexing",
      productId: "",
    };
  }
}

export async function getDocumentData(
  userId: string,
  documentId: string
): Promise<DocumentData> {
  const documentRef = firestore
    .collection("mydocuments")
    .doc(userId)
    .collection("mydocuments")
    .doc(documentId);

  try {
    const doc = await documentRef.get();
    if (!doc.exists) {
      console.warn(`Document ${documentId} not found in Firestore`);
      return {
        title: "",
        description: "",
        keywords: [],
        status: "indexing",
        chunkSize: 1000,
        overlap: 200,
      };
    }

    const data = doc.data();
    return {
      title: data?.title || "",
      description: data?.description || "",
      keywords: data?.keywords || [],
      status: data?.status || "indexing",
      chunkSize: data?.chunkSize || 1000,
      overlap: data?.overlap || 200,
    };
  } catch (error) {
    console.error(`Error fetching document data for ${documentId}:`, error);
    return {
      title: "",
      description: "",
      keywords: [],
      status: "indexing",
      chunkSize: 1000,
      overlap: 200,
    };
  }
}

export async function updateDocumentStatus(
  userId: string,
  documentId: string,
  status: DocumentStatus
): Promise<void> {
  try {
    // Update document status
    const documentRef = firestore
      .collection("mydocuments")
      .doc(userId)
      .collection("mydocuments")
      .doc(documentId);

    // Check if document exists first
    const docSnapshot = await documentRef.get();
    if (!docSnapshot.exists) {
      console.warn(`Document ${documentId} not found when updating status`);
    }

    // Use set with merge instead of update
    const timestamp = getCurrentUnixTimestamp();
    await documentRef.set({ status, updatedAt: timestamp }, { merge: true });
  } catch (error) {
    console.error(`Error updating document status for ${documentId}:`, error);
    throw error;
  }
}

export async function updateCollectionStatus(
  userId: string,
  collectionId: string,
  status: DocumentStatus
): Promise<void> {
  try {
    // Update document status
    const documentRef = firestore
      .collection("mycollections")
      .doc(userId)
      .collection("mycollections")
      .doc(collectionId);

    // Check if document exists first
    const docSnapshot = await documentRef.get();
    if (!docSnapshot.exists) {
      console.warn(`Collection ${collectionId} not found when updating status`);
    }

    // Use set with merge instead of update
    const timestamp = getCurrentUnixTimestamp();
    await documentRef.set({ status, updatedAt: timestamp }, { merge: true });
  } catch (error) {
    console.error(
      `Error updating collection status for ${collectionId}:`,
      error
    );
    throw error;
  }
}
