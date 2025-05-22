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
import { Prompt } from "../schema";

const promptConverter: FirestoreDataConverter<Prompt> = {
  toFirestore: (prompt) => prompt,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Prompt {
    const data = snapshot.data(options) as Prompt;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebasePrompts {
  auth: ReturnType<typeof getAuth>;
  db: ReturnType<typeof getFirestore>;
  storage: ReturnType<typeof getStorage>;
  userCollectionName: string;
  globalCollectionName: string;

  constructor() {
    try {
      if (!clientAuth || !clientDb || !clientApp) {
        throw new Error("Firebase client instances are not initialized");
      }

      this.auth = clientAuth;
      this.db = clientDb;
      this.storage = getStorage(clientApp);
      this.userCollectionName = "myprompts";
      this.globalCollectionName = "prompts";
    } catch (error) {
      console.error(
        "[FirebasePrompts][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  getUserPromptsCollection(): CollectionReference<Prompt> {
    if (!this.auth || !this.auth.currentUser) {
      console.log(
        "[FirebasePrompts][getUserPromptsCollection] User not authenticated"
      );
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    return collection(
      this.db,
      `${this.userCollectionName}/${userId}/${this.userCollectionName}`
    ).withConverter(promptConverter);
  }

  getGlobalPromptsCollection(): CollectionReference<Prompt> {
    return collection(this.db, this.globalCollectionName).withConverter(
      promptConverter
    );
  }

  getUserPrompts(): Query<DocumentData, DocumentData> | null {
    try {
      const promptsQuery = query(
        this.getUserPromptsCollection(),
        orderBy("createdAt", "desc")
      );

      return promptsQuery;
    } catch (error) {
      console.error("[FirebasePrompts][getUserPrompts] Error:", error);
      return null;
    }
  }

  getUserPromptsByPhase(
    phases: string[]
  ): Query<DocumentData, DocumentData> | null {
    if (phases.length === 0) {
      return this.getUserPrompts();
    }

    try {
      const promptsQuery = query(
        this.getUserPromptsCollection(),
        where("phaseTags", "array-contains-any", phases),
        orderBy("createdAt", "desc")
      );

      return promptsQuery;
    } catch (error) {
      console.error("[FirebasePrompts][getUserPromptsByPhase] Error:", error);
      return null;
    }
  }

  getAllPrompts(): Query<DocumentData, DocumentData> | null {
    try {
      const promptsQuery = query(
        this.getGlobalPromptsCollection(),
        orderBy("createdAt", "desc")
      );

      return promptsQuery;
    } catch (error) {
      console.error("[FirebasePrompts][getAllPrompts] Error:", error);
      return null;
    }
  }

  getPromptsByPhase(
    phases: string[]
  ): Query<DocumentData, DocumentData> | null {
    if (phases.length === 0) {
      return this.getAllPrompts();
    }

    try {
      const promptsQuery = query(
        this.getGlobalPromptsCollection(),
        where("phaseTags", "array-contains-any", phases),
        orderBy("createdAt", "desc")
      );

      return promptsQuery;
    } catch (error) {
      console.error("[FirebasePrompts][getPromptsByPhase] Error:", error);
      return null;
    }
  }
}

// Export as a singleton
export const firebasePrompts = new FirebasePrompts();
export default FirebasePrompts;
