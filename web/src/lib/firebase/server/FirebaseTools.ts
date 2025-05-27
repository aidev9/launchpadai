import {
  DocumentData,
  Query,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  CollectionReference,
} from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
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
  fromFirestore(snapshot: QueryDocumentSnapshot): ToolConfiguration {
    const data = snapshot.data() as ToolConfiguration;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseToolsServer {
  db: typeof adminDb;
  collectionName: string;

  constructor() {
    try {
      this.db = adminDb;
      this.collectionName = "toolconfigs";

      console.log(
        "[FirebaseToolsServer] Initialized with database:",
        process.env.FIRESTORE_DATABASE_NAME || "default"
      );
    } catch (error) {
      console.error(
        "[FirebaseToolsServer][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  getRefCollection(userId: string): CollectionReference<ToolConfiguration> {
    if (!userId || userId.trim() === "") {
      throw new Error("User ID is required and cannot be empty");
    }

    const path = `users/${userId}/${this.collectionName}`;
    console.log(
      `[FirebaseToolsServer] Creating collection reference with path: ${path}, userId: ${userId}`
    );

    return this.db.collection(path).withConverter(toolConfigConverter);
  }

  getToolConfigurations(
    userId: string
  ): Query<DocumentData, DocumentData> | null {
    try {
      const toolConfigsQuery = this.getRefCollection(userId).orderBy(
        "updatedAt",
        "desc"
      );

      return toolConfigsQuery;
    } catch (error) {
      console.error(
        "[FirebaseToolsServer][getToolConfigurations] Error:",
        error
      );
      return null;
    }
  }

  /**
   * Save or update a tool configuration
   * @param userId User ID
   * @param toolConfig Tool configuration data to save
   * @returns Promise with success status and tool configuration data
   */
  async saveToolConfiguration(
    userId: string,
    toolConfig: {
      toolId: string;
      isEnabled: boolean;
      apiKey?: string;
      config?: Record<string, string>;
      testStatus?: "success" | "error" | "pending" | "never";
      testMessage?: string;
      lastTested?: number;
    }
  ) {
    try {
      // Use toolId as the document ID for easy retrieval
      const toolConfigRef = this.getRefCollection(userId).doc(
        toolConfig.toolId
      );

      // Check if configuration already exists
      const existingDoc = await toolConfigRef.get();
      const now = getCurrentUnixTimestamp();

      // Preserve existing test data if not provided in the update
      const existingData = existingDoc.exists ? existingDoc.data() : null;

      const toolConfigData: ToolConfiguration = {
        id: toolConfig.toolId,
        toolId: toolConfig.toolId,
        isEnabled: toolConfig.isEnabled,
        apiKey: toolConfig.apiKey,
        config: toolConfig.config,
        // Preserve existing test data if not explicitly provided
        testStatus:
          toolConfig.testStatus || existingData?.testStatus || "never",
        testMessage: toolConfig.testMessage || existingData?.testMessage,
        lastTested: toolConfig.lastTested || existingData?.lastTested,
        tested: toolConfig.testStatus
          ? toolConfig.testStatus === "success" ||
            toolConfig.testStatus === "error"
          : existingData?.tested || false,
        createdAt: existingData?.createdAt || now,
        updatedAt: now,
        userId: userId,
      };

      // Filter out undefined values to avoid Firestore errors
      const cleanedData = Object.fromEntries(
        Object.entries(toolConfigData).filter(
          ([_, value]) => value !== undefined
        )
      ) as ToolConfiguration;

      console.log(
        `[FirebaseToolsServer][saveToolConfiguration] Saving configuration for tool: ${toolConfig.toolId}`,
        {
          ...cleanedData,
          tested: cleanedData.tested,
          testStatus: cleanedData.testStatus,
        }
      );

      await toolConfigRef.set(cleanedData);

      return {
        success: true,
        data: toolConfigData,
      };
    } catch (error) {
      console.error(
        "[FirebaseToolsServer][saveToolConfiguration] Error saving tool configuration:",
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
   * @param userId User ID
   * @param toolId Tool ID to retrieve configuration for
   * @returns Promise with success status and tool configuration data
   */
  async getToolConfigurationById(userId: string, toolId: string) {
    try {
      const toolConfigRef = this.getRefCollection(userId).doc(toolId);
      const toolConfigDoc = await toolConfigRef.get();

      if (!toolConfigDoc.exists) {
        return {
          success: false,
          error: "Tool configuration not found",
        };
      }

      const toolConfigData = toolConfigDoc.data() as ToolConfiguration;

      return {
        success: true,
        data: toolConfigData,
      };
    } catch (error) {
      console.error(
        "[FirebaseToolsServer][getToolConfigurationById] Error getting tool configuration:",
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
   * @param userId User ID
   * @param toolId Tool ID to delete configuration for
   * @returns Promise with success status
   */
  async deleteToolConfiguration(userId: string, toolId: string) {
    try {
      const toolConfigRef = this.getRefCollection(userId).doc(toolId);

      console.log(
        `[FirebaseToolsServer][deleteToolConfiguration] Deleting configuration for tool: ${toolId}`
      );

      await toolConfigRef.delete();

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        "[FirebaseToolsServer][deleteToolConfiguration] Error deleting tool configuration:",
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
   * @param userId User ID
   * @param toolId Tool ID to update test result for
   * @param testResult Test result data
   * @returns Promise with success status
   */
  async updateTestResult(
    userId: string,
    toolId: string,
    testResult: {
      testStatus: "success" | "error" | "pending" | "never";
      testMessage?: string;
      lastTested?: number;
    }
  ) {
    try {
      const toolConfigRef = this.getRefCollection(userId).doc(toolId);
      const existingDoc = await toolConfigRef.get();

      if (!existingDoc.exists) {
        console.warn(
          `[FirebaseToolsServer][updateTestResult] Tool configuration not found for tool: ${toolId}`
        );
        return {
          success: false,
          error: "Tool configuration not found",
        };
      }

      const existingData = existingDoc.data() as ToolConfiguration;
      const now = getCurrentUnixTimestamp();

      const updatedData: Partial<ToolConfiguration> = {
        testStatus: testResult.testStatus,
        testMessage: testResult.testMessage,
        lastTested: testResult.lastTested,
        tested: true,
        updatedAt: now,
      };

      // Filter out undefined values to avoid Firestore errors
      const cleanedUpdatedData = Object.fromEntries(
        Object.entries(updatedData).filter(([_, value]) => value !== undefined)
      );

      console.log(
        `[FirebaseToolsServer][updateTestResult] Updating test result for tool: ${toolId}`,
        {
          testStatus: testResult.testStatus,
          testMessage: testResult.testMessage,
          lastTested: testResult.lastTested,
          tested: true,
        }
      );

      await toolConfigRef.set({ ...existingData, ...cleanedUpdatedData });

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        "[FirebaseToolsServer][updateTestResult] Error updating test result:",
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Export a singleton instance
export const firebaseToolsServer = new FirebaseToolsServer();
