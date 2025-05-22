import { NextRequest } from "next/server";
import { McpEndpointConfig } from "./firebase/schema/mcp-endpoints";

// In-memory cache for rate limiting
// NOTE: This is not suitable for production use with multiple instances
// In production, use a Redis-based solution like Upstash Redis
const rateLimitCache: Record<string, { count: number; expires: number }> = {};

/**
 * Cleans up expired rate limit entries
 * This is called periodically to prevent memory leaks
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  Object.keys(rateLimitCache).forEach((key) => {
    if (rateLimitCache[key].expires < now) {
      delete rateLimitCache[key];
    }
  });
}

// Clean up expired entries every minute
if (typeof window === "undefined") {
  // Only run on server
  setInterval(cleanupExpiredEntries, 60 * 1000);
}

/**
 * Rate limits requests based on client IP and endpoint configuration
 * @param req The Next.js request object
 * @param config The MCP endpoint configuration
 * @returns Object with success status and error message if applicable
 */
export async function rateLimit(req: NextRequest, config: McpEndpointConfig) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    const key = `rate-limit:${config.id}:${clientIp}`;
    const now = Date.now();

    // Initialize or get current rate limit data
    if (!rateLimitCache[key] || rateLimitCache[key].expires < now) {
      rateLimitCache[key] = {
        count: 0,
        expires: now + 60 * 1000, // 60 seconds (1 minute)
      };
    }

    // Check if rate limit exceeded
    if (rateLimitCache[key].count >= config.accessControl.rateLimitPerMinute) {
      return {
        success: false,
        error: "Rate limit exceeded",
      };
    }

    // Increment count
    rateLimitCache[key].count += 1;

    return { success: true };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // If rate limiting fails, allow the request to proceed
    return { success: true };
  }
}

/**
 * PRODUCTION NOTE:
 * For production use, replace this implementation with a Redis-based solution.
 * Example implementation with Upstash Redis would be:
 *
 * ```typescript
 * import { Redis } from "@upstash/redis";
 *
 * // Initialize Redis client for rate limiting
 * const redis = new Redis({
 *   url: process.env.UPSTASH_REDIS_REST_URL || "",
 *   token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
 * });
 *
 * export async function rateLimit(req: NextRequest, config: McpEndpointConfig) {
 *   try {
 *     const clientIp = req.headers.get("x-forwarded-for") || "unknown";
 *     const key = `rate-limit:${config.id}:${clientIp}`;
 *
 *     // Get current count
 *     const count = (await redis.get<number>(key)) || 0;
 *
 *     // Check if rate limit exceeded
 *     if (count >= config.accessControl.rateLimitPerMinute) {
 *       return {
 *         success: false,
 *         error: "Rate limit exceeded",
 *       };
 *     }
 *
 *     // Increment count and set expiry
 *     await redis.incr(key);
 *     await redis.expire(key, 60); // 60 seconds (1 minute)
 *
 *     return { success: true };
 *   } catch (error) {
 *     console.error("Rate limiting error:", error);
 *     // If rate limiting fails, allow the request to proceed
 *     return { success: true };
 *   }
 * }
 * ```
 */
