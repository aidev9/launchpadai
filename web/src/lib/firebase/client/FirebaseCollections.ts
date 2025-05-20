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

class FirebaseCollections {
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
      this.collectionName = "collections";
    } catch (error) {
      console.error(
        "[FirebaseCollections][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  getCollections(): Query<DocumentData, DocumentData> | null {
    // Check if authentication is initialized and user is signed in
    if (!this.auth || !this.auth.currentUser) {
      return null;
    }

    const userId = this.auth.currentUser.uid;

    try {
      const collectionsRef = collection(
        this.db,
        `${this.collectionName}/${userId}/${this.collectionName}`
      );

      // Query to get collections for this user, ordered by updatedAt
      const collectionsQuery = query(
        collectionsRef,
        orderBy("updatedAt", "desc")
      );

      return collectionsQuery;
    } catch (error) {
      return null;
    }
  }

  getCollectionsByProduct(
    productId: string
  ): Query<DocumentData, DocumentData> | null {
    // Check if authentication is initialized and user is signed in
    if (!this.auth || !this.auth.currentUser) {
      return null;
    }

    const userId = this.auth.currentUser.uid;

    try {
      const collectionsRef = collection(
        this.db,
        `${this.collectionName}/${userId}/${this.collectionName}`
      );

      const collectionsQuery = query(
        collectionsRef,
        where("productId", "==", productId),
        orderBy("updatedAt", "desc")
      );

      return collectionsQuery;
    } catch (error) {
      return null;
    }
  }
}

export default new FirebaseCollections();
