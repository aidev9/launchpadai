import { 
  getFirestore, 
  doc, 
  getDoc, 
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentReference
} from "firebase/firestore";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import { PromptCredit } from "../schema";

const promptCreditConverter: FirestoreDataConverter<PromptCredit> = {
  toFirestore: (credit) => credit,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): PromptCredit {
    const data = snapshot.data(options) as PromptCredit;
    return {
      ...data,
      userId: snapshot.id,
    };
  },
};

class FirebasePromptCredits {
  db: ReturnType<typeof getFirestore>;
  collectionName: string;

  constructor() {
    try {
      if (!clientDb || !clientApp) {
        throw new Error("Firebase client instances are not initialized");
      }

      this.db = clientDb;
      this.collectionName = "prompt_credits";
    } catch (error) {
      console.error("[FirebasePromptCredits][constructor] Error initializing:", error);
      throw error;
    }
  }

  /**
   * Get reference to the current user's prompt credits document
   */
  getPromptCreditsRef(): DocumentReference<PromptCredit> | null {
    if (!clientAuth || !clientAuth.currentUser) {
      console.log("[FirebasePromptCredits][getPromptCreditsRef] User not authenticated");
      return null;
    }

    const userId = clientAuth.currentUser.uid;
    const path = `${this.collectionName}/${userId}`;
    
    return doc(this.db, path).withConverter(promptCreditConverter);
  }

  /**
   * Get the current user's prompt credits from Firestore
   * @returns Promise with prompt credits data
   */
  async getPromptCredits() {
    try {
      const creditsRef = this.getPromptCreditsRef();
      
      if (!creditsRef) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      console.log(`[FirebasePromptCredits][getPromptCredits] Fetching prompt credits for user`);

      const creditsDoc = await getDoc(creditsRef);

      if (!creditsDoc.exists()) {
        console.log(`[FirebasePromptCredits][getPromptCredits] Prompt credits not found for user`);
        return {
          success: false,
          error: "Prompt credits not found",
        };
      }

      return {
        success: true,
        credits: creditsDoc.data(),
      };
    } catch (error) {
      console.error(`[FirebasePromptCredits][getPromptCredits] Error fetching prompt credits:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}



// Export as a singleton
export const firebasePromptCredits = new FirebasePromptCredits();
export default FirebasePromptCredits;
