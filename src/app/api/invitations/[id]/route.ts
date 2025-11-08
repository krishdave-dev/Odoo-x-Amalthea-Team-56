import { NextResponse } from 'next/server'
import { invitationService } from '@/services/invitation.service'
import { getCurrentUser } from '@/lib/session'
import { can } from '@/lib/permissions'
import { successResponse, errorResponse } from '@/lib/response'
import { handleError } from '@/lib/error'

/**
 * DELETE /api/invitations/[id]
 * Revoke/cancel an invitation
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Authentication required', 401)
    }

    // Check permission
    if (!can(user.role, 'canInviteUsers')) {
      return errorResponse('Insufficient permissions to revoke invitations', 403)
    }

    const invitationId = parseInt(params.id)
    if (isNaN(invitationId)) {
      return errorResponse('Invalid invitation ID', 400)
    }

    const success = await invitationService.revokeInvitation(
      invitationId,
      user.organizationId
    )

    if (!success) {
      return errorResponse('Failed to revoke invitation', 404)
    }

    return successResponse({ message: 'Invitation revoked successfully' })
  } catch (error) {
    return handleError(error)
  }
}
