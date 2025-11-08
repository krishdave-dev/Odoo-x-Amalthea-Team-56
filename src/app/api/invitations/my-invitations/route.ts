import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { errorResponse, successResponse } from '@/lib/response'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/invitations/my-invitations
 * Get pending invitations for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    // Get all pending invitations for this user's email
    const invitations = await prisma.organizationInvitation.findMany({
      where: {
        email: user.email,
        status: 'pending',
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filter out invitations from current organization
    const externalInvitations = invitations.filter(
      inv => inv.organizationId !== user.organizationId
    )

    return successResponse({ 
      invitations: externalInvitations,
      count: externalInvitations.length 
    })
  } catch (error: any) {
    console.error('[API] Get my invitations error:', error)
    return errorResponse(error.message || 'Failed to fetch invitations', 500)
  }
}
