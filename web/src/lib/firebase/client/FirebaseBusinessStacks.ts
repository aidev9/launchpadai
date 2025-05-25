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
  setDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Business Stack Schema - matches the one from atoms/product.ts
export interface BusinessStack {
  id?: string;
  productId?: string;
  userId?: string;
  marketSize: string;
  revenueModel: string;
  distributionChannels: string[];
  customerAcquisition: string;
  valueProposition: string;
  costStructure?: string;
  partnerships?: string[];
  tags?: string[];
  createdAt?: number;
  updatedAt?: number;
}

const businessStackConverter: FirestoreDataConverter<BusinessStack> = {
  toFirestore: (businessStack) => businessStack,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): BusinessStack {
    const data = snapshot.data(options) as BusinessStack;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseBusinessStacks {
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
      this.collectionName = "mybusinessstacks";
    } catch (error) {
      console.error(
        "[FirebaseBusinessStacks][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  getRefCollection(): CollectionReference<BusinessStack> {
    if (!this.auth || !this.auth.currentUser) {
      console.log(
        "[FirebaseBusinessStacks][getRefCollection] User not authenticated"
      );
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    return collection(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}`
    ).withConverter(businessStackConverter);
  }

  getRefDocument(id: string): DocumentReference<BusinessStack> {
    if (!this.auth || !this.auth.currentUser) {
      console.log(
        "[FirebaseBusinessStacks][getRefDocument] User not authenticated"
      );
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }
    return doc(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}/${id}`
    ).withConverter(businessStackConverter);
  }

  getBusinessStacks(): Query<DocumentData, DocumentData> | null {
    try {
      const businessStacksQuery = query(
        this.getRefCollection(),
        orderBy("updatedAt", "desc")
      );

      return businessStacksQuery;
    } catch (error) {
      console.error(
        "[FirebaseBusinessStacks][getBusinessStacks] Error:",
        error
      );
      return null;
    }
  }

  getBusinessStacksByProductId(
    productId: string
  ): Query<DocumentData, DocumentData> | null {
    try {
      const businessStacksQuery = query(
        this.getRefCollection(),
        where("productId", "==", productId),
        orderBy("updatedAt", "desc")
      );

      return businessStacksQuery;
    } catch (error) {
      console.error(
        "[FirebaseBusinessStacks][getBusinessStacksByProductId] Error:",
        error
      );
      return null;
    }
  }

  async createBusinessStack(
    businessStack: BusinessStack
  ): Promise<BusinessStack | null> {
    try {
      const ref = this.getRefCollection();
      const businessStackData = {
        ...businessStack,
        userId: this.auth.currentUser?.uid || "default",
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      };

      const docRef = await addDoc(ref, businessStackData);
      const docData = await getDoc(docRef);
      return docData.data() as BusinessStack;
    } catch (error) {
      console.error(
        "[FirebaseBusinessStacks][createBusinessStack] Error:",
        error
      );
      return null;
    }
  }

  async updateBusinessStack(
    businessStack: BusinessStack
  ): Promise<BusinessStack | null> {
    try {
      if (!businessStack.id) {
        throw new Error("Business stack ID is required for update");
      }

      const ref = this.getRefDocument(businessStack.id);
      await updateDoc(ref, {
        ...businessStack,
        updatedAt: getCurrentUnixTimestamp(),
      });
      const docData = await getDoc(ref);
      return docData.data() as BusinessStack;
    } catch (error) {
      console.error(
        "[FirebaseBusinessStacks][updateBusinessStack] Error:",
        error
      );
      return null;
    }
  }

  async deleteBusinessStack(id: string): Promise<boolean> {
    try {
      const ref = this.getRefDocument(id);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.error(
        "[FirebaseBusinessStacks][deleteBusinessStack] Error:",
        error
      );
      return false;
    }
  }

  async getBusinessStackById(id: string): Promise<BusinessStack | null> {
    try {
      const ref = this.getRefDocument(id);
      const docData = await getDoc(ref);
      if (docData.exists()) {
        return docData.data() as BusinessStack;
      }
      return null;
    } catch (error) {
      console.error(
        "[FirebaseBusinessStacks][getBusinessStackById] Error:",
        error
      );
      return null;
    }
  }
}

export const firebaseBusinessStacks = new FirebaseBusinessStacks();
export default FirebaseBusinessStacks;
