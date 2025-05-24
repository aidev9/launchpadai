import { adminDb } from "./admin";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { getCurrentUserId } from "./adminAuth";
import {
  McpEndpointConfig,
  McpEndpointConfigInput,
} from "./schema/mcp-endpoints";

/**
 * Server-side MCP Endpoints class for admin operations
 */
class AdminMcpEndpoints {
  db: typeof adminDb;
  collectionName: string;

  constructor() {
    try {
      this.db = adminDb;
      this.collectionName = "mcp_endpoints";
    } catch (error) {
      console.error(
        "[AdminMcpEndpoints][constructor] Error initializing:",
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
   * Create a new MCP endpoint configuration
   * @param data The endpoint configuration data
   * @param collectionId The collection ID this endpoint is associated with
   * @returns Object with success status and endpoint data or error
   */
  async createMcpEndpointConfig(
    data: McpEndpointConfigInput,
    collectionId: string
  ) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      const endpointRef = this.db
        .collection(this.getMcpEndpointConfigPath(userId))
        .doc();

      const timestamp = getCurrentUnixTimestamp();
      const endpointConfig: McpEndpointConfig = {
        id: endpointRef.id,
        userId,
        collectionId,
        name: data.name,
        description: data.description,
        isEnabled: data.isEnabled,
        authType: data.authType,
        authCredentials: data.authCredentials,
        accessControl: data.accessControl,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await endpointRef.set(endpointConfig);

      return {
        success: true,
        id: endpointRef.id,
        endpointConfig,
      };
    } catch (error) {
      console.error(
        "[AdminMcpEndpoints][createMcpEndpointConfig] Error:",
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
   * @param endpointId The endpoint ID
   * @returns Object with success status and endpoint data or error
   */
  async getMcpEndpointConfig(endpointId: string) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      const endpointDoc = await this.db
        .doc(this.getMcpEndpointConfigDoc(userId, endpointId))
        .get();

      if (!endpointDoc.exists) {
        return { success: false, error: "Endpoint not found" };
      }

      const endpointConfig = endpointDoc.data() as McpEndpointConfig;

      return {
        success: true,
        endpointConfig,
      };
    } catch (error) {
      console.error("[AdminMcpEndpoints][getMcpEndpointConfig] Error:", error);
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
   * @param collectionId The collection ID
   * @returns Object with success status and array of endpoint configurations or error
   */
  async getMcpEndpointConfigsByCollection(collectionId: string) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      const endpointsSnapshot = await this.db
        .collection(this.getMcpEndpointConfigPath(userId))
        .where("collectionId", "==", collectionId)
        .get();

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
        "[AdminMcpEndpoints][getMcpEndpointConfigsByCollection] Error:",
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
   * @param endpointId The endpoint ID
   * @param data The updated endpoint configuration data
   * @returns Object with success status and updated endpoint data or error
   */
  async updateMcpEndpointConfig(
    endpointId: string,
    data: Partial<McpEndpointConfig>
  ) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      const endpointRef = this.db.doc(
        this.getMcpEndpointConfigDoc(userId, endpointId)
      );
      const endpointDoc = await endpointRef.get();

      if (!endpointDoc.exists) {
        return { success: false, error: "Endpoint not found" };
      }

      // Update only the fields that are provided
      const updatedConfig: Partial<McpEndpointConfig> = {
        ...data,
        updatedAt: getCurrentUnixTimestamp(),
      };

      await endpointRef.update(updatedConfig);

      // Get the updated document
      const updatedDoc = await endpointRef.get();
      const endpointConfig = updatedDoc.data() as McpEndpointConfig;

      return {
        success: true,
        endpointConfig,
      };
    } catch (error) {
      console.error(
        "[AdminMcpEndpoints][updateMcpEndpointConfig] Error:",
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
   * @param endpointId The endpoint ID
   * @returns Object with success status or error
   */
  async deleteMcpEndpointConfig(endpointId: string) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      const endpointRef = this.db.doc(
        this.getMcpEndpointConfigDoc(userId, endpointId)
      );
      const endpointDoc = await endpointRef.get();

      if (!endpointDoc.exists) {
        return { success: false, error: "Endpoint not found" };
      }

      await endpointRef.delete();

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        "[AdminMcpEndpoints][deleteMcpEndpointConfig] Error:",
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

  /**
   * Get an MCP endpoint configuration by ID (server-side)
   * This function is used by the API route to get the endpoint config
   * @param endpointId The endpoint ID
   * @returns Object with success status and endpoint data or error
   */
  async getMcpEndpointConfigServer(endpointId: string) {
    try {
      console.log(`[MCP Server] Looking for endpoint with ID: ${endpointId}`);

      // Try the direct collectionGroup approach first for better performance
      try {
        console.log(`[MCP Server] Searching using collectionGroup...`);
        const allEndpointsSnapshot = await this.db
          .collectionGroup(this.collectionName)
          .get();
        console.log(
          `[MCP Server] Found ${allEndpointsSnapshot.size} total endpoints`
        );

        for (const doc of allEndpointsSnapshot.docs) {
          const data = doc.data();
          console.log(
            `[MCP Server] Checking endpoint with ID: ${data.id}, Document ID: ${doc.id}`
          );

          // Check both the data.id field and the document ID
          if (data.id === endpointId || doc.id === endpointId) {
            console.log(
              `[MCP Server] Found endpoint by collectionGroup search: ${endpointId}`
            );
            return {
              success: true,
              endpointConfig: data as McpEndpointConfig,
            };
          }
        }
        console.log(
          `[MCP Server] Endpoint ${endpointId} not found in collectionGroup search`
        );
      } catch (err) {
        console.error("[MCP Server] Error in collectionGroup search:", err);
      }

      // Fallback: Get all users and check their endpoint collections
      const usersSnapshot = await this.db.collection(this.collectionName).get();
      console.log(
        `[MCP Server] Found ${usersSnapshot.size} users with ${this.collectionName}`
      );

      if (usersSnapshot.empty) {
        console.log(
          `[MCP Server] No users found with ${this.collectionName} collection`
        );
        return { success: false, error: "Endpoint not found" };
      }

      // Iterate through each user's endpoints collection
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        console.log(`[MCP Server] Checking user: ${userId}`);

        // Check if this user has the endpoint - using correct path
        const endpointDoc = await this.db
          .collection(`${this.collectionName}/${userId}/${this.collectionName}`)
          .doc(endpointId)
          .get();

        // If found, return it
        if (endpointDoc.exists) {
          console.log(`[MCP Server] Found endpoint for user ${userId}`);
          const endpointConfig = endpointDoc.data() as McpEndpointConfig;
          return {
            success: true,
            endpointConfig,
          };
        }
      }

      // If we get here, the endpoint wasn't found
      console.log(
        `[MCP Server] Endpoint not found after checking all users: ${endpointId}`
      );
      return { success: false, error: "Endpoint not found" };
    } catch (error) {
      console.error(
        "[AdminMcpEndpoints][getMcpEndpointConfigServer] Error:",
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
}

// Export as a singleton
export const adminMcpEndpoints = new AdminMcpEndpoints();
export default AdminMcpEndpoints;

// For backward compatibility, export the functions directly
export const createMcpEndpointConfig = (
  data: McpEndpointConfigInput,
  collectionId: string
) => adminMcpEndpoints.createMcpEndpointConfig(data, collectionId);

export const getMcpEndpointConfig = (endpointId: string) =>
  adminMcpEndpoints.getMcpEndpointConfig(endpointId);

export const getMcpEndpointConfigsByCollection = (collectionId: string) =>
  adminMcpEndpoints.getMcpEndpointConfigsByCollection(collectionId);

export const updateMcpEndpointConfig = (
  endpointId: string,
  data: Partial<McpEndpointConfig>
) => adminMcpEndpoints.updateMcpEndpointConfig(endpointId, data);

export const deleteMcpEndpointConfig = (endpointId: string) =>
  adminMcpEndpoints.deleteMcpEndpointConfig(endpointId);

export const getMcpEndpointConfigServer = (endpointId: string) =>
  adminMcpEndpoints.getMcpEndpointConfigServer(endpointId);
