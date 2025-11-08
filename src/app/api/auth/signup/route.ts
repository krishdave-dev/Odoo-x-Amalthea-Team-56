import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { getSession } from '@/lib/session'
import { SignupData, SessionUser } from '@/types/auth'
import { invitationService } from '@/services/invitation.service'
import { isRateLimited, getTimeUntilReset } from '@/lib/rate-limit'
import { getClientIp, sanitizeEmail, validatePasswordStrength, isSuspiciousUserAgent, sleep } from '@/lib/security'

/**
 * POST /api/auth/signup
 * Register a new user with comprehensive security validation
 * Supports:
 * 1. Admin creating new organization
 * 2. Invited user joining existing organization
 * 3. Regular signup (if enabled)
 */
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req)
  const userAgent = req.headers.get('user-agent')
  
  try {
    const body: SignupData = await req.json()
    const { email, password, name, organizationId, role, invitationToken, createOrganization, organizationName } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check for suspicious user agent
    if (isSuspiciousUserAgent(userAgent)) {
      await sleep(2000)
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 403 }
      )
    }

    // Rate limiting by IP
    const rateLimitKey = `signup:${clientIp}`
    if (isRateLimited(rateLimitKey, { maxAttempts: 3, windowMs: 60 * 60 * 1000 })) { // 3 signups per hour
      const timeUntilReset = getTimeUntilReset(rateLimitKey)
      const minutesRemaining = Math.ceil(timeUntilReset / 60000)
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many signup attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`,
          retryAfter: timeUntilReset
        },
        { status: 429 }
      )
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password does not meet security requirements',
          details: passwordValidation.errors 
        },
        { status: 400 }
      )
    }

    // Validate name
    if (name.trim().length < 2 || name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Name must be between 2 and 100 characters' },
        { status: 400 }
      )
    }

    let finalOrganizationId: number
    let finalRole: string
    let organization: any

    // CASE 1: Invitation-based signup
    if (invitationToken) {
      const invitation = await invitationService.getInvitationByToken(invitationToken)
      
      if (!invitation) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired invitation' },
          { status: 404 }
        )
      }

      if (invitation.status !== 'pending') {
        return NextResponse.json(
          { success: false, error: `Invitation is ${invitation.status}` },
          { status: 400 }
        )
      }

      if (new Date() > invitation.expiresAt) {
        await prisma.organizationInvitation.update({
          where: { id: invitation.id },
          data: { status: 'expired' },
        })
        return NextResponse.json(
          { success: false, error: 'Invitation has expired' },
          { status: 400 }
        )
      }

      // Email must match invitation
      if (sanitizedEmail !== invitation.email) {
        return NextResponse.json(
          { success: false, error: 'Email does not match invitation' },
          { status: 400 }
        )
      }

      finalOrganizationId = invitation.organizationId
      finalRole = invitation.role as string
      organization = await prisma.organization.findUnique({ where: { id: finalOrganizationId } })
    }
    // CASE 2: Admin creating new organization
    else if (createOrganization && organizationName) {
      if (!organizationName.trim() || organizationName.length < 2) {
        return NextResponse.json(
          { success: false, error: 'Organization name must be at least 2 characters' },
          { status: 400 }
        )
      }

      // Create new organization
      organization = await prisma.organization.create({
        data: {
          name: organizationName.trim(),
          currency: 'USD',
          timezone: 'America/New_York',
        },
      })

      finalOrganizationId = organization.id
      finalRole = 'admin' // Creator becomes admin
    }
    // CASE 3: Regular signup with existing organization
    else if (organizationId) {
      // Check if organization exists
      organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      })

      if (!organization) {
        return NextResponse.json(
          { success: false, error: 'Organization not found' },
          { status: 404 }
        )
      }

      finalOrganizationId = organizationId
      // Validate role
      const allowedRoles = ['admin', 'manager', 'finance', 'member']
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid role selected' },
          { status: 400 }
        )
      }
      finalRole = role
    } else {
      return NextResponse.json(
        { success: false, error: 'Must provide organization ID, invitation token, or create new organization' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: sanitizedEmail,
        organizationId: finalOrganizationId,
      },
    })

    if (existingUser) {
      // Add delay to prevent user enumeration
      await sleep(1000)
      return NextResponse.json(
        { success: false, error: 'User with this email already exists in this organization' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user and handle invitation if present
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: sanitizedEmail,
          name: name.trim(),
          passwordHash,
          role: finalRole as any,
          organizationId: finalOrganizationId,
          isActive: true,
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

      // If invitation was used, mark it as accepted
      if (invitationToken) {
        await invitationService.acceptInvitation(invitationToken, newUser.id)
      }

      // Log signup event
      await tx.event.create({
        data: {
          organizationId: finalOrganizationId,
          entityType: 'User',
          entityId: newUser.id,
          eventType: 'USER_SIGNUP',
          payload: {
            userId: newUser.id,
            email: newUser.email,
            role: newUser.role,
            ip: clientIp,
            userAgent: userAgent,
            invitationBased: !!invitationToken,
            organizationCreator: createOrganization,
            timestamp: new Date().toISOString(),
          },
        },
      })

      return newUser
    })

    // Create session
    const session = await getSession()
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'manager' | 'member' | 'finance',
      organizationId: user.organizationId,
      organizationName: user.organization.name,
      isActive: user.isActive,
    }

    session.user = sessionUser
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization.name,
        },
        message: invitationToken ? 'Successfully joined organization' : createOrganization ? 'Organization created successfully' : 'Account created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    
    // Generic error message to avoid leaking information
    return NextResponse.json(
      { success: false, error: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}
