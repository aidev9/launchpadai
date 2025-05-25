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
import { Question, Phases } from "../schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Define a type for creating a question (without id)
type CreateQuestionData = Omit<Question, "id">;

// Define a type for Firestore document data
type FirestoreQuestionData = Omit<Question, "id">;

const questionConverter: FirestoreDataConverter<Question> = {
  toFirestore: (
    question: WithFieldValue<Question>
  ): WithFieldValue<FirestoreQuestionData> => {
    const { id, ...rest } = question;
    return rest;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): Question {
    const data = snapshot.data(options) as Question;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseQA {
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
      this.collectionName = "myquestions";
    } catch (error) {
      console.error("[FirebaseQA][constructor] Error initializing:", error);
      throw error;
    }
  }

  getRefCollection(): CollectionReference<Question> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseQA][getRefCollection] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    return collection(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}`
    ).withConverter(questionConverter);
  }

  getRefDocument(id: string): DocumentReference<Question> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseQA][getRefDocument] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }
    return doc(
      this.db,
      `${this.collectionName}/${userId}/${this.collectionName}/${id}`
    ).withConverter(questionConverter);
  }

  getQuestions(): Query<DocumentData, DocumentData> | null {
    try {
      const questionsQuery = query(
        this.getRefCollection(),
        orderBy("updatedAt", "desc")
      );

      return questionsQuery;
    } catch (error) {
      console.error("[FirebaseQA][getQuestions] Error:", error);
      return null;
    }
  }

  getQuestionsByProduct(
    productId: string
  ): Query<DocumentData, DocumentData> | null {
    if (!productId) {
      return null;
    }

    try {
      const questionsQuery = query(
        this.getRefCollection(),
        where("productId", "==", productId),
        orderBy("updatedAt", "desc")
      );

      return questionsQuery;
    } catch (error) {
      console.error("[FirebaseQA][getQuestionsByProduct] Error:", error);
      return null;
    }
  }

  getQuestionsByPhase(
    phases: Phases[]
  ): Query<DocumentData, DocumentData> | null {
    if (phases.length === 0) {
      return null;
    }

    try {
      const questionsQuery = query(
        this.getRefCollection(),
        where("phases", "array-contains-any", phases),
        orderBy("updatedAt", "desc")
      );

      return questionsQuery;
    } catch (error) {
      console.error("[FirebaseQA][getQuestionsByPhase] Error:", error);
      return null;
    }
  }

  async createQuestion(
    questionData: CreateQuestionData
  ): Promise<Question | null> {
    try {
      const ref = this.getRefCollection();
      const data: FirestoreQuestionData = {
        ...questionData,
        createdAt: getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      };
      const docRef = await addDoc(ref, data);
      const docData = await getDoc(docRef);
      const savedData = docData.data();
      if (!savedData) return null;
      return { ...savedData, id: docRef.id };
    } catch (error) {
      console.error("[FirebaseQA][createQuestion] Error:", error);
      return null;
    }
  }

  /**
   * Create multiple questions in batch (alternative interface)
   * @param questionsData Array of question data objects with productId included
   * @returns Promise with success status and count of created questions
   */
  async bulkCreateQuestions(
    questionsData: Array<
      Omit<Question, "id" | "createdAt" | "updatedAt"> & { productId: string }
    >
  ): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      if (!this.auth.currentUser) {
        console.log("[FirebaseQA][bulkCreateQuestions] No authenticated user");
        return {
          success: false,
          count: 0,
          error: "User not authenticated",
        };
      }

      if (!questionsData || questionsData.length === 0) {
        console.log(
          "[FirebaseQA][bulkCreateQuestions] No questions data provided"
        );
        return {
          success: false,
          count: 0,
          error: "Questions data is required",
        };
      }

      // Get the reference to the questions collection
      const questionsRef = this.getRefCollection();

      // Create a batch
      const batch = writeBatch(this.db);
      let count = 0;

      // Current timestamp
      const timestamp = getCurrentUnixTimestamp();

      // Add each question to the batch
      for (const questionData of questionsData) {
        try {
          // Generate a unique document ID and get reference
          const questionRef = doc(questionsRef);

          // Create a complete question with ID field to satisfy the converter
          const question: Question = {
            id: questionRef.id, // Add id field to work with the converter
            ...questionData,
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          // Set in batch using the converter
          batch.set(questionRef, question);
          count++;
        } catch (error) {
          console.error(
            "[FirebaseQA][bulkCreateQuestions] Error adding question to batch:",
            error
          );
          // Continue with other questions
        }
      }

      if (count === 0) {
        return {
          success: false,
          count: 0,
          error: "Failed to prepare any questions for creation",
        };
      }

      // Commit the batch
      await batch.commit();

      return {
        success: true,
        count,
      };
    } catch (error) {
      console.error("[FirebaseQA][bulkCreateQuestions] Error:", error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create multiple questions in batch for a specific product
   * @param productId ID of the product to create questions for
   * @param questionsData Array of question data objects
   * @returns Promise with success status and count of created questions
   */
  async createBulkQuestions(
    productId: string,
    questionsData: Array<
      Omit<Question, "id" | "createdAt" | "updatedAt" | "productId">
    >
  ): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      if (!this.auth.currentUser) {
        console.log("[FirebaseQA][createBulkQuestions] No authenticated user");
        return {
          success: false,
          count: 0,
          error: "User not authenticated",
        };
      }

      if (!productId) {
        console.log("[FirebaseQA][createBulkQuestions] No product ID provided");
        return {
          success: false,
          count: 0,
          error: "Product ID is required",
        };
      }

      if (!questionsData || questionsData.length === 0) {
        console.log(
          "[FirebaseQA][createBulkQuestions] No questions data provided"
        );
        return {
          success: false,
          count: 0,
          error: "Questions data is required",
        };
      }

      // Get the reference to the questions collection
      const questionsRef = this.getRefCollection();

      // Create a batch
      const batch = writeBatch(this.db);
      let count = 0;

      // Current timestamp
      const timestamp = getCurrentUnixTimestamp();

      // Add each question to the batch
      for (const questionData of questionsData) {
        try {
          // Generate a unique document ID and get reference
          const questionRef = doc(questionsRef);

          // Create a complete question with ID field to satisfy the converter
          const question: Question = {
            id: questionRef.id, // Add id field to work with the converter
            ...(questionData as any),
            productId, // Add productId
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          // Set in batch using the converter
          batch.set(questionRef, question);
          count++;
        } catch (error) {
          console.error(
            "[FirebaseQA][createBulkQuestions] Error adding question to batch:",
            error
          );
          // Continue with other questions
        }
      }

      if (count === 0) {
        return {
          success: false,
          count: 0,
          error: "Failed to prepare any questions for creation",
        };
      }

      // Commit the batch
      await batch.commit();

      return {
        success: true,
        count,
      };
    } catch (error) {
      console.error("[FirebaseQA][createBulkQuestions] Error:", error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async updateQuestion(
    id: string,
    questionData: Partial<CreateQuestionData>
  ): Promise<Question | null> {
    try {
      const ref = this.getRefDocument(id);
      const data: Partial<FirestoreQuestionData> = {
        ...questionData,
        updatedAt: getCurrentUnixTimestamp(),
      };
      await updateDoc(ref, data);
      const docData = await getDoc(ref);
      const savedData = docData.data();
      if (!savedData) return null;
      return savedData;
    } catch (error) {
      console.error("[FirebaseQA][updateQuestion] Error:", error);
      return null;
    }
  }

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      console.log(
        `[FirebaseQA][deleteQuestion] Attempting to delete question with ID: ${id}`
      );
      const ref = this.getRefDocument(id);
      console.log(
        `[FirebaseQA][deleteQuestion] Document reference path: ${ref.path}`
      );
      await deleteDoc(ref);
      console.log(
        `[FirebaseQA][deleteQuestion] Successfully deleted question with ID: ${id}`
      );
      return true;
    } catch (error) {
      console.error(
        `[FirebaseQA][deleteQuestion] Error deleting question with ID ${id}:`,
        error
      );
      return false;
    }
  }

  async deleteQuestions(ids: string[]): Promise<boolean> {
    try {
      const batch = writeBatch(this.db);

      // Add all deletes to a batch for atomicity
      ids.forEach((id) => {
        const ref = this.getRefDocument(id);
        batch.delete(ref);
      });

      // Commit the batch
      await batch.commit();
      return true;
    } catch (error) {
      console.error(
        `[FirebaseQA][deleteQuestions] Error deleting ${ids.length} questions:`,
        error
      );
      return false;
    }
  }
}

// Export as a singleton
export const firebaseQA = new FirebaseQA();
export default FirebaseQA;
