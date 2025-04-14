import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath =
    path === '/signin' ||
    path === '/signup' ||
    path === '/' ||
    path.startsWith('/api/') ||
    path.startsWith('/waitlist') ||
    path.startsWith('/forgot-password')

  const sessionCookie = request.cookies.get('session')?.value
  const isAuthenticated = !!sessionCookie

  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  if (isAuthenticated && (path === '/signin' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Match all paths except for static files, api routes that need to be public, etc.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
