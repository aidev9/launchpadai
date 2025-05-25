import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  CollectionReference,
} from "firebase/firestore";
import { clientApp, clientAuth, clientDb } from "@/lib/firebase/client";
import {
  McpEndpointConfig,
  McpEndpointConfigInput,
} from "../schema/mcp-endpoints";
import { getCurrentUnixTimestamp } from "@/utils/constants";

// Converter for McpEndpointConfig
const mcpEndpointConfigConverter: FirestoreDataConverter<McpEndpointConfig> = {
  toFirestore: (endpointConfig) => endpointConfig,
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): McpEndpointConfig {
    const data = snapshot.data(options) as McpEndpointConfig;
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

class FirebaseMcpEndpoints {
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

      // Add debugging to log the database name
      console.log(
        "[FirebaseMcpEndpoints] Using database:",
        process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_NAME || "default"
      );

      this.storage = getStorage(clientApp);
      this.collectionName = "mcpendpoints";
    } catch (error) {
      console.error(
        "[FirebaseMcpEndpoints][constructor] Error initializing:",
        error
      );
      throw error;
    }
  }

  /**
   * Get the path for MCP endpoint configurations
   * @param userId User ID
   * @returns Path string
   */
  getMcpEndpointConfigPath(userId: string): string {
    return `${this.collectionName}/${userId}/${this.collectionName}`;
  }

  /**
   * Get the document path for a specific MCP endpoint
   * @param userId User ID
   * @param endpointId Endpoint ID
   * @returns Document path string
   */
  getMcpEndpointConfigDoc(userId: string, endpointId: string): string {
    return `${this.getMcpEndpointConfigPath(userId)}/${endpointId}`;
  }

  /**
   * Get reference to the MCP endpoints collection
   * @returns Collection reference with converter
   */
  getRefCollection(): CollectionReference<McpEndpointConfig> {
    if (!this.auth || !this.auth.currentUser) {
      console.log(
        "[FirebaseMcpEndpoints][getRefCollection] User not authenticated"
      );
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    // Add more detailed path debugging
    const path = this.getMcpEndpointConfigPath(userId);
    console.log(
      `[FirebaseMcpEndpoints] Creating collection reference with path: ${path}`
    );
    console.log(
      `[FirebaseMcpEndpoints] Using database:`,
      process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_NAME || "default"
    );

    return collection(this.db, path).withConverter(mcpEndpointConfigConverter);
  }

  /**
   * Create a new MCP endpoint configuration
   * @param data Endpoint configuration input data
   * @param collectionId Collection ID
   * @returns Promise with success status and endpoint config
   */
  async createMcpEndpointConfig(
    data: McpEndpointConfigInput,
    collectionId: string
  ) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      // Create a new document reference
      const endpointsCollection = this.getRefCollection();
      const endpointRef = doc(endpointsCollection);

      const timestamp = getCurrentUnixTimestamp();
      // Prepare auth credentials - ensure undefined values are replaced with empty string
      const authCredentials = {
        apiKey:
          data.authType === "api_key"
            ? data.authCredentials.apiKey || ""
            : undefined,
        bearerToken:
          data.authType === "bearer_token"
            ? data.authCredentials.bearerToken || ""
            : undefined,
      };

      const endpointConfig: McpEndpointConfig = {
        id: endpointRef.id,
        userId,
        collectionId,
        name: data.name,
        description: data.description,
        isEnabled: data.isEnabled,
        authType: data.authType,
        authCredentials: authCredentials,
        accessControl: data.accessControl,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Convert the endpointConfig to a plain object and remove any undefined values
      // Firestore doesn't handle undefined values well
      const endpointConfigForFirestore = JSON.parse(
        JSON.stringify(endpointConfig)
      );

      await setDoc(endpointRef, endpointConfigForFirestore);

      return {
        success: true,
        id: endpointRef.id,
        endpointConfig,
      };
    } catch (error) {
      console.error(
        "[FirebaseMcpEndpoints][createMcpEndpointConfig] Error:",
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create MCP endpoint config",
      };
    }
  }

  /**
   * Get an MCP endpoint configuration by ID
   * @param endpointId Endpoint ID
   * @returns Promise with success status and endpoint config
   */
  async getMcpEndpointConfig(endpointId: string) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      const endpointDocRef = doc(
        this.db,
        this.getMcpEndpointConfigDoc(userId, endpointId)
      );
      const endpointDoc = await getDoc(endpointDocRef);

      if (!endpointDoc.exists()) {
        return { success: false, error: "Endpoint not found" };
      }

      const endpointConfig = endpointDoc.data() as McpEndpointConfig;

      return {
        success: true,
        endpointConfig,
      };
    } catch (error) {
      console.error(
        "[FirebaseMcpEndpoints][getMcpEndpointConfig] Error:",
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get MCP endpoint config",
      };
    }
  }

  /**
   * Get all MCP endpoint configurations for a collection
   * @param collectionId Collection ID
   * @returns Promise with success status and endpoints array
   */
  async getMcpEndpointConfigsByCollection(collectionId: string) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      const endpointsCollection = collection(
        this.db,
        this.getMcpEndpointConfigPath(userId)
      );
      const endpointsQuery = query(
        endpointsCollection,
        where("collectionId", "==", collectionId)
      );
      const endpointsSnapshot = await getDocs(endpointsQuery);

      if (endpointsSnapshot.empty) {
        return { success: true, endpoints: [] };
      }

      const endpoints: McpEndpointConfig[] = [];
      endpointsSnapshot.forEach((doc) => {
        endpoints.push(doc.data() as McpEndpointConfig);
      });

      return {
        success: true,
        endpoints,
      };
    } catch (error) {
      console.error(
        "[FirebaseMcpEndpoints][getMcpEndpointConfigsByCollection] Error:",
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get MCP endpoint configs",
      };
    }
  }

  /**
   * Update an MCP endpoint configuration
   * @param endpointId Endpoint ID
   * @param data Partial endpoint config data
   * @returns Promise with success status and updated endpoint config
   */
  async updateMcpEndpointConfig(
    endpointId: string,
    data: Partial<McpEndpointConfig>
  ) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      const endpointDocRef = doc(
        this.db,
        this.getMcpEndpointConfigDoc(userId, endpointId)
      );
      const endpointDoc = await getDoc(endpointDocRef);

      if (!endpointDoc.exists()) {
        return { success: false, error: "Endpoint not found" };
      }

      // Update only the fields that are provided
      const updatedConfig: Partial<McpEndpointConfig> = {
        ...data,
        updatedAt: getCurrentUnixTimestamp(),
      };

      // Convert the updatedConfig to a plain object and remove any undefined values
      // Firestore doesn't handle undefined values well
      const updatedConfigForFirestore = JSON.parse(
        JSON.stringify(updatedConfig)
      );

      await updateDoc(endpointDocRef, updatedConfigForFirestore);

      // Get the updated document
      const updatedDocSnapshot = await getDoc(endpointDocRef);
      const endpointConfig = updatedDocSnapshot.data() as McpEndpointConfig;

      return {
        success: true,
        endpointConfig,
      };
    } catch (error) {
      console.error(
        "[FirebaseMcpEndpoints][updateMcpEndpointConfig] Error:",
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update MCP endpoint config",
      };
    }
  }

  /**
   * Delete an MCP endpoint configuration
   * @param endpointId Endpoint ID
   * @returns Promise with success status
   */
  async deleteMcpEndpointConfig(endpointId: string) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      const endpointDocRef = doc(
        this.db,
        this.getMcpEndpointConfigDoc(userId, endpointId)
      );
      const endpointDoc = await getDoc(endpointDocRef);

      if (!endpointDoc.exists()) {
        return { success: false, error: "Endpoint not found" };
      }

      await deleteDoc(endpointDocRef);

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        "[FirebaseMcpEndpoints][deleteMcpEndpointConfig] Error:",
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete MCP endpoint config",
      };
    }
  }
}

// Export as a singleton
export const firebaseMcpEndpoints = new FirebaseMcpEndpoints();
export default FirebaseMcpEndpoints;
