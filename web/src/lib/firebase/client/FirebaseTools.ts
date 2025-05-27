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
  deleteDoc,
  doc,
  getDoc,
  writeBatch,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import { getCurrentUnixTimestamp } from "@/utils/constants";

export interface ToolConfiguration {
  id: string;
  toolId: string;
  isEnabled: boolean;
  apiKey?: string;
  config?: Record<string, string>;
  testStatus?: "success" | "error" | "pending" | "never";
  testMessage?: string;
  lastTested?: number;
  tested?: boolean;
  createdAt: number;
  updatedAt: number;
  userId: string;
}

const toolConfigConverter: FirestoreDataConverter<ToolConfiguration> = {
  toFirestore: (toolConfig) => toolConfig,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): ToolConfiguration {
    const data = snapshot.data(options) as ToolConfiguration;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseTools {
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

      console.log(
        "[FirebaseTools] Using database:",
        process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_NAME || "default"
      );

      this.storage = getStorage(clientApp);
      this.collectionName = "toolconfigs";
    } catch (error) {
      console.error("[FirebaseTools][constructor] Error initializing:", error);
      throw error;
    }
  }

  getRefCollection(): CollectionReference<ToolConfiguration> {
    if (!this.auth || !this.auth.currentUser) {
      console.log("[FirebaseTools][getRefCollection] User not authenticated");
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      console.log(
        "[FirebaseTools][getRefCollection] No user ID, using default"
      );
      userId = "default";
    }

    const path = `${this.collectionName}/${userId}/${this.collectionName}`;
    console.log(
      `[FirebaseTools] Creating collection reference with path: ${path}, userId: ${userId}`
    );

    return collection(this.db, path).withConverter(toolConfigConverter);
  }

  getToolConfigurations(): Query<DocumentData, DocumentData> | null {
    try {
      const toolConfigsQuery = query(
        this.getRefCollection(),
        orderBy("updatedAt", "desc")
      );

      return toolConfigsQuery;
    } catch (error) {
      console.error("[FirebaseTools][getToolConfigurations] Error:", error);
      return null;
    }
  }

  /**
   * Save or update a tool configuration
   * @param toolConfig Tool configuration data to save
   * @returns Promise with success status and tool configuration data
   */
  async saveToolConfiguration(toolConfig: {
    toolId: string;
    isEnabled: boolean;
    apiKey?: string;
    config?: Record<string, string>;
    testStatus?: "success" | "error" | "pending" | "never";
    testMessage?: string;
    lastTested?: number;
  }) {
    try {
      if (!this.auth.currentUser) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      // Use toolId as the document ID for easy retrieval
      const toolConfigRef = doc(this.getRefCollection(), toolConfig.toolId);

      // Check if configuration already exists
      const existingDoc = await getDoc(toolConfigRef);
      const now = getCurrentUnixTimestamp();

      const toolConfigData: ToolConfiguration = {
        id: toolConfig.toolId,
        toolId: toolConfig.toolId,
        isEnabled: toolConfig.isEnabled,
        apiKey: toolConfig.apiKey,
        config: toolConfig.config,
        testStatus: toolConfig.testStatus || "never",
        testMessage: toolConfig.testMessage,
        lastTested: toolConfig.lastTested,
        createdAt: existingDoc.exists()
          ? existingDoc.data()?.createdAt || now
          : now,
        updatedAt: now,
        userId: this.auth.currentUser.uid,
      };

      console.log(
        `[FirebaseTools][saveToolConfiguration] Saving configuration for tool: ${toolConfig.toolId}`
      );

      await setDoc(toolConfigRef, toolConfigData);

      return {
        success: true,
        data: toolConfigData,
      };
    } catch (error) {
      console.error(
        "[FirebaseTools][saveToolConfiguration] Error saving tool configuration:",
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get a tool configuration by tool ID
   * @param toolId Tool ID to retrieve configuration for
   * @returns Promise with success status and tool configuration data
   */
  async getToolConfigurationById(toolId: string) {
    try {
      if (!this.auth.currentUser) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      const toolConfigRef = doc(this.getRefCollection(), toolId);
      const toolConfigDoc = await getDoc(toolConfigRef);

      if (!toolConfigDoc.exists()) {
        return {
          success: false,
          error: "Tool configuration not found",
        };
      }

      return {
        success: true,
        data: toolConfigDoc.data(),
      };
    } catch (error) {
      console.error(
        `[FirebaseTools][getToolConfigurationById] Error getting tool configuration ${toolId}:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete a tool configuration
   * @param toolId Tool ID to delete configuration for
   * @returns Promise with success status
   */
  async deleteToolConfiguration(toolId: string) {
    try {
      if (!this.auth.currentUser) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      const toolConfigRef = doc(this.getRefCollection(), toolId);

      // Check if configuration exists first
      const toolConfigDoc = await getDoc(toolConfigRef);
      if (!toolConfigDoc.exists()) {
        return {
          success: false,
          error: "Tool configuration not found",
        };
      }

      // Delete the configuration
      await deleteDoc(toolConfigRef);

      return {
        success: true,
        id: toolId,
      };
    } catch (error) {
      console.error(
        `[FirebaseTools][deleteToolConfiguration] Error deleting tool configuration ${toolId}:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Update test result for a tool configuration
   * @param toolId Tool ID to update test result for
   * @param testResult Test result data
   * @returns Promise with success status
   */
  async updateTestResult(
    toolId: string,
    testResult: {
      testStatus: "success" | "error" | "pending" | "never";
      testMessage?: string;
      lastTested?: number;
    }
  ) {
    try {
      if (!this.auth.currentUser) {
        return {
          success: false,
          error: "User not authenticated",
        };
      }

      const toolConfigRef = doc(this.getRefCollection(), toolId);

      // Check if configuration exists first
      const toolConfigDoc = await getDoc(toolConfigRef);
      if (!toolConfigDoc.exists()) {
        return {
          success: false,
          error: "Tool configuration not found",
        };
      }

      const updateData = {
        testStatus: testResult.testStatus,
        testMessage: testResult.testMessage,
        lastTested: testResult.lastTested || getCurrentUnixTimestamp(),
        updatedAt: getCurrentUnixTimestamp(),
      };

      await updateDoc(toolConfigRef, updateData);

      return {
        success: true,
        data: {
          ...toolConfigDoc.data(),
          ...updateData,
        },
      };
    } catch (error) {
      console.error(
        `[FirebaseTools][updateTestResult] Error updating test result for tool ${toolId}:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Export as a singleton
export const firebaseTools = new FirebaseTools();
export default FirebaseTools;
