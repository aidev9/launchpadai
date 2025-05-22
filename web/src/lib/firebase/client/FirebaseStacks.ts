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
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import { Phases, TechStack } from "../schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";

const stackConverter: FirestoreDataConverter<TechStack> = {
  toFirestore: (techStack) => techStack,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): TechStack {
    const data = snapshot.data(options) as TechStack;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseStacks {
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
      this.collectionName = "mystacks";
    } catch (error) {
      console.error("[FirebaseStacks][constructor] Error initializing:", error);
      throw error;
    }
  }

  getRefCollection(): CollectionReference<TechStack> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseStacks][getRefCollection] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    return collection(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}`
    ).withConverter(stackConverter);
  }

  getRefDocument(id: string): DocumentReference<TechStack> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseStacks][getRefDocument] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }
    return doc(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}/${id}`
    ).withConverter(stackConverter);
  }

  getTechStacks(): Query<DocumentData, DocumentData> | null {
    try {
      const techStacksQuery = query(
        this.getRefCollection(),
        orderBy("updatedAt", "desc")
      );

      return techStacksQuery;
    } catch (error) {
      console.error("[FirebaseStacks][getTechStacks] Error:", error);
      return null;
    }
  }

  getTechStacksByPhase(
    phases: Phases[]
  ): Query<DocumentData, DocumentData> | null {
    try {
      const techStacksQuery = query(
        this.getRefCollection(),
        where("phases", "array-contains-any", phases),
        orderBy("updatedAt", "desc")
      );

      return techStacksQuery;
    } catch (error) {
      console.error("[FirebaseStacks][getTechStacksByPhase] Error:", error);
      return null;
    }
  }

  async createTechStack(techStack: TechStack): Promise<TechStack | null> {
    try {
      const ref = this.getRefCollection();
      const docRef = await addDoc(ref, {
        ...techStack,
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      });
      const docData = await getDoc(docRef);
      return docData.data() as TechStack;
    } catch (error) {
      console.error("[FirebaseStacks][createTechStack] Error:", error);
      return null;
    }
  }

  async updateTechStack(techStack: TechStack): Promise<TechStack | null> {
    try {
      const ref = this.getRefDocument(techStack.id);
      const docRef = await updateDoc(ref, {
        ...techStack,
        updatedAt: getCurrentUnixTimestamp(),
      });
      const docData = await getDoc(ref);
      return docData.data() as TechStack;
    } catch (error) {
      console.error("[FirebaseStacks][updateTechStack] Error:", error);
      return null;
    }
  }

  async deleteTechStack(id: string): Promise<boolean> {
    try {
      const ref = this.getRefDocument(id);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.error("[FirebaseStacks][deleteTechStack] Error:", error);
      return false;
    }
  }
}

export const firebaseStacks = new FirebaseStacks();
export default FirebaseStacks;
