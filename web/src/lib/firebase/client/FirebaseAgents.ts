import { getAuth } from "firebase/auth";
import {
  collection,
  DocumentData,
  getFirestore,
  orderBy,
  query,
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
  Query,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import { Agent, Phases } from "../schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";

const agentConverter: FirestoreDataConverter<Agent> = {
  toFirestore: (agent) => agent,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Agent {
    const data = snapshot.data(options) as Agent;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseAgents {
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
      this.collectionName = "myagents";
    } catch (error) {
      console.error("[FirebaseAgents][constructor] Error initializing:", error);
      throw error;
    }
  }

  getRefCollection(): CollectionReference<Agent> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseAgents][getRefCollection] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    return collection(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}`
    ).withConverter(agentConverter);
  }

  getRefDocument(id: string): DocumentReference<Agent> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseAgents][getRefDocument] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }
    return doc(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}/${id}`
    ).withConverter(agentConverter);
  }

  getAgents(productId?: string): Query<DocumentData, DocumentData> | null {
    try {
      if (productId) {
        const agentsQuery = query(
          this.getRefCollection(),
          where("productId", "==", productId),
          orderBy("updatedAt", "desc")
        );
        return agentsQuery;
      } else {
        const agentsQuery = query(
          this.getRefCollection(),
          orderBy("updatedAt", "desc")
        );
        return agentsQuery;
      }
    } catch (error) {
      console.error("[FirebaseAgents][getAgents] Error:", error);
      return null;
    }
  }

  getAgentsByPhase(
    phases: Phases[],
    productId?: string
  ): Query<DocumentData, DocumentData> | null {
    try {
      if (productId) {
        const agentsQuery = query(
          this.getRefCollection(),
          where("productId", "==", productId),
          where("phases", "array-contains-any", phases),
          orderBy("updatedAt", "desc")
        );
        return agentsQuery;
      } else {
        const agentsQuery = query(
          this.getRefCollection(),
          where("phases", "array-contains-any", phases),
          orderBy("updatedAt", "desc")
        );
        return agentsQuery;
      }
    } catch (error) {
      console.error("[FirebaseAgents][getAgentsByPhase] Error:", error);
      return null;
    }
  }

  async createAgent(agent: Agent): Promise<Agent | null> {
    try {
      const ref = this.getRefCollection();
      const docRef = await addDoc(ref, {
        ...agent,
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      });
      const docData = await getDoc(docRef);
      const data = docData.data();
      if (data) {
        // Ensure the ID is set from the document reference
        return {
          ...data,
          id: docRef.id,
        };
      }
      return null;
    } catch (error) {
      console.error("[FirebaseAgents][createAgent] Error:", error);
      return null;
    }
  }

  async updateAgent(agent: Agent): Promise<Agent | null> {
    try {
      const ref = this.getRefDocument(agent.id);
      await updateDoc(ref, {
        ...agent,
        updatedAt: getCurrentUnixTimestamp(),
      });
      const docData = await getDoc(ref);
      return docData.data() as Agent;
    } catch (error) {
      console.error("[FirebaseAgents][updateAgent] Error:", error);
      return null;
    }
  }

  async getAgentById(id: string): Promise<Agent | null> {
    try {
      const ref = this.getRefDocument(id);
      const docData = await getDoc(ref);
      if (docData.exists()) {
        return docData.data();
      }
      return null;
    } catch (error) {
      console.error("[FirebaseAgents][getAgentById] Error:", error);
      return null;
    }
  }

  async deleteAgent(id: string): Promise<boolean> {
    try {
      const ref = this.getRefDocument(id);
      await deleteDoc(ref);
      return true;
    } catch (error) {
      console.error("[FirebaseAgents][deleteAgent] Error:", error);
      return false;
    }
  }
}

export const firebaseAgents = new FirebaseAgents();
export default FirebaseAgents;
