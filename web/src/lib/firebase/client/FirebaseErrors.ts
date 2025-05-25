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
import { ErrorLog, ErrorLogInput } from "../schema";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Define a type for creating an error log (without id and createdAt)
type CreateErrorLogData = Omit<ErrorLog, "id" | "createdAt">;

// Define the Firestore data structure (without the id field)
type FirestoreErrorLogData = Omit<ErrorLog, "id">;

const errorLogConverter: FirestoreDataConverter<ErrorLog> = {
  toFirestore: (
    errorLog: WithFieldValue<ErrorLog>
  ): WithFieldValue<FirestoreErrorLogData> => {
    const { id, ...rest } = errorLog;
    return rest;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): ErrorLog {
    const data = snapshot.data(options) as FirestoreErrorLogData;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseErrors {
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
      this.collectionName = "errors";
    } catch (error) {
      console.error("[FirebaseErrors][constructor] Error initializing:", error);
      throw error;
    }
  }

  getRefCollection(userId?: string): CollectionReference<ErrorLog> {
    // Use user-specific subcollection: errors/{userId}/errors
    // If no userId provided, try to get from current auth user
    const currentUserId = userId || this.auth.currentUser?.uid;

    if (!currentUserId) {
      // Fallback to global collection if no user is authenticated
      return collection(this.db, this.collectionName).withConverter(
        errorLogConverter
      );
    }

    return collection(
      this.db,
      this.collectionName,
      currentUserId,
      "errors"
    ).withConverter(errorLogConverter);
  }

  getRefDocument(id: string, userId?: string): DocumentReference<ErrorLog> {
    return doc(this.getRefCollection(userId), id);
  }

  /**
   * Get all errors for current user
   */
  getErrors(userId?: string): Query<DocumentData, DocumentData> | null {
    try {
      const errorsQuery = query(
        this.getRefCollection(userId),
        orderBy("createdAt", "desc")
      );

      return errorsQuery;
    } catch (error) {
      console.error("[FirebaseErrors][getErrors] Error:", error);
      return null;
    }
  }

  /**
   * Get errors by user ID (now redundant since we use user-specific collections)
   */
  getErrorsByUser(userId: string): Query<DocumentData, DocumentData> | null {
    if (!userId) {
      return null;
    }

    try {
      // Since we're now using user-specific subcollections, this is the same as getErrors(userId)
      return this.getErrors(userId);
    } catch (error) {
      console.error("[FirebaseErrors][getErrorsByUser] Error:", error);
      return null;
    }
  }

  /**
   * Get errors by severity for current user
   */
  getErrorsBySeverity(
    severity: "low" | "medium" | "high" | "critical",
    userId?: string
  ): Query<DocumentData, DocumentData> | null {
    try {
      const errorsQuery = query(
        this.getRefCollection(userId),
        where("severity", "==", severity),
        orderBy("createdAt", "desc")
      );

      return errorsQuery;
    } catch (error) {
      console.error("[FirebaseErrors][getErrorsBySeverity] Error:", error);
      return null;
    }
  }

  /**
   * Get unresolved errors for current user
   */
  getUnresolvedErrors(
    userId?: string
  ): Query<DocumentData, DocumentData> | null {
    try {
      const errorsQuery = query(
        this.getRefCollection(userId),
        where("resolved", "==", false),
        orderBy("createdAt", "desc")
      );

      return errorsQuery;
    } catch (error) {
      console.error("[FirebaseErrors][getUnresolvedErrors] Error:", error);
      return null;
    }
  }

  /**
   * Removes undefined values from an object to prevent Firestore errors
   */
  private removeUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj
        .map((item) => this.removeUndefinedValues(item))
        .filter((item) => item !== undefined);
    }

    if (typeof obj === "object") {
      const cleaned: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedValues(value);
        }
      }
      return cleaned;
    }

    return obj;
  }

  /**
   * Create a new error log
   */
  async createErrorLog(
    errorData: ErrorLogInput
  ): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const userId = this.auth.currentUser?.uid;

      if (!userId) {
        console.warn(
          "[FirebaseErrors][createErrorLog] No authenticated user, skipping error log"
        );
        return {
          success: false,
          error: "No authenticated user",
        };
      }

      const ref = this.getRefCollection(userId);

      const data: FirestoreErrorLogData = {
        ...errorData,
        userId,
        createdAt: getCurrentUnixTimestamp(),
        resolved: false,
      };

      // Clean the data to remove any undefined values
      const cleanedData = this.removeUndefinedValues(data);

      const docRef = await addDoc(ref, cleanedData);

      return {
        success: true,
        id: docRef.id,
      };
    } catch (error) {
      console.error("[FirebaseErrors][createErrorLog] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create error log",
      };
    }
  }

  /**
   * Update an existing error log (for marking as resolved, etc.)
   */
  async updateErrorLog(
    id: string,
    errorData: Partial<CreateErrorLogData>,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const ref = this.getRefDocument(id, userId);
      await updateDoc(ref, errorData);
      return { success: true };
    } catch (error) {
      console.error("[FirebaseErrors][updateErrorLog] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update error log",
      };
    }
  }

  /**
   * Mark an error as resolved
   */
  async markErrorAsResolved(
    id: string,
    resolvedBy?: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const ref = this.getRefDocument(id, userId);
      const updateData = {
        resolved: true,
        resolvedAt: getCurrentUnixTimestamp(),
        ...(resolvedBy && { resolvedBy }),
      };

      await updateDoc(ref, updateData);
      return { success: true };
    } catch (error) {
      console.error("[FirebaseErrors][markErrorAsResolved] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to mark error as resolved",
      };
    }
  }

  /**
   * Delete a single error log
   */
  async deleteErrorLog(
    id: string,
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const ref = this.getRefDocument(id, userId);
      await deleteDoc(ref);
      return { success: true };
    } catch (error) {
      console.error("[FirebaseErrors][deleteErrorLog] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete error log",
      };
    }
  }

  /**
   * Get a single error log by ID
   */
  async getErrorLog(
    id: string,
    userId?: string
  ): Promise<{ success: boolean; errorLog?: ErrorLog; error?: string }> {
    try {
      const ref = this.getRefDocument(id, userId);
      const docData = await getDoc(ref);
      const data = docData.data();

      if (!data) {
        return { success: false, error: "Error log not found" };
      }

      return { success: true, errorLog: data };
    } catch (error) {
      console.error("[FirebaseErrors][getErrorLog] Error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get error log",
      };
    }
  }

  /**
   * Delete multiple error logs by ID for a specific user
   */
  async deleteMultipleErrorLogs(
    ids: string[],
    userId?: string
  ): Promise<{
    success: boolean;
    deletedCount: number;
    error?: string;
  }> {
    try {
      if (!ids || ids.length === 0) {
        return {
          success: false,
          error: "No error log IDs provided",
          deletedCount: 0,
        };
      }

      // Limit the number of error logs that can be deleted at once
      if (ids.length > 100) {
        return {
          success: false,
          error: "Cannot delete more than 100 error logs at once",
          deletedCount: 0,
        };
      }

      // Create a batch write
      const batch = writeBatch(this.db);
      let deletedCount = 0;

      // Add each error log to the batch delete
      for (const id of ids) {
        const errorRef = this.getRefDocument(id, userId);
        const errorDoc = await getDoc(errorRef);

        if (errorDoc.exists()) {
          batch.delete(errorRef);
          deletedCount++;
        }
      }

      if (deletedCount === 0) {
        return {
          success: false,
          error: "No error logs found to delete",
          deletedCount: 0,
        };
      }

      // Commit the batch
      await batch.commit();

      return {
        success: true,
        deletedCount,
      };
    } catch (error) {
      console.error(
        "[FirebaseErrors][deleteMultipleErrorLogs] Error deleting multiple error logs:",
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete error logs",
        deletedCount: 0,
      };
    }
  }
}

// Export as a singleton
export const firebaseErrors = new FirebaseErrors();
export default FirebaseErrors;
