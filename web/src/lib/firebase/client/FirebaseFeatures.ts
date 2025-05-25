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
import { Feature } from "../schema/feature";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Define a type for creating a feature (without id)
type CreateFeatureData = Omit<Feature, "id">;

// Define a type for Firestore document data
type FirestoreFeatureData = Omit<Feature, "id">;

const featureConverter: FirestoreDataConverter<Feature> = {
  toFirestore: (
    feature: WithFieldValue<Feature>
  ): WithFieldValue<FirestoreFeatureData> => {
    const { id, ...rest } = feature;
    return rest;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Feature {
    const data = snapshot.data(options) as FirestoreFeatureData;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseFeatures {
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
      this.collectionName = "myfeatures";
    } catch (error) {
      console.error(
        "[FirebaseFeatures][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  private getRefCollection(): CollectionReference<Feature> {
    if (!this.auth || !this.auth.currentUser) {
      console.log(
        "[FirebaseFeatures][getRefCollection] User not authenticated"
      );
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    return collection(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}`
    ).withConverter(featureConverter);
  }

  private getRefDocument(id: string): DocumentReference<Feature> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseFeatures][getRefDocument] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }
    return doc(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}/${id}`
    ).withConverter(featureConverter);
  }

  /**
   * Get all features for the current user
   */
  getFeatures(): Query<DocumentData, DocumentData> | null {
    try {
      const featuresQuery = query(
        this.getRefCollection(),
        orderBy("updatedAt", "desc")
      );

      return featuresQuery;
    } catch (error) {
      console.error("[FirebaseFeatures][getFeatures] Error:", error);
      return null;
    }
  }

  /**
   * Get features by product ID
   */
  getFeaturesByProduct(
    productId: string
  ): Query<DocumentData, DocumentData> | null {
    if (!productId) {
      return null;
    }

    try {
      const featuresQuery = query(
        this.getRefCollection(),
        where("productId", "==", productId),
        orderBy("updatedAt", "desc")
      );

      return featuresQuery;
    } catch (error) {
      console.error("[FirebaseFeatures][getFeaturesByProduct] Error:", error);
      return null;
    }
  }

  /**
   * Get features by status
   */
  getFeaturesByStatus(
    status: Feature["status"]
  ): Query<DocumentData, DocumentData> | null {
    if (!status) {
      return null;
    }

    try {
      const featuresQuery = query(
        this.getRefCollection(),
        where("status", "==", status),
        orderBy("updatedAt", "desc")
      );

      return featuresQuery;
    } catch (error) {
      console.error("[FirebaseFeatures][getFeaturesByStatus] Error:", error);
      return null;
    }
  }

  /**
   * Get features by tags
   */
  getFeaturesByTags(tags: string[]): Query<DocumentData, DocumentData> | null {
    if (!tags || tags.length === 0) {
      return null;
    }

    try {
      const featuresQuery = query(
        this.getRefCollection(),
        where("tags", "array-contains-any", tags),
        orderBy("updatedAt", "desc")
      );

      return featuresQuery;
    } catch (error) {
      console.error("[FirebaseFeatures][getFeaturesByTags] Error:", error);
      return null;
    }
  }

  /**
   * Create a new feature
   */
  async createFeature(featureData: CreateFeatureData): Promise<Feature | null> {
    try {
      const ref = this.getRefCollection();
      const data: FirestoreFeatureData = {
        ...featureData,
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      };
      const docRef = await addDoc(ref, data);
      const docData = await getDoc(docRef);
      const savedData = docData.data();
      if (!savedData) return null;
      return { ...savedData, id: docRef.id };
    } catch (error) {
      console.error("[FirebaseFeatures][createFeature] Error:", error);
      return null;
    }
  }

  /**
   * Update an existing feature
   */
  async updateFeature(
    id: string,
    featureData: Partial<CreateFeatureData>
  ): Promise<Feature | null> {
    try {
      const ref = this.getRefDocument(id);
      const data: Partial<FirestoreFeatureData> = {
        ...featureData,
        updatedAt: getCurrentUnixTimestamp(),
      };
      await updateDoc(ref, data);
      const docData = await getDoc(ref);
      const savedData = docData.data();
      if (!savedData) return null;
      return savedData;
    } catch (error) {
      console.error("[FirebaseFeatures][updateFeature] Error:", error);
      return null;
    }
  }

  /**
   * Delete a single feature
   */
  async deleteFeature(id: string): Promise<boolean> {
    try {
      const ref = this.getRefDocument(id);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.error("[FirebaseFeatures][deleteFeature] Error:", error);
      return false;
    }
  }

  /**
   * Delete multiple features using batch operation
   */
  async deleteFeatures(ids: string[]): Promise<boolean> {
    try {
      const batch = writeBatch(this.db);

      ids.forEach((id) => {
        const ref = this.getRefDocument(id);
        batch.delete(ref);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("[FirebaseFeatures][deleteFeatures] Error:", error);
      return false;
    }
  }

  /**
   * Create multiple features using batch operation
   */
  async createFeatures(featuresData: CreateFeatureData[]): Promise<boolean> {
    try {
      const batch = writeBatch(this.db);
      const ref = this.getRefCollection();

      featuresData.forEach((featureData) => {
        const docRef = doc(ref);
        const data: FirestoreFeatureData = {
          ...featureData,
          createdAt: getCurrentUnixTimestamp(),
          updatedAt: getCurrentUnixTimestamp(),
        };
        batch.set(docRef, data);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error("[FirebaseFeatures][createFeatures] Error:", error);
      return false;
    }
  }

  /**
   * Get a single feature by ID
   */
  async getFeature(id: string): Promise<Feature | null> {
    try {
      const ref = this.getRefDocument(id);
      const docData = await getDoc(ref);
      const data = docData.data();
      if (!data) return null;
      return data;
    } catch (error) {
      console.error("[FirebaseFeatures][getFeature] Error:", error);
      return null;
    }
  }
}

export default FirebaseFeatures;
