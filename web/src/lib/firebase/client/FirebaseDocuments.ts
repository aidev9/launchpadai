import { getAuth } from "firebase/auth";
import {
  collection,
  DocumentData,
  getFirestore,
  orderBy,
  query,
  Query,
  where,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";

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
      this.collectionName = "documents";
    } catch (error) {
      console.error(
        "[FirebaseDocuments][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  getDocumentsByCollections(
    collectionId: string
  ): Query<DocumentData, DocumentData> | null {
    if (!this.auth || !this.auth.currentUser) {
      return null;
    }

    const userId = this.auth.currentUser.uid;

    try {
      const documentsRef = collection(
        this.db,
        `${this.collectionName}/${userId}/${this.collectionName}`
      );

      // Query to get collections for this user, ordered by updatedAt
      const documentsQuery = query(
        documentsRef,
        where("collectionId", "==", collectionId),
        where("userId", "==", userId),
        orderBy("updatedAt", "desc")
      );

      return documentsQuery;
    } catch (error) {
      return null;
    }
  }
}

export default new FirebaseDocuments();
