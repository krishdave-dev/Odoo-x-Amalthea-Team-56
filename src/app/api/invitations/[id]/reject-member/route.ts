import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { errorResponse, successResponse } from '@/lib/response'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/services/notification.service'

/**
 * POST /api/invitations/[id]/reject-member
 * Reject an invitation for existing user
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

    // Reject invitation
    await prisma.$transaction(async (tx: any) => {
      // Update invitation status
      await tx.organizationInvitation.update({
        where: { id: invitationId },
        data: { status: 'rejected' },
      })

      // Create audit event
      await tx.event.create({
        data: {
          organizationId: invitation.organizationId,
          entityType: 'invitation',
          entityId: invitationId,
          eventType: 'invitation.rejected',
          payload: {
            email: invitation.email,
            userId: user.id,
          },
        },
      })
    })

    // Notify the person who sent the invitation
    await NotificationService.notifyInvitationRejected(
      invitation.organizationId,
      invitation.invitedById,
      user.name || user.email,
      invitation.role
    )

    return successResponse({
      message: `Invitation declined`,
    })
  } catch (error: any) {
    console.error('[API] Reject invitation error:', error)
    return errorResponse(error.message || 'Failed to reject invitation', 500)
  }
}
