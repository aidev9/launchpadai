import { adminDb } from "./admin";
import { getCurrentUnixTimestamp } from "@/utils/constants";
import { getCurrentUserId } from "./adminAuth";
import {
  McpEndpointConfig,
  McpEndpointConfigInput,
} from "./schema/mcp-endpoints";

// Path for MCP endpoint configurations
const getMcpEndpointConfigPath = (userId: string) =>
  `mcp_endpoints/${userId}/endpoints`;
const getMcpEndpointConfigDoc = (userId: string, endpointId: string) =>
  `${getMcpEndpointConfigPath(userId)}/${endpointId}`;

/**
 * Create a new MCP endpoint configuration
 * @param data The endpoint configuration data
 * @param collectionId The collection ID this endpoint is associated with
 * @returns Object with success status and endpoint data or error
 */
export async function createMcpEndpointConfig(
  data: McpEndpointConfigInput,
  collectionId: string
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const endpointRef = adminDb
      .collection(getMcpEndpointConfigPath(userId))
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
    console.error("Error creating MCP endpoint config:", error);
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
export async function getMcpEndpointConfig(endpointId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const endpointDoc = await adminDb
      .doc(getMcpEndpointConfigDoc(userId, endpointId))
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
    console.error("Error getting MCP endpoint config:", error);
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
export async function getMcpEndpointConfigsByCollection(collectionId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const endpointsSnapshot = await adminDb
      .collection(getMcpEndpointConfigPath(userId))
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
    console.error("Error getting MCP endpoint configs by collection:", error);
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
export async function updateMcpEndpointConfig(
  endpointId: string,
  data: Partial<McpEndpointConfig>
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const endpointRef = adminDb.doc(
      getMcpEndpointConfigDoc(userId, endpointId)
    );
    const endpointDoc = await endpointRef.get();

    if (!endpointDoc.exists) {
      return { success: false, error: "Endpoint not found" };
    }

    const currentConfig = endpointDoc.data() as McpEndpointConfig;

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
    console.error("Error updating MCP endpoint config:", error);
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
export async function deleteMcpEndpointConfig(endpointId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const endpointRef = adminDb.doc(
      getMcpEndpointConfigDoc(userId, endpointId)
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
    console.error("Error deleting MCP endpoint config:", error);
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
export async function getMcpEndpointConfigServer(endpointId: string) {
  try {
    console.log(`[MCP Server] Looking for endpoint with ID: ${endpointId}`);

    // Get all users first
    const usersSnapshot = await adminDb.collection("mcp_endpoints").get();
    console.log(
      `[MCP Server] Found ${usersSnapshot.size} users with mcp_endpoints`
    );

    if (usersSnapshot.empty) {
      console.log("[MCP Server] No users found with mcp_endpoints collection");

      // Try a direct approach as a fallback
      try {
        // Try to find the endpoint directly by ID across all collections
        const allEndpointsSnapshot = await adminDb
          .collectionGroup("endpoints")
          .get();
        console.log(
          `[MCP Server] Found ${allEndpointsSnapshot.size} total endpoints`
        );

        for (const doc of allEndpointsSnapshot.docs) {
          const data = doc.data();
          if (data.id === endpointId) {
            console.log(
              `[MCP Server] Found endpoint by direct search: ${endpointId}`
            );
            return {
              success: true,
              endpointConfig: data as McpEndpointConfig,
            };
          }
        }
      } catch (err) {
        console.error("[MCP Server] Error in fallback search:", err);
      }
    }

    // Iterate through each user's endpoints collection
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`[MCP Server] Checking user: ${userId}`);

      // Check if this user has the endpoint
      const endpointDoc = await adminDb
        .collection(`mcp_endpoints/${userId}/endpoints`)
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
    console.error("Error getting MCP endpoint config (server):", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get MCP endpoint config",
    };
  }
}
