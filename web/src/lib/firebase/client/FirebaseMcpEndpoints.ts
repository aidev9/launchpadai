import { clientDb, clientAuth } from "@/lib/firebase/client";
import {
  McpEndpointConfig,
  McpEndpointConfigInput,
} from "../schema/mcp-endpoints";
import { getCurrentUnixTimestamp } from "@/utils/constants";
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
} from "firebase/firestore";

// Path for MCP endpoint configurations
const getMcpEndpointConfigPath = (userId: string) =>
  `mcp_endpoints/${userId}/endpoints`;

/**
 * Create a new MCP endpoint configuration (client-side)
 */
export async function createMcpEndpointConfig(
  data: McpEndpointConfigInput,
  collectionId: string
) {
  try {
    const userId = clientAuth.currentUser?.uid;
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Create a new document reference
    const endpointsCollection = collection(
      clientDb,
      getMcpEndpointConfigPath(userId)
    );
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
 * Get an MCP endpoint configuration by ID (client-side)
 */
export async function getMcpEndpointConfig(endpointId: string) {
  try {
    const userId = clientAuth.currentUser?.uid;
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const endpointDocRef = doc(
      clientDb,
      getMcpEndpointConfigPath(userId),
      endpointId
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
 * Get all MCP endpoint configurations for a collection (client-side)
 */
export async function getMcpEndpointConfigsByCollection(collectionId: string) {
  try {
    const userId = clientAuth.currentUser?.uid;
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const endpointsCollection = collection(
      clientDb,
      getMcpEndpointConfigPath(userId)
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
 * Update an MCP endpoint configuration (client-side)
 */
export async function updateMcpEndpointConfig(
  endpointId: string,
  data: Partial<McpEndpointConfig>
) {
  try {
    const userId = clientAuth.currentUser?.uid;
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const endpointDocRef = doc(
      clientDb,
      getMcpEndpointConfigPath(userId),
      endpointId
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
    const updatedConfigForFirestore = JSON.parse(JSON.stringify(updatedConfig));

    await updateDoc(endpointDocRef, updatedConfigForFirestore);

    // Get the updated document
    const updatedDocSnapshot = await getDoc(endpointDocRef);
    const endpointConfig = updatedDocSnapshot.data() as McpEndpointConfig;

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
 * Delete an MCP endpoint configuration (client-side)
 */
export async function deleteMcpEndpointConfig(endpointId: string) {
  try {
    const userId = clientAuth.currentUser?.uid;
    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const endpointDocRef = doc(
      clientDb,
      getMcpEndpointConfigPath(userId),
      endpointId
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
