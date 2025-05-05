import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define authentication paths
const authPaths = [
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/signup_plan",
];

// Define admin paths
const adminPaths = ["/admin"];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the session cookie
  const sessionCookie = request.cookies.get("session")?.value;
  const isAuthenticated = !!sessionCookie;

  // Check if the path is an auth path and user is already authenticated
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
  if (isAuthPath && isAuthenticated) {
    // Redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If at root path and user is authenticated, redirect to home
  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check if accessing admin routes
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));
  if (isAdminPath) {
    // If not authenticated at all, redirect to login
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    try {
      // Call our auth verification API instead of using Firebase Admin directly in the middleware
      const verifyResponse = await fetch(
        new URL("/api/auth/verify-admin", request.url),
        {
          headers: {
            Cookie: `session=${sessionCookie}`,
          },
        }
      );

      if (!verifyResponse.ok) {
        // User is not an admin or verification failed
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      // If verification succeeds, allow access to admin routes
      return NextResponse.next();
    } catch (error) {
      // If verification fails, redirect to login
      console.error("Admin verification error:", error);
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  // For all other cases, continue to the requested page
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Match all paths except for static files, api routes that need to be public, etc.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
