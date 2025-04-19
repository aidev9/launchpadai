import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define paths that require authentication
const protectedPaths = ["/home", "/dashboard", "/settings", "/profile"];

// Define authentication paths
const authPaths = ["/signin", "/signup", "/forgot-password"];

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the session cookie
  const sessionCookie = request.cookies.get("session")?.value;
  const isAuthenticated = !!sessionCookie;

  // Check if the path is protected and user is not authenticated
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // if (isProtectedPath && !isAuthenticated) {
  //   // Redirect to signin page with return URL
  //   const url = new URL("/signin", request.url);
  //   url.searchParams.set("returnUrl", pathname);
  //   return NextResponse.redirect(url);
  // }

  // Check if the path is an auth path and user is already authenticated
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
  if (isAuthPath && isAuthenticated) {
    // Redirect to home page
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If at root path and user is authenticated, redirect to home
  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
