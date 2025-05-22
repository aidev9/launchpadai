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
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import { Document } from "../schema";

const documentConverter: FirestoreDataConverter<Document> = {
  toFirestore: (document) => document,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Document {
    const data = snapshot.data(options) as Document;
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
      this.collectionName = "documents";
    } catch (error) {
      console.error(
        "[FirebaseDocuments][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  getRefCollection(): CollectionReference<Document> {
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

  getDocumentsByCollections(
    collectionId: string
  ): Query<DocumentData, DocumentData> | null {
    if (!collectionId) {
      return null;
    }

    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) return null;

      const documentsQuery = query(
        this.getRefCollection(),
        where("collectionId", "==", collectionId),
        where("userId", "==", userId),
        orderBy("updatedAt", "desc")
      );

      return documentsQuery;
    } catch (error) {
      console.error(
        "[FirebaseDocuments][getDocumentsByCollections] Error:",
        error
      );
      return null;
    }
  }
}

// Export as a singleton
export const firebaseDocuments = new FirebaseDocuments();
export default FirebaseDocuments;
