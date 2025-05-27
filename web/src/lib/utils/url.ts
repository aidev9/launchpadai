/**
 * Get the current origin safely for both client and server environments
 */
export function getCurrentOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // For server-side rendering, use environment variable or default
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // For server-side rendering
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  return "http://localhost:3000";
}
