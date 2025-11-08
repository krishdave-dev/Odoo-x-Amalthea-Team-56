import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import { SessionData, SessionUser } from '@/types/auth'

// Validate SESSION_SECRET exists and is strong enough
const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error(
    'SESSION_SECRET must be set in environment variables and be at least 32 characters long. ' +
    'Generate one with: openssl rand -base64 32'
  )
}

/**
 * Session configuration with enhanced security
 * Store session secret in environment variable
 */
export const sessionOptions: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: 'oneflow_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    sameSite: 'lax', // CSRF protection
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
  ttl: 60 * 60 * 24 * 7, // Session TTL: 7 days
}

/**
 * Get the current session
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

/**
 * Get the current authenticated user from session
 * Returns null if not authenticated or session is invalid
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const session = await getSession()
    
    // Validate session integrity
    if (!session.user || !session.isLoggedIn) {
      return null
    }

    // Validate required fields
    if (!session.user.id || !session.user.email || !session.user.organizationId) {
      // Session corrupted, destroy it
      session.destroy()
      return null
    }

    return session.user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

/**
 * Check if user has specific role(s)
 */
export async function hasRole(roles: string | string[]): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  
  const roleArray = Array.isArray(roles) ? roles : [roles]
  return roleArray.includes(user.role)
}

/**
 * Require specific role - throws if user doesn't have role
 */
export async function requireRole(roles: string | string[]) {
  const user = await requireAuth()
  const roleArray = Array.isArray(roles) ? roles : [roles]
  
  if (!roleArray.includes(user.role)) {
    throw new Error(`Required role: ${roleArray.join(' or ')}`)
  }
  
  return user
}

/**
 * Validate session and user still exists in database
 * Use this for sensitive operations
 */
export async function validateSessionWithDatabase() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Dynamically import prisma to avoid circular dependencies
  const { prisma } = await import('./prisma')
  
  // Check if user still exists and is active
  const dbUser = await prisma.user.findFirst({
    where: {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      isActive: true,
      deletedAt: null,
    },
  })

  if (!dbUser) {
    // User deleted or deactivated, destroy session
    const session = await getSession()
    session.destroy()
    throw new Error('User account is no longer active')
  }

  // Check if role has changed
  if (dbUser.role !== user.role) {
    // Update session with new role
    const session = await getSession()
    if (session.user) {
      session.user.role = dbUser.role as 'admin' | 'manager' | 'member'
      await session.save()
    }
  }

  return dbUser
}

/**
 * Destroy session (logout)
 */
export async function destroySession() {
  const session = await getSession()
  session.destroy()
}
