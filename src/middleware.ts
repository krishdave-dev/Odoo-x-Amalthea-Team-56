import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/session'
import { SessionData } from '@/types/auth'

/**
 * Middleware for authentication, authorization, and security headers
 * Protects routes and redirects based on auth status
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get session
  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  const isAuthenticated = session.isLoggedIn === true && !!session.user
  const userRole = session.user?.role

  // Add security headers to all responses
  addSecurityHeaders(response)

  // Public routes - accessible without authentication
  const isPublicRoute = 
    pathname === '/login' || 
    pathname === '/signup' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/signup') ||
    pathname === '/api/organizations' // Allow fetching organizations for signup

  // Auth routes - should redirect to dashboard if already logged in
  const isAuthRoute = pathname === '/login' || pathname === '/signup'

  // Protected routes - require authentication
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/project') ||
    pathname.startsWith('/task') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/createexpense') ||
    pathname.startsWith('/createproject') ||
    pathname.startsWith('/createpurchase') ||
    pathname.startsWith('/createsalesorder') ||
    pathname.startsWith('/createtask') ||
    pathname.startsWith('/editexpense') ||
    pathname.startsWith('/editproject') ||
    pathname.startsWith('/editpurchase') ||
    pathname.startsWith('/editsalesorder') ||
    pathname.startsWith('/edittask')

  // Redirect to login if trying to access protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to appropriate page if trying to access auth routes while logged in
  if (isAuthRoute && isAuthenticated) {
    const homeUrl = getHomeUrl(userRole)
    return NextResponse.redirect(new URL(homeUrl, request.url))
  }

  // API route protection (except auth routes and public endpoints)
  if (pathname.startsWith('/api') && 
      !pathname.startsWith('/api/auth') && 
      pathname !== '/api/organizations' &&
      !pathname.startsWith('/api/invitations/token/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  return response
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // XSS Protection
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy (formerly Feature Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  
  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none';"
    )
  }
  
  // Strict Transport Security (HSTS) - only in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }
}

/**
 * Get home URL based on user role
 * Admins and managers go to projects page
 * Members go to tasks page
 */
function getHomeUrl(role?: string): string {
  switch (role) {
    case 'admin':
      return '/project'
    case 'manager':
      return '/project'
    case 'member':
      return '/task'
    default:
      return '/login'
  }
}

/**
 * Matcher configuration - specify which routes this middleware runs on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
