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
  orderBy,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  CollectionReference,
  Query,
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

class FirebaseCollectionMcpEndpoints {
  auth: ReturnType<typeof getAuth>;
  db: ReturnType<typeof getFirestore>;
  storage: ReturnType<typeof getStorage>;
  collectionName: string;
  mcpEndpointsCollection: string;

  constructor() {
    try {
      if (!clientAuth || !clientDb || !clientApp) {
        throw new Error("Firebase client instances (auth, db, or app) are not initialized");
      }

      this.auth = clientAuth;

      this.db = clientDb;

      console.log(
        "[FirebaseCollectionMcpEndpoints] Using database:",
        process.env.NEXT_PUBLIC_FIRESTORE_DATABASE_NAME || "default"
      );

      this.storage = getStorage(clientApp);
      this.collectionName = "collectionmcpendpoints";
      this.mcpEndpointsCollection = "collectionmcpendpoints";
    } catch (error) {
      console.error(
        "[FirebaseCollectionMcpEndpoints][constructor] Error initializing:",
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
        "[FirebaseCollectionMcpEndpoints][getRefCollection] User not authenticated"
      );
    }

    let userId = this.auth.currentUser?.uid;
    if (!userId) {
      userId = "default";
    }

    const path = this.getMcpEndpointConfigPath(userId);
    console.log(
      `[FirebaseCollectionMcpEndpoints] Creating collection reference with path: ${path}`
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

      const endpointsCollection = this.getRefCollection();
      const endpointRef = doc(endpointsCollection);

      const timestamp = getCurrentUnixTimestamp();
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
        "[FirebaseCollectionMcpEndpoints][createMcpEndpointConfig] Error:",
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
        "[FirebaseCollectionMcpEndpoints][getMcpEndpointConfig] Error:",
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
        where("collectionId", "==", collectionId),
        orderBy("updatedAt", "desc")
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
        "[FirebaseCollectionMcpEndpoints][getMcpEndpointConfigsByCollection] Error:",
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
   * Get a Firestore Query for MCP endpoint configurations by collectionId
   * @param collectionId Collection ID
   * @returns Firestore Query object
   */
  public getMcpEndpointConfigsByCollectionQuery(
    collectionId: string
  ): Query<McpEndpointConfig> {
    const queryPath = this.mcpEndpointsCollection;
    console.log(
      `[FirebaseCollectionMcpEndpoints] getMcpEndpointConfigsByCollectionQuery: ` +
      `Querying path "${queryPath}" for collectionId "${collectionId}" ` +
      `using DB instance: ${this.db.app.name} (app) and project: ${this.db.app.options.projectId}`
    );
    return query(
      collection(this.db, queryPath),
      where("collectionId", "==", collectionId),
      orderBy("updatedAt", "desc")
    ) as Query<McpEndpointConfig>;
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

      const updatedConfig: Partial<McpEndpointConfig> = {
        ...data,
        updatedAt: getCurrentUnixTimestamp(),
      };

      const updatedConfigForFirestore = JSON.parse(
        JSON.stringify(updatedConfig)
      );

      await updateDoc(endpointDocRef, updatedConfigForFirestore);

      const updatedDocSnapshot = await getDoc(endpointDocRef);
      const endpointConfig = updatedDocSnapshot.data() as McpEndpointConfig;

      return {
        success: true,
        endpointConfig,
      };
    } catch (error) {
      console.error(
        "[FirebaseCollectionMcpEndpoints][updateMcpEndpointConfig] Error:",
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
        "[FirebaseCollectionMcpEndpoints][deleteMcpEndpointConfig] Error:",
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

export const firebaseCollectionMcpEndpoints = new FirebaseCollectionMcpEndpoints();
export default FirebaseCollectionMcpEndpoints;
