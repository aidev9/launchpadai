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
import { Collection } from "../schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Define a type for creating a collection (without id, userId, createdAt, updatedAt)
type CreateCollectionData = Omit<
  Collection,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

// Define a type for Firestore document data
type FirestoreCollectionData = Omit<Collection, "id">;

const collectionConverter: FirestoreDataConverter<Collection> = {
  toFirestore: (
    collection: WithFieldValue<Collection>
  ): WithFieldValue<FirestoreCollectionData> => {
    const { id, ...rest } = collection;
    return rest;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Collection {
    const data = snapshot.data(options) as FirestoreCollectionData;
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

  private getRefCollection(): CollectionReference<Collection> {
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

  private getRefDocument(id: string): DocumentReference<Collection> {
    if (!this.auth || !this.auth.currentUser) {
      console.log(
        "[FirebaseCollections][getRefDocument] User not authenticated"
      );
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }
    return doc(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}/${id}`
    ).withConverter(collectionConverter);
  }

  /**
   * Get all collections for the current user
   */
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

  /**
   * Get collections by product ID
   */
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

  /**
   * Create a new collection
   */
  async createCollection(
    collectionData: CreateCollectionData
  ): Promise<Collection | null> {
    try {
      const ref = this.getRefCollection();
      const userId = this.auth.currentUser?.uid || "default";
      const data: FirestoreCollectionData = {
        ...collectionData,
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
      console.error("[FirebaseCollections][createCollection] Error:", error);
      return null;
    }
  }

  /**
   * Update an existing collection
   */
  async updateCollection(
    id: string,
    collectionData: Partial<CreateCollectionData>
  ): Promise<Collection | null> {
    try {
      const ref = this.getRefDocument(id);
      const data: Partial<FirestoreCollectionData> = {
        ...collectionData,
        updatedAt: getCurrentUnixTimestamp(),
      };
      await updateDoc(ref, data);
      const docData = await getDoc(ref);
      const savedData = docData.data();
      if (!savedData) return null;
      return savedData;
    } catch (error) {
      console.error("[FirebaseCollections][updateCollection] Error:", error);
      return null;
    }
  }

  /**
   * Delete a single collection
   */
  async deleteCollection(id: string): Promise<boolean> {
    try {
      const ref = this.getRefDocument(id);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.error("[FirebaseCollections][deleteCollection] Error:", error);
      return false;
    }
  }

  /**
   * Delete multiple collections using batch operation
   */
  async deleteCollections(ids: string[]): Promise<boolean> {
    try {
      const batch = writeBatch(this.db);

      ids.forEach((id) => {
        const ref = this.getRefDocument(id);
        batch.delete(ref);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("[FirebaseCollections][deleteCollections] Error:", error);
      return false;
    }
  }

  /**
   * Create multiple collections using batch operation
   */
  async createCollections(
    collectionsData: CreateCollectionData[]
  ): Promise<boolean> {
    try {
      const batch = writeBatch(this.db);
      const ref = this.getRefCollection();
      const userId = this.auth.currentUser?.uid || "default";

      collectionsData.forEach((collectionData) => {
        const docRef = doc(ref);
        const data: FirestoreCollectionData = {
          ...collectionData,
          userId,
          createdAt: getCurrentUnixTimestamp(),
          updatedAt: getCurrentUnixTimestamp(),
        };
        batch.set(docRef, data);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("[FirebaseCollections][createCollections] Error:", error);
      return false;
    }
  }

  /**
   * Get a single collection by ID
   */
  async getCollection(id: string): Promise<Collection | null> {
    try {
      const ref = this.getRefDocument(id);
      const docData = await getDoc(ref);
      const data = docData.data();
      if (!data) return null;
      return data;
    } catch (error) {
      console.error("[FirebaseCollections][getCollection] Error:", error);
      return null;
    }
  }
}

// Export as a singleton
export const firebaseCollections = new FirebaseCollections();
export default FirebaseCollections;
