import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { getSession } from '@/lib/session'
import { LoginCredentials, SessionUser } from '@/types/auth'
import { isRateLimited, resetRateLimit, getRemainingAttempts, getTimeUntilReset } from '@/lib/rate-limit'
import { getClientIp, sanitizeEmail, isSuspiciousUserAgent, sleep } from '@/lib/security'

/**
 * POST /api/auth/login
 * Authenticate user and create session with comprehensive security
 */
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req)
  const userAgent = req.headers.get('user-agent')
  
  try {
    const body: LoginCredentials = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check for suspicious user agent
    if (isSuspiciousUserAgent(userAgent)) {
      await sleep(2000) // Slow down bots
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 403 }
      )
    }

    // Rate limiting by IP and email
    const rateLimitKey = `login:${clientIp}:${email.toLowerCase()}`
    if (isRateLimited(rateLimitKey, { maxAttempts: 5, windowMs: 15 * 60 * 1000 })) {
      const timeUntilReset = getTimeUntilReset(rateLimitKey)
      const minutesRemaining = Math.ceil(timeUntilReset / 60000)
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`,
          retryAfter: timeUntilReset
        },
        { status: 429 }
      )
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email)

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: sanitizedEmail,
        isActive: true,
        deletedAt: null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Constant-time response to prevent user enumeration
    // Always verify password even if user doesn't exist
    const dummyHash = '$2a$10$dummyHashToPreventTimingAttacks1234567890'
    const passwordHash = user?.passwordHash || dummyHash
    const isValidPassword = await verifyPassword(password, passwordHash)

    // Check if user exists AND password is valid
    if (!user || !user.passwordHash || !isValidPassword) {
      // Add delay to slow down brute force attacks
      await sleep(1000)
      
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    const session = await getSession()
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'manager' | 'member',
      organizationId: user.organizationId,
      organizationName: user.organization.name,
    }

    session.user = sessionUser
    session.isLoggedIn = true
    await session.save()

    // Reset rate limit on successful login
    resetRateLimit(rateLimitKey)

    // Log successful login (for audit trail)
    await prisma.event.create({
      data: {
        organizationId: user.organizationId,
        entityType: 'User',
        entityId: user.id,
        eventType: 'USER_LOGIN',
        payload: {
          userId: user.id,
          email: user.email,
          ip: clientIp,
          userAgent: userAgent,
          timestamp: new Date().toISOString(),
        },
      },
    }).catch((err: unknown) => {
      console.error('Failed to log login event:', err)
      // Don't fail login if event logging fails
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    
    // Generic error message to avoid leaking information
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
