# Implementing User-Based Rate Limiting Without Redis

This document outlines a solution for implementing user-based rate limiting to protect API endpoints, React Server Actions, and storage uploads against DDoS attacks. The solution uses Next.js standard middleware and in-memory storage.

## 1. Enhanced In-Memory Rate Limiting

```typescript
// web/src/lib/enhanced-rate-limit.ts
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { RateLimitError } from "./utils/error-utils";

// In-memory cache for rate limiting
// NOTE: This is not suitable for production use with multiple instances
// For production with multiple instances, consider using a distributed cache solution
interface RateLimitEntry {
  count: number;
  expires: number;
  totalUploadSize?: number; // For tracking upload sizes
  uploadSizeExpires?: number; // Separate expiry for upload size tracking
}

const rateLimitCache: Record<string, RateLimitEntry> = {};

/**
 * Cleans up expired rate limit entries
 * This is called periodically to prevent memory leaks
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  Object.keys(rateLimitCache).forEach((key) => {
    if (rateLimitCache[key].expires < now) {
      // If upload size tracking is still valid, only reset the count
      if (
        rateLimitCache[key].uploadSizeExpires &&
        rateLimitCache[key].uploadSizeExpires > now
      ) {
        rateLimitCache[key].count = 0;
        rateLimitCache[key].expires = now + 60 * 1000; // Reset for another minute
      } else {
        // Otherwise, remove the entire entry
        delete rateLimitCache[key];
      }
    }
  });
}

// Clean up expired entries every minute
if (typeof window === "undefined") {
  // Only run on server
  setInterval(cleanupExpiredEntries, 60 * 1000);
}

interface RateLimitConfig {
  // Number of requests allowed per minute
  requestsPerMinute: number;
  // Total upload size allowed per day in bytes
  maxUploadSizePerDay?: number;
}

// Default rate limit configurations
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  api: { requestsPerMinute: 60 },
  serverAction: { requestsPerMinute: 30 },
  storage: { requestsPerMinute: 10, maxUploadSizePerDay: 50 * 1024 * 1024 }, // 50MB per day
};

/**
 * Rate limits requests based on user ID
 * @param userId The user's ID
 * @param actionType The type of action being rate limited (api, serverAction, storage)
 * @param size Optional size of upload in bytes (for storage actions)
 * @returns Object with success status and error message if applicable
 */
export async function userRateLimit(
  userId: string,
  actionType: keyof typeof DEFAULT_RATE_LIMITS,
  size?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = DEFAULT_RATE_LIMITS[actionType];
    const now = Date.now();

    // Key for tracking this user's rate limit
    const key = `rate-limit:${actionType}:${userId}`;

    // Initialize or get current rate limit data
    if (!rateLimitCache[key] || rateLimitCache[key].expires < now) {
      rateLimitCache[key] = {
        count: 0,
        expires: now + 60 * 1000, // 60 seconds (1 minute)
      };
    }

    // Check if rate limit exceeded
    if (rateLimitCache[key].count >= config.requestsPerMinute) {
      return {
        success: false,
        error: `Rate limit exceeded for ${actionType}. Try again later.`,
      };
    }

    // For storage actions, check upload size limit
    if (actionType === "storage" && size && config.maxUploadSizePerDay) {
      // Initialize upload size tracking if needed
      if (
        !rateLimitCache[key].totalUploadSize ||
        !rateLimitCache[key].uploadSizeExpires ||
        rateLimitCache[key].uploadSizeExpires < now
      ) {
        rateLimitCache[key].totalUploadSize = 0;

        // Set expiry for size tracking to end of day (UTC)
        const endOfDay = new Date();
        endOfDay.setUTCHours(23, 59, 59, 999);
        rateLimitCache[key].uploadSizeExpires = endOfDay.getTime();
      }

      // Check if size limit exceeded
      if (
        rateLimitCache[key].totalUploadSize! + size >
        config.maxUploadSizePerDay
      ) {
        return {
          success: false,
          error: `Daily upload size limit exceeded. Try again tomorrow.`,
        };
      }

      // Update total size
      rateLimitCache[key].totalUploadSize! += size;
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
 * Extract user ID from request
 * Tries to get user ID from:
 * 1. Authentication token
 * 2. Query parameter
 * 3. Falls back to IP address if user is not authenticated
 */
export async function getUserIdFromRequest(req: NextRequest): Promise<string> {
  try {
    // Try to get user from auth token
    const token = await getToken({ req });
    if (token?.sub) {
      return token.sub;
    }

    // Try to get user ID from query parameter (for authenticated API routes)
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (userId) {
      return userId;
    }

    // Fall back to IP address
    return req.headers.get("x-forwarded-for") || req.ip || "unknown";
  } catch (error) {
    console.error("Error getting user ID:", error);
    return req.headers.get("x-forwarded-for") || req.ip || "unknown";
  }
}
```

## 2. Next.js Middleware for API Routes

```typescript
// web/src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserIdFromRequest, userRateLimit } from "./lib/enhanced-rate-limit";

// Paths that should be protected by rate limiting
const PROTECTED_PATHS = ["/api/", "/api/mcp/"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if this path should be rate limited
  const shouldRateLimit = PROTECTED_PATHS.some((prefix) =>
    path.startsWith(prefix)
  );

  if (shouldRateLimit) {
    try {
      // Get user ID from request
      const userId = await getUserIdFromRequest(request);

      // Apply rate limiting
      const result = await userRateLimit(userId, "api");

      if (!result.success) {
        // Return 429 Too Many Requests
        return new NextResponse(
          JSON.stringify({ error: result.error || "Rate limit exceeded" }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": "60", // Suggest client to retry after 60 seconds
            },
          }
        );
      }
    } catch (error) {
      console.error("Rate limiting middleware error:", error);
      // Allow the request to proceed if rate limiting fails
    }
  }

  // Continue with the request
  return NextResponse.next();
}

// Configure the middleware to run only for API routes
export const config = {
  matcher: ["/api/:path*"],
};
```

## 3. Rate Limiting for React Server Actions

```typescript
// web/src/lib/action.ts (updated)
import { createSafeActionClient } from "next-safe-action";
import { getUser } from "@/lib/firebase/actions/auth";
import { redirect } from "next/navigation";
import { userRateLimit } from "./enhanced-rate-limit";
import { RateLimitError } from "./utils/error-utils";

// Regular action client for non-authenticated actions
export const actionClient = createSafeActionClient();

// Protected action client that requires authentication and applies rate limiting
export const userActionClient = createSafeActionClient().use(
  async ({ next, ctx }) => {
    const user = await getUser();
    if (!user) redirect("/auth/signin");

    // Apply rate limiting
    const rateLimitResult = await userRateLimit(user.uid, "serverAction");
    if (!rateLimitResult.success) {
      throw new RateLimitError(rateLimitResult.error || "Rate limit exceeded");
    }

    return next({ ctx: { user } });
  }
);
```

## 4. Storage Upload Size Limits

```typescript
// web/src/lib/firebase/storage.ts (updated)
"use server";

import { getStorage } from "firebase-admin/storage";
import { getCurrentUserId } from "./adminAuth";
import { adminApp } from "./admin";
import { userRateLimit } from "../enhanced-rate-limit";

// Get Firebase Storage instance
const adminStorage = getStorage(adminApp);
// Explicitly specify the bucket name from environment variables
const bucket = adminStorage.bucket(
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Upload a file to Firebase Storage with rate limiting
 * @param file - The file to upload (as a Buffer)
 * @param path - The path to store the file at in Firebase Storage
 * @param contentType - The content type of the file
 */
export async function uploadAsset(
  file: Buffer,
  path: string,
  contentType: string
) {
  try {
    const userId = await getCurrentUserId();

    // Check file size
    if (file.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size exceeds the maximum allowed size of ${
          MAX_FILE_SIZE / (1024 * 1024)
        }MB`,
      };
    }

    // Apply rate limiting
    const rateLimitResult = await userRateLimit(userId, "storage", file.length);
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: rateLimitResult.error,
      };
    }

    // Create a file in the bucket with the specified path
    const fileRef = bucket.file(path);

    // Upload the file
    await fileRef.save(file, {
      metadata: {
        contentType,
      },
      resumable: false,
    });

    const signedUrl = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + 24 * 60 * 60 * 1000 * 365 * 10, // URL valid for 10 years
    });

    return {
      success: true,
      url: signedUrl,
      filePath: fileRef.name,
    };
  } catch (error) {
    console.error(`Failed to upload file to ${path}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

## 5. Updated Firebase Storage Rules

```
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Function to check if user is within upload size limits
    function isWithinSizeLimit() {
      // Get the size of the file being uploaded
      let size = request.resource.size;

      // Maximum size per file (10MB)
      let maxFileSize = 10 * 1024 * 1024;

      // Check if file size is within limit
      return size <= maxFileSize;
    }

    match /{allPaths=**} {
      // Allow read if authenticated
      allow read: if request.auth != null;

      // Allow write if authenticated and within size limit
      allow write: if request.auth != null && isWithinSizeLimit();
    }
  }
}
```

## 6. Error Handling Utility

```typescript
// web/src/lib/utils/error-utils.ts (updated)
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export function handleServerError(error: unknown): { message: string } {
  console.error("Server error:", error);

  if (error instanceof RateLimitError) {
    return { message: error.message };
  }

  return { message: "An unexpected error occurred" };
}
```

## Implementation Notes

1. **In-Memory Storage Warning**: This solution uses in-memory storage, which works well for single-instance deployments. For multi-instance deployments, you would need to:

   - Use a shared cache like Redis
   - Or implement sticky sessions to ensure users always hit the same instance

2. **Next.js Middleware**: The middleware approach provides a clean way to protect all API routes without modifying each endpoint individually.

3. **Scalability Considerations**: For high-traffic applications, consider:
   - Implementing a more sophisticated token bucket algorithm
   - Adding graduated response (warning before blocking)
   - Implementing automatic IP blocking for repeated violations
