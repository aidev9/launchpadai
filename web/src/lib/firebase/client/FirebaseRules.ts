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

// Rules Stack Schema - matches the one from atoms/product.ts
export interface Rules {
  id?: string;
  productId?: string;
  userId?: string;
  designPrinciples: string[];
  codingStandards: string[];
  brandGuidelines: string[];
  accessibilityRequirements: string[];
  performanceRequirements?: string[];
  complianceRules?: string[];
  qualityAssuranceProcesses?: string[];
  createdAt?: number;
  updatedAt?: number;
}

const rulesConverter: FirestoreDataConverter<Rules> = {
  toFirestore: (rules) => rules,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Rules {
    const data = snapshot.data(options) as Rules;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseRules {
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
      this.collectionName = "myrulesstacks";
    } catch (error) {
      console.error("[FirebaseRules][constructor] Error initializing:", error);
      throw error;
    }
  }

  getRefCollection(): CollectionReference<Rules> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseRules][getRefCollection] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    return collection(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}`
    ).withConverter(rulesConverter);
  }

  getRefDocument(id: string): DocumentReference<Rules> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseRules][getRefDocument] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }
    return doc(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}/${id}`
    ).withConverter(rulesConverter);
  }

  getRulesStacks(): Query<DocumentData, DocumentData> | null {
    try {
      const rulesQuery = query(
        this.getRefCollection(),
        orderBy("updatedAt", "desc")
      );

      return rulesQuery;
    } catch (error) {
      console.error("[FirebaseRules][getRulesStacks] Error:", error);
      return null;
    }
  }

  getRulesStacksByProductId(
    productId: string
  ): Query<DocumentData, DocumentData> | null {
    try {
      const rulesQuery = query(
        this.getRefCollection(),
        where("productId", "==", productId),
        orderBy("updatedAt", "desc")
      );

      return rulesQuery;
    } catch (error) {
      console.error("[FirebaseRules][getRulesStacksByProductId] Error:", error);
      return null;
    }
  }

  async createRulesStack(rules: Rules): Promise<Rules | null> {
    try {
      const ref = this.getRefCollection();
      const rulesData = {
        ...rules,
        userId: this.auth.currentUser?.uid || "default",
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      };

      const docRef = await addDoc(ref, rulesData);
      const docData = await getDoc(docRef);
      return docData.data() as Rules;
    } catch (error) {
      console.error("[FirebaseRules][createRulesStack] Error:", error);
      return null;
    }
  }

  async updateRulesStack(rules: Rules): Promise<Rules | null> {
    try {
      if (!rules.id) {
        throw new Error("Rules stack ID is required for update");
      }

      const ref = this.getRefDocument(rules.id);
      await updateDoc(ref, {
        ...rules,
        updatedAt: getCurrentUnixTimestamp(),
      });
      const docData = await getDoc(ref);
      return docData.data() as Rules;
    } catch (error) {
      console.error("[FirebaseRules][updateRulesStack] Error:", error);
      return null;
    }
  }

  async deleteRulesStack(id: string): Promise<boolean> {
    try {
      const ref = this.getRefDocument(id);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.error("[FirebaseRules][deleteRulesStack] Error:", error);
      return false;
    }
  }

  async getRulesStackById(id: string): Promise<Rules | null> {
    try {
      const ref = this.getRefDocument(id);
      const docData = await getDoc(ref);
      if (docData.exists()) {
        return docData.data() as Rules;
      }
      return null;
    } catch (error) {
      console.error("[FirebaseRules][getRulesStackById] Error:", error);
      return null;
    }
  }

  async upsertRulesStack(rules: Rules): Promise<Rules | null> {
    try {
      if (rules.id) {
        // Update existing
        return await this.updateRulesStack(rules);
      } else {
        // Create new
        return await this.createRulesStack(rules);
      }
    } catch (error) {
      console.error("[FirebaseRules][upsertRulesStack] Error:", error);
      return null;
    }
  }
}

export const firebaseRules = new FirebaseRules();
