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
import { Collection } from "../schema";

const collectionConverter: FirestoreDataConverter<Collection> = {
  toFirestore: (collection) => collection,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Collection {
    const data = snapshot.data(options) as Collection;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

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

  getRefCollection(): CollectionReference<Collection> {
    if (!this.auth || !this.auth.currentUser) {
      console.log(
        "[FirebaseCollections][getRefCollection] User not authenticated"
      );
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    return collection(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}`
    ).withConverter(collectionConverter);
  }

  getCollections(): Query<DocumentData, DocumentData> | null {
    try {
      const collectionsQuery = query(
        this.getRefCollection(),
        orderBy("updatedAt", "desc")
      );

      return collectionsQuery;
    } catch (error) {
      console.error("[FirebaseCollections][getCollections] Error:", error);
      return null;
    }
  }

  getCollectionsByProduct(
    productId: string
  ): Query<DocumentData, DocumentData> | null {
    if (!productId) {
      return null;
    }

    try {
      const collectionsQuery = query(
        this.getRefCollection(),
        where("productId", "==", productId),
        orderBy("updatedAt", "desc")
      );

      return collectionsQuery;
    } catch (error) {
      console.error(
        "[FirebaseCollections][getCollectionsByProduct] Error:",
        error
      );
      return null;
    }
  }
}

// Export as a singleton
export const firebaseCollections = new FirebaseCollections();
export default FirebaseCollections;
