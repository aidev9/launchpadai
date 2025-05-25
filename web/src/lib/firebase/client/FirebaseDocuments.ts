import { getAuth } from "firebase/auth";
import {
  collection,
  DocumentData,
  getFirestore,
  orderBy,
  query,
  Query,
  where,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  CollectionReference,
  addDoc,
  getDoc,
  updateDoc,
  doc,
  DocumentReference,
  deleteDoc,
  WithFieldValue,
  writeBatch,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import { Document } from "../schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Define a type for creating a document (without id, userId, createdAt, updatedAt)
type CreateDocumentData = Omit<
  Document,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

// Define a type for Firestore document data
type FirestoreDocumentData = Omit<Document, "id">;

const documentConverter: FirestoreDataConverter<Document> = {
  toFirestore: (
    document: WithFieldValue<Document>
  ): WithFieldValue<FirestoreDocumentData> => {
    const { id, ...rest } = document;
    return rest;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Document {
    const data = snapshot.data(options) as FirestoreDocumentData;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseDocuments {
  auth: ReturnType<typeof getAuth>;
  db: ReturnType<typeof getFirestore>;
  storage: ReturnType<typeof getStorage>;
  collectionName: string;

  constructor() {
    try {
      if (!clientAuth || !clientDb || !clientApp) {
        throw new Error("Firebase client instances are not initialized");
      }

      this.auth = clientAuth;
      this.db = clientDb;
      this.storage = getStorage(clientApp);
      this.collectionName = "mydocuments";
    } catch (error) {
      console.error(
        "[FirebaseDocuments][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  private getRefCollection(): CollectionReference<Document> {
    if (!this.auth || !this.auth.currentUser) {
      console.log(
        "[FirebaseDocuments][getRefCollection] User not authenticated"
      );
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    return collection(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}`
    ).withConverter(documentConverter);
  }

  private getRefDocument(id: string): DocumentReference<Document> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseDocuments][getRefDocument] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }
    return doc(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}/${id}`
    ).withConverter(documentConverter);
  }

  /**
   * Get all documents for the current user
   */
  getDocuments(): Query<DocumentData, DocumentData> | null {
    try {
      const documentsQuery = query(
        this.getRefCollection(),
        orderBy("updatedAt", "desc")
      );

      return documentsQuery;
    } catch (error) {
      console.error("[FirebaseDocuments][getDocuments] Error:", error);
      return null;
    }
  }

  /**
   * Get documents by collection ID
   */
  getDocumentsByCollection(
    collectionId: string
  ): Query<DocumentData, DocumentData> | null {
    if (!collectionId) {
      return null;
    }

    try {
      const documentsQuery = query(
        this.getRefCollection(),
        where("collectionId", "==", collectionId),
        orderBy("updatedAt", "desc")
      );

      return documentsQuery;
    } catch (error) {
      console.error(
        "[FirebaseDocuments][getDocumentsByCollection] Error:",
        error
      );
      return null;
    }
  }

  /**
   * Get documents by product ID
   */
  getDocumentsByProduct(
    productId: string
  ): Query<DocumentData, DocumentData> | null {
    if (!productId) {
      return null;
    }

    try {
      const documentsQuery = query(
        this.getRefCollection(),
        where("productId", "==", productId),
        orderBy("updatedAt", "desc")
      );

      return documentsQuery;
    } catch (error) {
      console.error("[FirebaseDocuments][getDocumentsByProduct] Error:", error);
      return null;
    }
  }

  /**
   * Create a new document
   */
  async createDocument(
    documentData: CreateDocumentData
  ): Promise<Document | null> {
    try {
      const ref = this.getRefCollection();
      const userId = this.auth.currentUser?.uid || "default";
      const data: FirestoreDocumentData = {
        ...documentData,
        userId,
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      };
      const docRef = await addDoc(ref, data);
      const docData = await getDoc(docRef);
      const savedData = docData.data();
      if (!savedData) return null;
      return { ...savedData, id: docRef.id };
    } catch (error) {
      console.error("[FirebaseDocuments][createDocument] Error:", error);
      return null;
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(
    id: string,
    documentData: Partial<CreateDocumentData>
  ): Promise<Document | null> {
    try {
      const ref = this.getRefDocument(id);
      const data: Partial<FirestoreDocumentData> = {
        ...documentData,
        updatedAt: getCurrentUnixTimestamp(),
      };
      await updateDoc(ref, data);
      const docData = await getDoc(ref);
      const savedData = docData.data();
      if (!savedData) return null;
      return savedData;
    } catch (error) {
      console.error("[FirebaseDocuments][updateDocument] Error:", error);
      return null;
    }
  }

  /**
   * Delete a single document
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      const ref = this.getRefDocument(id);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.error("[FirebaseDocuments][deleteDocument] Error:", error);
      return false;
    }
  }

  /**
   * Delete multiple documents using batch operation
   */
  async deleteDocuments(ids: string[]): Promise<boolean> {
    try {
      const batch = writeBatch(this.db);

      ids.forEach((id) => {
        const ref = this.getRefDocument(id);
        batch.delete(ref);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("[FirebaseDocuments][deleteDocuments] Error:", error);
      return false;
    }
  }

  /**
   * Create multiple documents using batch operation
   */
  async createDocuments(documentsData: CreateDocumentData[]): Promise<boolean> {
    try {
      const batch = writeBatch(this.db);
      const ref = this.getRefCollection();
      const userId = this.auth.currentUser?.uid || "default";

      documentsData.forEach((documentData) => {
        const docRef = doc(ref);
        const data: FirestoreDocumentData = {
          ...documentData,
          userId,
          createdAt: getCurrentUnixTimestamp(),
          updatedAt: getCurrentUnixTimestamp(),
        };
        batch.set(docRef, data);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("[FirebaseDocuments][createDocuments] Error:", error);
      return false;
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    try {
      const ref = this.getRefDocument(id);
      const docData = await getDoc(ref);
      const data = docData.data();
      if (!data) return null;
      return data;
    } catch (error) {
      console.error("[FirebaseDocuments][getDocument] Error:", error);
      return null;
    }
  }
}

// Export as a singleton
export const firebaseDocuments = new FirebaseDocuments();
export default FirebaseDocuments;
