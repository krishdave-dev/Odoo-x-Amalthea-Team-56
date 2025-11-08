import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { errorResponse, successResponse } from '@/lib/response'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/services/notification.service'

/**
 * POST /api/invitations/[id]/accept-member
 * Accept an invitation for existing user (adds them to organization)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    const invitationId = parseInt(params.id)
    if (isNaN(invitationId)) {
      return errorResponse('Invalid invitation ID', 400)
    }

    // Get invitation
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { id: invitationId },
      include: {
        organization: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true } },
      },
    })

    if (!invitation) {
      return errorResponse('Invitation not found', 404)
    }

    // Verify invitation is for this user's email
    if (invitation.email !== user.email) {
      return errorResponse('This invitation is not for you', 403)
    }

    // Check invitation status
    if (invitation.status !== 'pending') {
      return errorResponse(`Invitation is ${invitation.status}`, 400)
    }

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      await prisma.organizationInvitation.update({
        where: { id: invitationId },
        data: { status: 'expired' },
      })
      return errorResponse('Invitation has expired', 400)
    }

    // Check if user is already in the organization
    if (user.organizationId === invitation.organizationId) {
      return errorResponse('You are already a member of this organization', 400)
    }

    // Accept invitation - update user's organization and role
    const updatedUser = await prisma.$transaction(async (tx: any) => {
      // Update invitation status
      await tx.organizationInvitation.update({
        where: { id: invitationId },
        data: { status: 'accepted' },
      })

      // Update user's organization and role
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationId: true,
        },
      })

      // Create audit event
      await tx.event.create({
        data: {
          organizationId: invitation.organizationId,
          entityType: 'user',
          entityId: user.id,
          eventType: 'user.joined_via_invitation',
          payload: {
            userId: user.id,
            invitationId,
            role: invitation.role,
          },
        },
      })

      return updated
    })

    // Notify the person who sent the invitation
    await NotificationService.notifyInvitationAccepted(
      invitation.organizationId,
      invitation.invitedById,
      user.name || user.email,
      invitation.role
    )

    return successResponse({
      message: `Successfully joined ${invitation.organization.name}`,
      user: updatedUser,
      organization: invitation.organization,
    })
  } catch (error: any) {
    console.error('[API] Accept invitation error:', error)
    return errorResponse(error.message || 'Failed to accept invitation', 500)
  }
}
