import { NextRequest } from "next/server";
import { McpEndpointConfig } from "./firebase/schema/mcp-endpoints";

/**
 * Verifies authentication for MCP endpoint requests
 * @param req The Next.js request object
 * @param config The MCP endpoint configuration
 * @returns Object with success status and error message if applicable
 */
export function verifyAuth(req: NextRequest, config: McpEndpointConfig) {
  try {
    // Check IP restrictions if configured
    if (config.accessControl.allowedIps.length > 0) {
      const clientIp = req.headers.get("x-forwarded-for") || "unknown";
      if (!config.accessControl.allowedIps.includes(clientIp)) {
        return {
          success: false,
          error: "IP address not allowed",
        };
      }
    }

    // Verify authentication based on type
    if (config.authType === "api_key") {
      const apiKey = req.headers.get("x-api-key");
      if (!apiKey || apiKey !== config.authCredentials.apiKey) {
        return {
          success: false,
          error: "Invalid API key",
        };
      }
    } else if (config.authType === "bearer_token") {
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return {
          success: false,
          error: "Missing or invalid authorization header",
        };
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix
      if (token !== config.authCredentials.bearerToken) {
        return {
          success: false,
          error: "Invalid bearer token",
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Auth verification error:", error);
    return {
      success: false,
      error: "Authentication error",
    };
  }
}
